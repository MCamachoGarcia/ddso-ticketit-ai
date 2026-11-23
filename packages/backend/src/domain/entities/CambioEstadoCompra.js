// Un paso del historial de una compra: a qué estado llegó, quién la llevó ahí y cuándo.
// Vive dentro de la Compra (Compra.cambiosDeEstado), por eso no guarda una referencia a ella.
export class CambioEstadoCompra {
  constructor({ id = null, estado, quien, fechaHora = new Date() }) {
    this.id = id;
    this.estado = estado;
    this.quien = quien;
    this.fechaHora = fechaHora;
  }
}
