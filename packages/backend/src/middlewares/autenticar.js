import { AuthService } from "../services/AuthService.js";
import { NoAutenticadoError, SinPermisoError } from "../errors/ErroresDeAutorizacion.js";

const authService = new AuthService();

// Autenticación (clase 10, decisión 42): ¿quién sos? Lee el token del header
// "Authorization: Bearer <token>", verifica la firma y el vencimiento y deja al usuario en req.usuario.
// Sin token, con un token inválido o vencido: 401. Las rutas y los controllers no cambiaron respecto del header provisorio.
export async function autenticar(req, _res, next) {
  const encabezado = req.get("authorization") ?? "";
  const [tipo, token] = encabezado.split(" ");
  if (tipo !== "Bearer" || !token) {
    throw new NoAutenticadoError("Tenés que iniciar sesión (falta el header Authorization: Bearer <token>)");
  }

  req.usuario = await authService.usuarioDelToken(token);
  next();
}

// Autorización por rol (el requireRole de la clase): ¿qué podés hacer? Se usa DESPUÉS de autenticar.
export const autorizarRol = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.usuario?.rol)) {
    throw new SinPermisoError(`Esta acción solo la puede realizar un usuario ${roles.join(" o ")}`);
  }
  next();
};
