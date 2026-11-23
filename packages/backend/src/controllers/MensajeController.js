import { MensajeService } from "../services/MensajeService.js";
import { enviarMensajeSchema, listarMensajesSchema } from "../schemas/MensajeSchema.js";
import { validar } from "../schemas/validar.js";

export class MensajeController {
  constructor(mensajeService = new MensajeService()) {
    this.mensajeService = mensajeService;
  }

  listar = async (req, res) => {
    const filtros = validar(listarMensajesSchema, req.query);
    res.status(200).json(await this.mensajeService.listar(req.params.id, filtros));
  };

  enviar = async (req, res) => {
    const { mensaje } = validar(enviarMensajeSchema, req.body);
    // El autor es el usuario identificado, nunca un dato del body
    res.status(201).json(await this.mensajeService.enviar(req.params.id, req.usuario, mensaje));
  };
}
