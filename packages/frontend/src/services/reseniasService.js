import api from "./api";

// Reseñas (decisión 27). Ver es público; reseñar, solo un comprador que usó una entrada del evento.
// Los listados traen { promedio, cantidad, resenias: { resultados, page, totalPages, ... } }, las más recientes primero.

export const obtenerReseniasDeOrganizador = (organizadorId, page = 1, limit = 10) =>
  api.get(`/organizadores/${organizadorId}/resenias`, { params: { page, limit } }).then((r) => r.data);

export const obtenerReseniasDeEvento = (eventoId, page = 1, limit = 10) =>
  api.get(`/eventos/${eventoId}/resenias`, { params: { page, limit } }).then((r) => r.data);

export const reseniar = (eventoId, { puntuacion, detalle }) =>
  api.post(`/eventos/${eventoId}/resenias`, { puntuacion, detalle }).then((r) => r.data);
