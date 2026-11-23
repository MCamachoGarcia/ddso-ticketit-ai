import api from "./api";

// Favoritos del comprador identificado (decisión 29)

export const obtenerFavoritos = (page = 1, limit = 50) =>
  api.get("/eventos/favoritos", { params: { page, limit } }).then((r) => r.data);

// PUT y DELETE responden 204 sin cuerpo: no hay nada que devolver
export const marcarFavorito = (eventoId) => api.put(`/eventos/${eventoId}/favorito`);

export const quitarFavorito = (eventoId) => api.delete(`/eventos/${eventoId}/favorito`);
