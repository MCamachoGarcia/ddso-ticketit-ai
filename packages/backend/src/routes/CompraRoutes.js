import express from "express";
import { CompraController } from "../controllers/CompraController.js";
import { CompraService } from "../services/CompraService.js";
import { CompraRepository } from "../repositories/CompraRepository.js";
import { eventoService } from "./EventoRoutes.js";
import { autenticar, autorizarRol } from "../middlewares/autenticar.js";
import {
  exigirCompradorDeLaCompra,
  exigirOrganizadorDeLaCompra,
  exigirOrganizadorDelEvento,
  exigirParticipanteDeLaCompra,
} from "../middlewares/permisos.js";
import { RolUsuario } from "../domain/enums/RolUsuario.js";

const { COMPRADOR, ORGANIZADOR } = RolUsuario;

export const compraService = new CompraService(new CompraRepository(), eventoService);
const compraController = new CompraController(compraService);

const router = express.Router();

// Todo lo de compras requiere identificarse
router.use(autenticar);

router.route("/")
  .get(autorizarRol(COMPRADOR), (req, res) => compraController.misCompras(req, res))
  .post(autorizarRol(COMPRADOR), (req, res) => compraController.comprar(req, res));

router.route("/:id")
  .get(exigirParticipanteDeLaCompra, (req, res) => compraController.getById(req, res));

// Transiciones de estado: una ruta por acción, con su rol y su control de pertenencia (decisión 25)
router.post("/:id/confirmar", autorizarRol(ORGANIZADOR), exigirOrganizadorDeLaCompra, (req, res) =>
  compraController.confirmar(req, res));
router.post("/:id/cancelar", autorizarRol(COMPRADOR), exigirCompradorDeLaCompra, (req, res) =>
  compraController.cancelar(req, res));
router.post("/:id/utilizar", autorizarRol(ORGANIZADOR), exigirOrganizadorDeLaCompra, (req, res) =>
  compraController.utilizar(req, res));
router.post("/:id/reembolsar", autorizarRol(ORGANIZADOR), exigirOrganizadorDeLaCompra, (req, res) =>
  compraController.reembolsar(req, res));

export default router;

// Se monta en /eventos/:id/compras: las compras de un evento, solo para su organizador (O1)
export const comprasDelEventoRouter = express.Router({ mergeParams: true });
comprasDelEventoRouter.get(
  "/",
  autenticar,
  autorizarRol(ORGANIZADOR),
  exigirOrganizadorDelEvento,
  (req, res) => compraController.comprasDelEvento(req, res),
);
