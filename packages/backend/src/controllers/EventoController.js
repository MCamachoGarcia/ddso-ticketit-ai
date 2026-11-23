import { EventoService } from "../services/EventoService.js";
import { actualizarEventoSchema, buscarEventosSchema, crearEventoSchema } from "../schemas/EventoSchema.js";
import { validar } from "../schemas/validar.js";

export class EventoController {
  constructor(eventoService = new EventoService()) {
    this.eventoService = eventoService;
  }

  buscar = async (req, res) => {
    const filtros = validar(buscarEventosSchema, req.query);
    res.status(200).json(await this.eventoService.buscar(filtros));
  };

  getById = async (req, res) => {
    res.status(200).json(await this.eventoService.getById(req.params.id));
  };

  crear = async (req, res) => {
    const datos = validar(crearEventoSchema, req.body);
    // El organizador sale del usuario identificado (req.usuario), nunca del body
    res.status(201).json(await this.eventoService.crear(datos, req.usuario));
  };

  actualizar = async (req, res) => {
    const datos = validar(actualizarEventoSchema, req.body);
    res.status(200).json(await this.eventoService.actualizar(req.params.id, datos));
  };
}
