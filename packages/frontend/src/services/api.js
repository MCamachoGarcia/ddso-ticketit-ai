import axios from "axios";
import { API_URL } from "./configuracion";

// Una sola instancia de axios para toda la app (como en el TP)
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

// PROVISORIO hasta el login con JWT (decisión 23): cada pedido lleva el id del usuario elegido.
// Con el login, esto pasa a ser el header Authorization: Bearer <token>; las pantallas no cambian.
export function usarUsuario(usuarioId) {
  if (usuarioId) api.defaults.headers.common["x-usuario-id"] = usuarioId;
  else delete api.defaults.headers.common["x-usuario-id"];
}

export default api;
