import { permisosService } from "../services/PermisosService.js";

// Controles de pertenencia. Se usan DESPUÉS de autenticar (y de autorizarRol) sobre el :id de la ruta.
const exigir = (control) => async (req, _res, next) => {
  await permisosService[control](req.usuario, req.params.id);
  next();
};

// /eventos/:id: el evento tiene que ser del usuario
export const exigirOrganizadorDelEvento = exigir("exigirOrganizadorDelEvento");

// /compras/:id: la compra tiene que ser del usuario
export const exigirCompradorDeLaCompra = exigir("exigirCompradorDeLaCompra");

// /compras/:id: el usuario tiene que ser el organizador del evento de la compra
export const exigirOrganizadorDeLaCompra = exigir("exigirOrganizadorDeLaCompra");

// /compras/:id: el comprador o el organizador del evento
export const exigirParticipanteDeLaCompra = exigir("exigirParticipanteDeLaCompra");
