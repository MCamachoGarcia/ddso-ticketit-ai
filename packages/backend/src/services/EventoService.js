import { Evento } from "../domain/entities/Evento.js";
import { TipoEntrada } from "../domain/entities/TipoEntrada.js";
import {
  DatosInvalidosError,
  NoEncontradoError,
  ReglaDeNegocioError,
} from "../domain/errors/ErroresDeDominio.js";
import { EventoRepository } from "../repositories/EventoRepository.js";
import { CompraRepository } from "../repositories/CompraRepository.js";
import { CategoriaService } from "./CategoriaService.js";
import { paginar } from "../utils/paginar.js";

// Quita mayúsculas y tildes para que buscar "musica" encuentre "Música"
const normalizar = (texto) =>
  texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// Qué valor se compara según el criterio de orden elegido
const VALOR_PARA_ORDENAR = {
  fecha: (evento) => evento.fecha.getTime(),
  precio: (evento) => evento.precioMinimo(),
};

export class EventoService {
  // Usa el repositorio de compras (no su service) para saber cuántas entradas se vendieron al editar el cupo.
  // Así EventoService y CompraService no dependen uno del otro.
  constructor(
    eventoRepository = new EventoRepository(),
    categoriaService = new CategoriaService(),
    compraRepository = new CompraRepository(),
  ) {
    this.eventoRepository = eventoRepository;
    this.categoriaService = categoriaService;
    this.compraRepository = compraRepository;
  }

  toDTO(evento) {
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

    const valor = VALOR_PARA_ORDENAR[orden];
    const sentido = direccion === "desc" ? -1 : 1;
    // A igual valor, desempata por fecha para que el orden sea siempre el mismo
    encontrados.sort(
      (a, b) => sentido * (valor(a) - valor(b)) || a.fecha.getTime() - b.fecha.getTime(),
    );

    return paginar(encontrados.map((evento) => this.toDTO(evento)), { page, limit });
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
    return this.toDTO(await this.buscarEvento(id));
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

    return this.toDTO(await this.eventoRepository.save(evento));
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

    return this.toDTO(await this.eventoRepository.update(evento));
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
