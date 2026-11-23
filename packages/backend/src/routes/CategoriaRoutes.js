import express from "express";
import { CategoriaController } from "../controllers/CategoriaController.js";
import { CategoriaService } from "../services/CategoriaService.js";

// Se exporta para que otros slices (por ejemplo, Evento) usen la misma instancia
export const categoriaService = new CategoriaService();
const categoriaController = new CategoriaController(categoriaService);

const router = express.Router();

// Las categorías son un catálogo fijo que carga el seed: la API solo las consulta
router.route("/")
  .get((req, res) => categoriaController.getAll(req, res));

router.route("/:id")
  .get((req, res) => categoriaController.getById(req, res));

export default router;
