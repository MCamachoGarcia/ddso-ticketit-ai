import { CategoriaService } from "../services/CategoriaService.js";

export class CategoriaController {
  constructor(categoriaService = new CategoriaService()) {
    this.categoriaService = categoriaService;
  }

  getAll = async (_req, res) => {
    res.status(200).json(await this.categoriaService.getAll());
  };

  getById = async (req, res) => {
    res.status(200).json(await this.categoriaService.getById(req.params.id));
  };
}
