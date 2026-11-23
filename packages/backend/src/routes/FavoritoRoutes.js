import express from "express";
import { FavoritoController } from "../controllers/FavoritoController.js";
import { FavoritoService } from "../services/FavoritoService.js";
import { UsuarioRepository } from "../repositories/UsuarioRepository.js";
import { eventoService } from "./EventoRoutes.js";
import { autenticar, autorizarRol } from "../middlewares/autenticar.js";
import { RolUsuario } from "../domain/enums/RolUsuario.js";

export const favoritoService = new FavoritoService(new UsuarioRepository(), eventoService);
const favoritoController = new FavoritoController(favoritoService);

// Los favoritos son del comprador identificado: no hace falta control de pertenencia
const soloComprador = [autenticar, autorizarRol(RolUsuario.COMPRADOR)];

// Se monta en /eventos/favoritos: mis favoritos
export const misFavoritosRouter = express.Router();
misFavoritosRouter.get("/", ...soloComprador, (req, res) => favoritoController.listar(req, res));

// Se monta en /eventos/:id/favorito: marcar y desmarcar un evento
export const favoritoDelEventoRouter = express.Router({ mergeParams: true });
favoritoDelEventoRouter.route("/")
  .put(...soloComprador, (req, res) => favoritoController.marcar(req, res))
  .delete(...soloComprador, (req, res) => favoritoController.desmarcar(req, res));
