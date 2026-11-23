import { Evento } from "../domain/entities/Evento.js";
import { TipoEntrada } from "../domain/entities/TipoEntrada.js";
import {
  DatosInvalidosError,
  NoEncontradoError,
  ReglaDeNegocioError,
} from "../domain/errors/ErroresDeDominio.js";
import { EventoRepository } from "../repositories/EventoRepository.js";
import { CompraRepository } from "../repositories/CompraRepository.js";
import { ReseniaRepository } from "../repositories/ReseniaRepository.js";
import { CategoriaService } from "./CategoriaService.js";
import { paginar } from "../utils/paginar.js";
import { calcularPuntaje } from "../utils/puntaje.js";

// Quita mayúsculas y tildes para que buscar "musica" encuentre "Música"
const normalizar = (texto) =>
  texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const SIN_PUNTAJE = { promedio: null, cantidad: 0 };

// Qué valor se compara según el criterio de orden elegido. null = sin dato (va siempre al final).
const VALOR_PARA_ORDENAR = {
  fecha: (evento) => evento.fecha.getTime(),
  precio: (evento) => evento.precioMinimo(),
  puntaje: (evento, puntajes) => puntajes.get(evento.organizador.id)?.promedio ?? null,
};

export class EventoService {
  // Usa los repositorios de compras y reseñas (no sus services) para el cupo vendido y el puntaje del organizador.
  // Así EventoService no depende de CompraService ni de ReseniaService, que sí dependen de él.
  constructor(
    eventoRepository = new EventoRepository(),
    categoriaService = new CategoriaService(),
    compraRepository = new CompraRepository(),
    reseniaRepository = new ReseniaRepository(),
  ) {
    this.eventoRepository = eventoRepository;
    this.categoriaService = categoriaService;
    this.compraRepository = compraRepository;
    this.reseniaRepository = reseniaRepository;
  }

  // Puntaje de cada organizador (promedio de las reseñas de todos sus eventos), en una sola pasada
  async puntajesPorOrganizador() {
    const resenias = await this.reseniaRepository.findAll();
    const porOrganizador = new Map();
    for (const resenia of resenias) {
      const id = resenia.evento.organizador.id;
      if (!porOrganizador.has(id)) porOrganizador.set(id, []);
      porOrganizador.get(id).push(resenia);
    }
    return new Map([...porOrganizador].map(([id, lista]) => [id, calcularPuntaje(lista)]));
  }

  async puntajeDe(organizador) {
    return calcularPuntaje(await this.reseniaRepository.findByOrganizador(organizador.id));
  }

  // puntaje: la reputación del organizador, que el comprador ve antes de comprar (C6)
  toDTO(evento, puntaje = SIN_PUNTAJE) {
    return {
      id: evento.id,
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      categoria: { id: evento.categoria.id, nombre: evento.categoria.nombre },
      fecha: evento.fecha.toISOString(),
      multimedia: evento.multimedia,
      // Solo los datos públicos del organizador: nunca su email ni su passwordHash
      organizador: {
        id: evento.organizador.id,
        nombre: evento.organizador.nombre,
        apellido: evento.organizador.apellido,
        puntaje,
      },
      precioDesde: evento.precioMinimo(),
      tiposEntrada: evento.tiposEntrada.map((tipo) => ({
        id: tipo.id,
        nombre: tipo.nombre,
        descripcion: tipo.descripcion,
        precio: tipo.precio,
        cupo: tipo.cupo,
      })),
    };
  }

  // Búsqueda de eventos (C2): solo próximos, con filtros opcionales, ordenados y paginados
  buscar = async (filtros, ahora = new Date()) => {
    const { texto, categoriaId, precioMin = 0, precioMax = Infinity, orden, direccion, page, limit } = filtros;
    const eventos = await this.eventoRepository.findAll();

    const encontrados = eventos
      .filter((evento) => !evento.yaSeRealizo(ahora))
      .filter((evento) => !categoriaId || evento.categoria.id === categoriaId)
      .filter((evento) => evento.tuPrecioEstaEntre(precioMin, precioMax))
      .filter((evento) => !texto || this.coincideConTexto(evento, texto));

    const puntajes = await this.puntajesPorOrganizador();
    const valor = (evento) => VALOR_PARA_ORDENAR[orden](evento, puntajes);
    const sentido = direccion === "desc" ? -1 : 1;
    const porFecha = (a, b) => a.fecha.getTime() - b.fecha.getTime();

    encontrados.sort((a, b) => {
      const [valorA, valorB] = [valor(a), valor(b)];
      // Sin dato (por ejemplo, un organizador sin reseñas) va siempre al final, en cualquier dirección
      if (valorA === null || valorB === null) {
        return (valorA === null) - (valorB === null) || porFecha(a, b);
      }
      // A igual valor, desempata por fecha para que el orden sea siempre el mismo
      return sentido * (valorA - valorB) || porFecha(a, b);
    });

    return paginar(
      encontrados.map((evento) => this.toDTO(evento, puntajes.get(evento.organizador.id))),
      { page, limit },
    );
  };

  // Mis eventos (organizador): los suyos, incluidos los que ya se realizaron (para ver sus compras y reseñas).
  // Primero los próximos, del más cercano al más lejano; después los realizados, del más reciente al más viejo.
  misEventos = async (organizador, { cuando = "todos", page, limit }, ahora = new Date()) => {
    const eventos = await this.eventoRepository.findAll();
    const suyos = eventos.filter((evento) => evento.organizador.id === organizador.id);

    const proximos = suyos.filter((evento) => !evento.yaSeRealizo(ahora)).sort((a, b) => a.fecha - b.fecha);
    const realizados = suyos.filter((evento) => evento.yaSeRealizo(ahora)).sort((a, b) => b.fecha - a.fecha);
    const elegidos = { todos: [...proximos, ...realizados], proximos, realizados }[cuando];

    const puntaje = await this.puntajeDe(organizador);
    return paginar(
      elegidos.map((evento) => ({ ...this.toDTO(evento, puntaje), realizado: evento.yaSeRealizo(ahora) })),
      { page, limit },
    );
  };

  // Busca en el nombre, la descripción y la categoría: "musica" encuentra los recitales aunque no lo digan
  coincideConTexto(evento, texto) {
    const buscado = normalizar(texto);
    return [evento.nombre, evento.descripcion, evento.categoria.nombre].some((campo) =>
      normalizar(campo).includes(buscado),
    );
  }

  // Detalle de un evento: se puede ver aunque ya haya pasado (por ejemplo, desde una compra)
  getById = async (id) => {
    const evento = await this.buscarEvento(id);
    return this.toDTO(evento, await this.puntajeDe(evento.organizador));
  };

  buscarEvento = async (id) => {
    const evento = await this.eventoRepository.findById(id);
    if (!evento) {
      throw new NoEncontradoError(`No existe un evento con id ${id}`);
    }
    return evento;
  };

  // Crear un evento (O2): el organizador es el usuario que hace el pedido, nunca un dato del body
  crear = async (datos, organizador, ahora = new Date()) => {
    const categoria = await this.categoriaService.buscarCategoria(datos.categoriaId);

    // Se valida antes de armar el evento. Misma regla que Evento.yaSeRealizo: empieza a contar desde su hora de inicio
    if (datos.fecha <= ahora) {
      throw new DatosInvalidosError("La fecha del evento debe ser futura");
    }

    const evento = new Evento({
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      categoria,
      fecha: datos.fecha,
      multimedia: datos.multimedia,
      organizador,
      tiposEntrada: datos.tiposEntrada.map((tipo) => new TipoEntrada(tipo)),
    });

    return this.toDTO(await this.eventoRepository.save(evento), await this.puntajeDe(organizador));
  };

  // Editar un evento (PUT): recibe el evento completo. Que el usuario sea su organizador lo controla la ruta.
  // Todo se valida ANTES de modificar nada: el evento en memoria es el mismo objeto que está guardado.
  actualizar = async (id, datos, ahora = new Date()) => {
    const evento = await this.buscarEvento(id);

    if (evento.yaSeRealizo(ahora)) {
      throw new ReglaDeNegocioError("No se puede editar un evento que ya se realizó");
    }

    const categoria = await this.categoriaService.buscarCategoria(datos.categoriaId);

    // Misma regla que al crear (y que Evento.yaSeRealizo): la nueva fecha tiene que ser futura
    if (datos.fecha <= ahora) {
      throw new DatosInvalidosError("La fecha del evento debe ser futura");
    }

    await this.validarTiposEntradaEditados(evento, datos.tiposEntrada);

    // Recién acá se aplican los cambios: los tipos con id se modifican y los que no tienen id se agregan
    Object.assign(evento, {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      categoria,
      fecha: datos.fecha,
      multimedia: datos.multimedia,
      tiposEntrada: datos.tiposEntrada.map(({ id: tipoId, ...cambios }) =>
        tipoId ? Object.assign(evento.tipoEntrada(tipoId), cambios) : new TipoEntrada(cambios),
      ),
    });

    return this.toDTO(await this.eventoRepository.update(evento), await this.puntajeDe(evento.organizador));
  };

  // Los tipos de entrada se pueden modificar y agregar, pero no quitar (decisión 24),
  // y el cupo de cada uno no puede quedar por debajo de las entradas ya vendidas (decisión 25)
  async validarTiposEntradaEditados(evento, tiposEditados) {
    const idsEnviados = tiposEditados.filter((tipo) => tipo.id).map((tipo) => tipo.id);

    const ajeno = idsEnviados.find((tipoId) => !evento.tipoEntrada(tipoId));
    if (ajeno) {
      throw new DatosInvalidosError(`El tipo de entrada ${ajeno} no pertenece a este evento`);
    }

    const quitados = evento.tiposEntrada.filter((tipo) => !idsEnviados.includes(tipo.id));
    if (quitados.length > 0) {
      const nombres = quitados.map((tipo) => `${tipo.nombre} (id ${tipo.id})`).join(", ");
      throw new ReglaDeNegocioError(`No se pueden quitar tipos de entrada de un evento. Faltan: ${nombres}`);
    }

    for (const tipo of tiposEditados.filter((editado) => editado.id)) {
      const ocupadas = await this.compraRepository.entradasOcupadas(tipo.id);
      if (tipo.cupo < ocupadas) {
        throw new ReglaDeNegocioError(
          `El cupo de ${tipo.nombre} no puede ser menor a las ${ocupadas} entradas ya vendidas`,
        );
      }
    }
  }
}
