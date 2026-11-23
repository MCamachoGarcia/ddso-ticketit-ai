import { UsuarioRepository } from "../repositories/UsuarioRepository.js";
import { NoAutenticadoError, SinPermisoError } from "../errors/ErroresDeAutorizacion.js";

const usuarioRepository = new UsuarioRepository();

// PROVISORIO hasta implementar el login con JWT (decisión 23): el usuario se identifica con el header
// x-usuario-id. Cuando llegue el JWT solo cambia esta función; las rutas y los controllers siguen igual.
export async function autenticar(req, _res, next) {
  const usuarioId = req.get("x-usuario-id");
  if (!usuarioId) {
    throw new NoAutenticadoError("Falta identificar al usuario (header x-usuario-id)");
  }

  const usuario = await usuarioRepository.findById(usuarioId);
  if (!usuario) {
    throw new NoAutenticadoError(`No existe un usuario con id ${usuarioId}`);
  }

  req.usuario = usuario;
  next();
}

// Se usa DESPUÉS de autenticar: deja pasar solo a los roles indicados
export const autorizarRol = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.usuario?.rol)) {
    throw new SinPermisoError(`Esta acción solo la puede realizar un usuario ${roles.join(" o ")}`);
  }
  next();
};
