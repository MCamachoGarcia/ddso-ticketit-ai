import api from "./api";

// Autenticación (decisión 42). Ingresar y registrarse devuelven { token, usuario }.

export const ingresar = ({ email, password }) => api.post("/auth/login", { email, password }).then((r) => r.data);

export const registrarse = ({ nombre, apellido, email, password, rol }) =>
  api.post("/auth/registro", { nombre, apellido, email, password, rol }).then((r) => r.data);

// El usuario del token: al abrir la app, para saber si la sesión guardada sigue vigente
export const quienSoy = () => api.get("/auth/me").then((r) => r.data);
