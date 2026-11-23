import { UsuarioRepository } from "../repositories/UsuarioRepository.js";
import { EventoService } from "./EventoService.js";
import { paginar } from "../utils/paginar.js";

// Favoritos del comprador (decisión 29). Viven en Usuario.favoritos, como en el diagrama del enunciado.
export class FavoritoService {
  constructor(usuarioRepository = new UsuarioRepository(), eventoService = new EventoService()) {
    this.usuarioRepository = usuarioRepository;
    this.eventoService = eventoService;
  }

  // Marcar: el evento tiene que existir (si no, 404). Si ya era favorito, no cambia nada.
  marcar = async (comprador, eventoId) => {
    const evento = await this.eventoService.buscarEvento(eventoId);
    comprador.agregarFavorito(evento);
    await this.usuarioRepository.update(comprador);
  };

  // Desmarcar: el evento tiene que existir. Si no era favorito, no cambia nada.
  desmarcar = async (comprador, eventoId) => {
    const evento = await this.eventoService.buscarEvento(eventoId);
    comprador.quitarFavorito(evento.id);
    await this.usuarioRepository.update(comprador);
  };

  // Mis favoritos: los últimos que marcó primero, con el mismo formato de evento que la búsqueda.
  // Incluye los que ya se realizaron, marcados con realizado: true.
  listar = async (comprador, { page, limit }, ahora = new Date()) => {
    const puntajes = await this.eventoService.puntajesPorOrganizador();
    const favoritos = [...comprador.favoritos].reverse().map((evento) => ({
      ...this.eventoService.toDTO(evento, puntajes.get(evento.organizador.id)),
      realizado: evento.yaSeRealizo(ahora),
    }));
    return paginar(favoritos, { page, limit });
  };
}
