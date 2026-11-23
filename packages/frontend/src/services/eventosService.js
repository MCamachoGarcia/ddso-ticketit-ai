import api from "./api";

// Llamadas al backend sobre eventos y categorías (como los services del TP).
// Devuelven directamente los datos (r.data): React Query no necesita la respuesta completa de axios.

// Búsqueda pública: solo eventos próximos, paginada ({ resultados, page, totalPages, ... })
export const buscarEventos = (filtros, page) =>
  api.get("/eventos", { params: { ...filtros, page } }).then((r) => r.data);

export const obtenerEvento = (id) => api.get(`/eventos/${id}`).then((r) => r.data);

// Lista fija y chica: no está paginada
export const obtenerCategorias = () => api.get("/categorias").then((r) => r.data);
