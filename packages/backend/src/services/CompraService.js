import { Compra } from "../domain/entities/Compra.js";
import { CambioEstadoCompra } from "../domain/entities/CambioEstadoCompra.js";
import { EstadoCompra } from "../domain/enums/EstadoCompra.js";
import {
  DatosInvalidosError,
  NoEncontradoError,
  ReglaDeNegocioError,
  SinCupoError,
} from "../domain/errors/ErroresDeDominio.js";
import { CompraRepository } from "../repositories/CompraRepository.js";
import { EventoService } from "./EventoService.js";
import { paginar } from "../utils/paginar.js";

const resumenUsuario = (usuario) => ({ id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido });

// Las más recientes primero
const porFechaDeCompraDesc = (a, b) =>
  b.cambiosDeEstado[0].fechaHora.getTime() - a.cambiosDeEstado[0].fechaHora.getTime();

export class CompraService {
  constructor(compraRepository = new CompraRepository(), eventoService = new EventoService()) {
    this.compraRepository = compraRepository;
    this.eventoService = eventoService;
  }

  toDTO(compra, ahora = new Date()) {
    return {
      id: compra.id,
      evento: { id: compra.evento.id, nombre: compra.evento.nombre, fecha: compra.evento.fecha.toISOString() },
      tipoEntrada: { id: compra.tipoEntrada.id, nombre: compra.tipoEntrada.nombre },
      cantidad: compra.cantidad,
      // El precio que se pagó, que no cambia aunque después se edite el del tipo de entrada
      precioUnitario: compra.total / compra.cantidad,
      total: compra.total,
      estado: compra.estado,
      diasParaElEvento: compra.diasParaElEvento(ahora),
      comprador: resumenUsuario(compra.comprador),
      historial: compra.cambiosDeEstado.map((cambio) => ({
        estado: cambio.estado,
        fechaHora: cambio.fechaHora.toISOString(),
        quien: resumenUsuario(cambio.quien),
      })),
    };
  }

  paginarCompras(compras, { estado, page, limit }, ahora) {
    const filtradas = compras.filter((compra) => !estado || compra.estado === estado).sort(porFechaDeCompraDesc);
    return paginar(filtradas.map((compra) => this.toDTO(compra, ahora)), { page, limit });
  }

  // Comprar entradas (C7). Es un caso de uso del service porque coordina evento, tipo de entrada y
  // las demás compras para calcular el cupo (decisión 16). El comprador es el usuario identificado.
  comprar = async ({ eventoId, tipoEntradaId, cantidad }, comprador, ahora = new Date()) => {
    const evento = await this.eventoService.buscarEvento(eventoId);

    const tipoEntrada = evento.tipoEntrada(tipoEntradaId);
    if (!tipoEntrada) {
      throw new DatosInvalidosError(`El tipo de entrada ${tipoEntradaId} no pertenece al evento ${eventoId}`);
    }

    if (evento.yaSeRealizo(ahora)) {
      throw new ReglaDeNegocioError("No se pueden comprar entradas de un evento que ya se realizó");
    }

    const ocupadas = await this.compraRepository.entradasOcupadas(tipoEntrada.id);
    if (!tipoEntrada.hayCupoPara(cantidad, ocupadas)) {
      throw new SinCupoError(tipoEntrada, cantidad, tipoEntrada.disponibles(ocupadas));
    }

    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada,
      cantidad,
      cambiosDeEstado: [new CambioEstadoCompra({ estado: EstadoCompra.PENDIENTE_DE_PAGO, quien: comprador, fechaHora: ahora })],
    });
    return this.toDTO(await this.compraRepository.save(compra), ahora);
  };

  // Mis compras (C1): solo las del comprador identificado
  misCompras = async (comprador, filtros, ahora = new Date()) => {
    const compras = await this.compraRepository.findByComprador(comprador.id);
    return this.paginarCompras(compras, filtros, ahora);
  };

  getById = async (id, ahora = new Date()) => {
    return this.toDTO(await this.buscarCompra(id), ahora);
  };

  buscarCompra = async (id) => {
    const compra = await this.compraRepository.findById(id);
    if (!compra) {
      throw new NoEncontradoError(`No existe una compra con id ${id}`);
    }
    return compra;
  };

  // Confirmar, cancelar, usar y reembolsar. Quién puede hacer cada una lo controlan las rutas;
  // las reglas de estado y de fecha las valida Compra (decisiones 15 y 18).
  cambiarEstado = async (id, nuevoEstado, usuario, ahora = new Date()) => {
    const compra = await this.buscarCompra(id);
    compra.actualizarEstado(nuevoEstado, usuario, ahora);
    return this.toDTO(await this.compraRepository.update(compra), ahora);
  };

  // Compras de un evento (O1), con las entradas disponibles de cada tipo
  comprasDelEvento = async (eventoId, filtros, ahora = new Date()) => {
    const evento = await this.eventoService.buscarEvento(eventoId);
    const compras = await this.compraRepository.findByEvento(evento.id);

    const disponibilidad = [];
    for (const tipo of evento.tiposEntrada) {
      const ocupadas = await this.compraRepository.entradasOcupadas(tipo.id);
      disponibilidad.push({
        tipoEntrada: { id: tipo.id, nombre: tipo.nombre },
        cupo: tipo.cupo,
        ocupadas,
        disponibles: tipo.disponibles(ocupadas),
      });
    }

    return { evento: { id: evento.id, nombre: evento.nombre }, disponibilidad, compras: this.paginarCompras(compras, filtros, ahora) };
  };
}
