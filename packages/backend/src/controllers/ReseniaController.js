import { ReseniaService } from "../services/ReseniaService.js";
import { crearReseniaSchema } from "../schemas/ReseniaSchema.js";
import { paginacionSchema } from "../schemas/PaginacionSchema.js";
import { validar } from "../schemas/validar.js";

export class ReseniaController {
  constructor(reseniaService = new ReseniaService()) {
    this.reseniaService = reseniaService;
  }

  crear = async (req, res) => {
    const datos = validar(crearReseniaSchema, req.body);
    // El autor es el usuario identificado, nunca un dato del body
    res.status(201).json(await this.reseniaService.crear(req.params.id, req.usuario, datos));
  };

  delEvento = async (req, res) => {
    const paginacion = validar(paginacionSchema, req.query);
    res.status(200).json(await this.reseniaService.delEvento(req.params.id, paginacion));
  };

  delOrganizador = async (req, res) => {
    const paginacion = validar(paginacionSchema, req.query);
    res.status(200).json(await this.reseniaService.delOrganizador(req.params.id, paginacion));
  };
}
