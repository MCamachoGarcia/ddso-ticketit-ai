import axios from "axios";
import { API_URL } from "./configuracion";

// Una sola instancia de axios para toda la app (como en el TP)
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

// Interceptores de axios (clase 10, decisión 42): los services no saben nada de tokens.
let tokenActual = null;
let alVencerLaSesion = () => {};

// La sesión avisa qué token usar (o null al salir)
export function usarToken(token) {
  tokenActual = token;
}

// La sesión registra qué hacer si el backend responde 401 a un pedido con token: cerrar la sesión
export function alResponderNoAutenticado(callback) {
  alVencerLaSesion = callback;
}

// Request: cada pedido lleva "Authorization: Bearer <token>" si hay sesión
api.interceptors.request.use((config) => {
  if (tokenActual) config.headers.Authorization = `Bearer ${tokenActual}`;
  return config;
});

// Response: un 401 con token significa que venció o dejó de valer → se cierra la sesión en un solo lugar.
// (Un 401 sin token, como el de una contraseña incorrecta en el login, lo maneja la pantalla que lo pidió.)
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      alVencerLaSesion(error.response.data?.error);
    }
    return Promise.reject(error);
  },
);

export default api;
