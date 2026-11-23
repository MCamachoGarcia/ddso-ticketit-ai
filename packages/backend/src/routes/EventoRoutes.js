import express from "express";
import { EventoController } from "../controllers/EventoController.js";
import { EventoService } from "../services/EventoService.js";
import { EventoRepository } from "../repositories/EventoRepository.js";
import { CompraRepository } from "../repositories/CompraRepository.js";
import { ReseniaRepository } from "../repositories/ReseniaRepository.js";
import { categoriaService } from "./CategoriaRoutes.js";
import { autenticar, autorizarRol } from "../middlewares/autenticar.js";
import { exigirOrganizadorDelEvento } from "../middlewares/permisos.js";
import { RolUsuario } from "../domain/enums/RolUsuario.js";

export const eventoService = new EventoService(
  new EventoRepository(),
  categoriaService,
  new CompraRepository(),
  new ReseniaRepository(),
);
const eventoController = new EventoController(eventoService);

const router = express.Router();

// Buscar y ver eventos es público: no hace falta identificarse
router.route("/")
  .get((req, res) => eventoController.buscar(req, res))
  .post(autenticar, autorizarRol(RolUsuario.ORGANIZADOR), (req, res) => eventoController.crear(req, res));

// Mis eventos: los del organizador identificado. Tiene que ir ANTES que "/:id": si no, Express tomaría
// "mios" como el id de un evento y respondería "No existe un evento con id mios"
router.get("/mios", autenticar, autorizarRol(RolUsuario.ORGANIZADOR), (req, res) =>
  eventoController.misEventos(req, res));

// Editar: rol ORGANIZADOR y, además, ser el organizador de ESE evento
router.route("/:id")
  .get((req, res) => eventoController.getById(req, res))
  .put(
    autenticar,
    autorizarRol(RolUsuario.ORGANIZADOR),
    exigirOrganizadorDelEvento,
    (req, res) => eventoController.actualizar(req, res),
  );

export default router;
