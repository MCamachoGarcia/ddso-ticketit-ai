import api from "./api";

// Llamadas al backend sobre eventos y categorías (como los services del TP).
// Devuelven directamente los datos (r.data): React Query no necesita la respuesta completa de axios.

// Búsqueda pública: solo eventos próximos, paginada ({ resultados, page, totalPages, ... })
export const buscarEventos = (filtros, page) =>
  api.get("/eventos", { params: { ...filtros, page } }).then((r) => r.data);

// Mis eventos (organizador): cuando es "proximos" (el más cercano primero) o "realizados" (el más reciente primero)
export const obtenerMisEventos = (cuando, page = 1, limit = 10) =>
  api.get("/eventos/mios", { params: { cuando, page, limit } }).then((r) => r.data);

export const obtenerEvento =(id) => api.get(`/eventos/${id}`).then((r) => r.data);

// Lista fija y chica: no está paginada
export const obtenerCategorias = () => api.get("/categorias").then((r) => r.data);
