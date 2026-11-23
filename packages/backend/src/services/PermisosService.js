import { EventoRepository } from "../repositories/EventoRepository.js";
import { CompraRepository } from "../repositories/CompraRepository.js";
import { NoEncontradoError } from "../domain/errors/ErroresDeDominio.js";
import { SinPermisoError } from "../errors/ErroresDeAutorizacion.js";

// Se compara por id, nunca por referencia: el usuario identificado y el guardado pueden ser objetos distintos
const esElMismo = (usuario, otro) => usuario.id === otro.id;

// Controles de pertenencia ("¿el recurso es tuyo?"). Son autorización, no reglas de negocio:
// los usan los middlewares de las rutas, nunca el dominio (decisión 15).
export class PermisosService {
  constructor(eventoRepository = new EventoRepository(), compraRepository = new CompraRepository()) {
    this.eventoRepository = eventoRepository;
    this.compraRepository = compraRepository;
  }

  exigirOrganizadorDelEvento = async (usuario, eventoId) => {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NoEncontradoError(`No existe un evento con id ${eventoId}`);
    }
    if (!esElMismo(usuario, evento.organizador)) {
      throw new SinPermisoError("Solo el organizador del evento puede realizar esta acción");
    }
  };

  // Cancelar: solo quien hizo la compra
  exigirCompradorDeLaCompra = async (usuario, compraId) => {
    const compra = await this.buscarCompra(compraId);
    if (!esElMismo(usuario, compra.comprador)) {
      throw new SinPermisoError("Solo quien hizo la compra puede realizar esta acción");
    }
  };

  // Confirmar, usar y reembolsar: solo el organizador del evento de la compra
  exigirOrganizadorDeLaCompra = async (usuario, compraId) => {
    const compra = await this.buscarCompra(compraId);
    if (!esElMismo(usuario, compra.evento.organizador)) {
      throw new SinPermisoError("Solo el organizador del evento puede realizar esta acción");
    }
  };

  // Ver el detalle (y, más adelante, el chat): el comprador o el organizador del evento
  exigirParticipanteDeLaCompra = async (usuario, compraId) => {
    const compra = await this.buscarCompra(compraId);
    if (!esElMismo(usuario, compra.comprador) && !esElMismo(usuario, compra.evento.organizador)) {
      throw new SinPermisoError("Solo el comprador o el organizador del evento pueden ver esta compra");
    }
  };

  buscarCompra = async (compraId) => {
    const compra = await this.compraRepository.findById(compraId);
    if (!compra) {
      throw new NoEncontradoError(`No existe una compra con id ${compraId}`);
    }
    return compra;
  };
}

export const permisosService = new PermisosService();
