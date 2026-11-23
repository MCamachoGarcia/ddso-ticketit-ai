// Mensaje del chat de una compra, entre el comprador y el organizador del evento
export class Mensaje {
  constructor({ usuario, mensaje, enviado = new Date() }) {
    this.usuario = usuario;
    this.mensaje = mensaje;
    this.enviado = enviado;
  }
}
