import api from "./api";

// Chat de una compra (C3, O3; decisión 26). Lo usan el comprador y el organizador del evento.

// Los últimos `limit` mensajes en orden cronológico; con `antes` (ISO), los anteriores a esa fecha.
// Devuelve { mensajes, hayAnteriores }.
export const obtenerMensajes = (compraId, { antes, limit = 30 } = {}) =>
  api.get(`/compras/${compraId}/mensajes`, { params: { limit, ...(antes && { antes }) } }).then((r) => r.data);

// Se envía por REST; a quienes tienen el chat abierto les llega por el WebSocket
export const enviarMensaje = (compraId, mensaje) =>
  api.post(`/compras/${compraId}/mensajes`, { mensaje }).then((r) => r.data);
