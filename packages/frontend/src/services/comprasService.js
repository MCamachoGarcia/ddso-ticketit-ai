import api from "./api";

// Llamadas al backend sobre compras (decisión 25)

// Comprar entradas: la compra nace PENDIENTE_DE_PAGO y reserva el cupo. El comprador es el usuario identificado.
export const comprar = ({ eventoId, tipoEntradaId, cantidad }) =>
  api.post("/compras", { eventoId, tipoEntradaId, cantidad }).then((r) => r.data);

// Mis compras (C4): las del comprador identificado, las más recientes primero. Filtro opcional por estado.
export const obtenerMisCompras = ({ estado } = {}, page = 1, limit = 10) =>
  api.get("/compras", { params: { page, limit, ...(estado && { estado }) } }).then((r) => r.data);

// Una compra con su historial. La pueden ver su comprador y el organizador del evento.
export const obtenerCompra = (id) => api.get(`/compras/${id}`).then((r) => r.data);

// Cambiar el estado: una ruta por acción ("confirmar", "cancelar", "utilizar" o "reembolsar"). Devuelve la compra actualizada.
export const cambiarEstadoCompra = (id, accion) => api.post(`/compras/${id}/${accion}`).then((r) => r.data);
