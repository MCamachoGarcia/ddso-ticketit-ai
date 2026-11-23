// Mensaje del chat de una compra, entre el comprador y el organizador del evento.
// Tiene id para que la app no lo muestre dos veces si le llega por REST y por WebSocket (decisión 26).
export class Mensaje {
  constructor({ id = null, usuario, mensaje, enviado = new Date() }) {
    this.id = id;
    this.usuario = usuario;
    this.mensaje = mensaje;
    this.enviado = enviado;
  }
}
