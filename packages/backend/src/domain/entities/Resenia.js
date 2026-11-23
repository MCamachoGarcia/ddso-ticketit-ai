export class Resenia {
  // puntuacion: entero de 1 a 5 (decisión 27). fecha: cuándo se escribió, para listar las más recientes primero.
  constructor({ id = null, comprador, evento, detalle, puntuacion, fecha = new Date() }) {
    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.detalle = detalle;
    this.puntuacion = puntuacion;
    this.fecha = fecha;
  }
}
