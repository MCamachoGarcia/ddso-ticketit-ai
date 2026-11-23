import { EventoRepository } from "../repositories/EventoRepository.js";
import { NoEncontradoError } from "../domain/errors/ErroresDeDominio.js";
import { SinPermisoError } from "../errors/ErroresDeAutorizacion.js";

// Controles de pertenencia ("¿el recurso es tuyo?"). Son autorización, no reglas de negocio:
// los usan los middlewares de las rutas, nunca el dominio (decisión 15).
export class PermisosService {
  constructor(eventoRepository = new EventoRepository()) {
    this.eventoRepository = eventoRepository;
  }

  exigirOrganizadorDelEvento = async (usuario, eventoId) => {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NoEncontradoError(`No existe un evento con id ${eventoId}`);
    }
    // Se compara por id, nunca por referencia: el usuario identificado y el organizador pueden ser objetos distintos
    if (evento.organizador.id !== usuario.id) {
      throw new SinPermisoError("Solo el organizador del evento puede realizar esta acción");
    }
  };
}

export const permisosService = new PermisosService();
