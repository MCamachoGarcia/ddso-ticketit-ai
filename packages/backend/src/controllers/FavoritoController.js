import { FavoritoService } from "../services/FavoritoService.js";
import { paginacionSchema } from "../schemas/PaginacionSchema.js";
import { validar } from "../schemas/validar.js";

export class FavoritoController {
  constructor(favoritoService = new FavoritoService()) {
    this.favoritoService = favoritoService;
  }

  // PUT y DELETE responden 204 (sin cuerpo): son idempotentes y la app ya sabe cómo queda el corazón
  marcar = async (req, res) => {
    await this.favoritoService.marcar(req.usuario, req.params.id);
    res.status(204).send();
  };

  desmarcar = async (req, res) => {
    await this.favoritoService.desmarcar(req.usuario, req.params.id);
    res.status(204).send();
  };

  listar = async (req, res) => {
    const paginacion = validar(paginacionSchema, req.query);
    res.status(200).json(await this.favoritoService.listar(req.usuario, paginacion));
  };
}
