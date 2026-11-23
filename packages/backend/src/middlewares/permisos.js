import { permisosService } from "../services/PermisosService.js";

// Se usa DESPUÉS de autenticar y autorizarRol: el evento de la ruta (/:id) tiene que ser del usuario
export async function exigirOrganizadorDelEvento(req, _res, next) {
  await permisosService.exigirOrganizadorDelEvento(req.usuario, req.params.id);
  next();
}
