import express from "express";
import { ReseniaController } from "../controllers/ReseniaController.js";
import { ReseniaService } from "../services/ReseniaService.js";
import { ReseniaRepository } from "../repositories/ReseniaRepository.js";
import { CompraRepository } from "../repositories/CompraRepository.js";
import { UsuarioRepository } from "../repositories/UsuarioRepository.js";
import { eventoService } from "./EventoRoutes.js";
import { autenticar, autorizarRol } from "../middlewares/autenticar.js";
import { RolUsuario } from "../domain/enums/RolUsuario.js";

export const reseniaService = new ReseniaService(
  new ReseniaRepository(),
  eventoService,
  new CompraRepository(),
  new UsuarioRepository(),
);
const reseniaController = new ReseniaController(reseniaService);

// Se monta en /eventos/:id/resenias. Ver es público; reseñar, solo un COMPRADOR.
// Que haya usado una entrada de ese evento es una regla de negocio y la valida el service (decisión 27).
export const reseniasDelEventoRouter = express.Router({ mergeParams: true });
reseniasDelEventoRouter.route("/")
  .get((req, res) => reseniaController.delEvento(req, res))
  .post(autenticar, autorizarRol(RolUsuario.COMPRADOR), (req, res) => reseniaController.crear(req, res));

// Se monta en /organizadores/:id/resenias: la reputación de un organizador (C6), pública
export const reseniasDelOrganizadorRouter = express.Router({ mergeParams: true });
reseniasDelOrganizadorRouter.get("/", (req, res) => reseniaController.delOrganizador(req, res));
