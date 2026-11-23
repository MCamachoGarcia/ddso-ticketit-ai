import { EstadoCompra } from "../enums/EstadoCompra.js";
import { CambioEstadoCompra } from "./CambioEstadoCompra.js";
import {
  ReglaDeNegocioError,
  TransicionDeEstadoInvalidaError,
} from "../errors/ErroresDeDominio.js";

// A qué estados se puede pasar desde cada estado. UTILIZADA y REEMBOLSADA son finales.
const TRANSICIONES_PERMITIDAS = Object.freeze({
  [EstadoCompra.PENDIENTE_DE_PAGO]: [EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA],
  [EstadoCompra.CONFIRMADA]: [EstadoCompra.UTILIZADA, EstadoCompra.CANCELADA],
  [EstadoCompra.CANCELADA]: [EstadoCompra.REEMBOLSADA],
  [EstadoCompra.UTILIZADA]: [],
  [EstadoCompra.REEMBOLSADA]: [],
});

export class Compra {
  constructor({
    id = null,
    comprador,
    evento,
    tipoEntrada,
    cantidad,
    // Se guarda el total al momento de comprar, para que no cambie si después se modifica el precio
    total = tipoEntrada.precio * cantidad,
    estado = EstadoCompra.PENDIENTE_DE_PAGO,
    mensajes = [],
    // Al crear la compra, el historial arranca con su estado inicial, registrado por el comprador
    cambiosDeEstado = [new CambioEstadoCompra({ estado, quien: comprador })],
  }) {
    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.tipoEntrada = tipoEntrada;
    this.cantidad = cantidad;
    this.total = total;
    this.estado = estado;
    this.mensajes = mensajes;
    this.cambiosDeEstado = cambiosDeEstado;
  }

  // Valida la transición, cambia el estado y deja registrado quién lo hizo y cuándo
  actualizarEstado(nuevoEstado, quien, fechaHora = new Date()) {
    if (!TRANSICIONES_PERMITIDAS[this.estado]?.includes(nuevoEstado)) {
      throw new TransicionDeEstadoInvalidaError(this.estado, nuevoEstado);
    }
    // La compra le pregunta a su evento: la regla es de la compra, el dato es del evento (decisión 17)
    const eventoRealizado = this.evento.yaSeRealizo(fechaHora);
    if (nuevoEstado === EstadoCompra.CONFIRMADA && eventoRealizado) {
      throw new ReglaDeNegocioError("No se puede pagar una compra de un evento que ya se realizó");
    }
    if (nuevoEstado === EstadoCompra.CANCELADA && eventoRealizado) {
      throw new ReglaDeNegocioError("No se puede cancelar una compra de un evento que ya se realizó");
    }
    if (nuevoEstado === EstadoCompra.UTILIZADA && !eventoRealizado) {
      throw new ReglaDeNegocioError("No se puede usar una entrada antes de que empiece el evento");
    }
    if (nuevoEstado === EstadoCompra.REEMBOLSADA && !this.fuePagada()) {
      throw new ReglaDeNegocioError("No se puede reembolsar una compra que nunca se pagó");
    }

    this.estado = nuevoEstado;
    this.cambiosDeEstado.push(new CambioEstadoCompra({ estado: nuevoEstado, quien, fechaHora }));
  }

  // Se pagó si en algún momento llegó a CONFIRMADA, aunque después se haya cancelado
  fuePagada() {
    return this.cambiosDeEstado.some((cambio) => cambio.estado === EstadoCompra.CONFIRMADA);
  }

  // Cuándo llegó la compra a un estado, o null si nunca pasó por él
  fechaDeEstado(estado) {
    return this.cambiosDeEstado.find((cambio) => cambio.estado === estado)?.fechaHora ?? null;
  }
}
