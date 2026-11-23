import api from "./api";

// Llamadas al backend sobre compras (decisión 25)

// Comprar entradas: la compra nace PENDIENTE_DE_PAGO y reserva el cupo. El comprador es el usuario identificado.
export const comprar = ({ eventoId, tipoEntradaId, cantidad }) =>
  api.post("/compras", { eventoId, tipoEntradaId, cantidad }).then((r) => r.data);

// Mis compras (C4): las del comprador identificado, las más recientes primero. Filtro opcional por estado.
export const obtenerMisCompras = ({ estado } = {}, page = 1, limit = 10) =>
  api.get("/compras", { params: { page, limit, ...(estado && { estado }) } }).then((r) => r.data);
