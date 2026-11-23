import jwt from "jsonwebtoken";
import { secretoJwt } from "../../src/config/autenticacion.js";

// Header Authorization con un token válido para el usuario de ese id (decisión 42).
// Los tests firman el token directo en lugar de hacer login: así cada caso prueba su ruta, no el login.
export const bearer = (usuarioId, opciones = { expiresIn: "1h" }) =>
  `Bearer ${jwt.sign({ sub: String(usuarioId) }, secretoJwt(), opciones)}`;
