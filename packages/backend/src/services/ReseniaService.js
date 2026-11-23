import { Resenia } from "../domain/entities/Resenia.js";
import { EstadoCompra } from "../domain/enums/EstadoCompra.js";
import { RolUsuario } from "../domain/enums/RolUsuario.js";
import { NoEncontradoError, ReglaDeNegocioError } from "../domain/errors/ErroresDeDominio.js";
import { ReseniaRepository } from "../repositories/ReseniaRepository.js";
import { CompraRepository } from "../repositories/CompraRepository.js";
import { UsuarioRepository } from "../repositories/UsuarioRepository.js";
import { EventoService } from "./EventoService.js";
import { calcularPuntaje } from "../utils/puntaje.js";
import { paginar } from "../utils/paginar.js";

const resumenUsuario = (usuario) => ({ id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido });

export class ReseniaService {
  constructor(
    reseniaRepository = new ReseniaRepository(),
    eventoService = new EventoService(),
    compraRepository = new CompraRepository(),
    usuarioRepository = new UsuarioRepository(),
  ) {
    this.reseniaRepository = reseniaRepository;
    this.eventoService = eventoService;
    this.compraRepository = compraRepository;
    this.usuarioRepository = usuarioRepository;
  }

  toDTO(resenia) {
    return {
      id: resenia.id,
      evento: { id: resenia.evento.id, nombre: resenia.evento.nombre, fecha: resenia.evento.fecha.toISOString() },
      comprador: resumenUsuario(resenia.comprador),
      puntuacion: resenia.puntuacion,
      detalle: resenia.detalle,
      fecha: resenia.fecha.toISOString(),
    };
  }

  // Las más recientes primero, paginadas, junto con el puntaje de todas
  conPuntaje(resenias, { page, limit }) {
    const ordenadas = [...resenias].sort((a, b) => b.fecha - a.fecha);
    return {
      ...calcularPuntaje(resenias),
      resenias: paginar(ordenadas.map((resenia) => this.toDTO(resenia)), { page, limit }),
    };
  }

  // Reseñar un evento (C5). Es una regla de negocio, no de permisos: hay que haber usado una entrada
  // de ese evento, y se reseña una sola vez por evento (decisión 27).
  crear = async (eventoId, comprador, { puntuacion, detalle }, ahora = new Date()) => {
    const evento = await this.eventoService.buscarEvento(eventoId);

    const compras = await this.compraRepository.findByComprador(comprador.id);
    const usoUnaEntrada = compras.some(
      (compra) => compra.evento.id === evento.id && compra.estado === EstadoCompra.UTILIZADA,
    );
    if (!usoUnaEntrada) {
      throw new ReglaDeNegocioError("Para reseñar un evento tenés que haber usado una entrada");
    }

    if (await this.reseniaRepository.findByCompradorYEvento(comprador.id, evento.id)) {
      throw new ReglaDeNegocioError("Ya reseñaste este evento");
    }

    const resenia = new Resenia({ comprador, evento, puntuacion, detalle, fecha: ahora });
    return this.toDTO(await this.reseniaRepository.save(resenia));
  };

  // Reseñas de un evento (públicas)
  delEvento = async (eventoId, paginacion) => {
    const evento = await this.eventoService.buscarEvento(eventoId);
    const resenias = await this.reseniaRepository.findByEvento(evento.id);
    return { evento: { id: evento.id, nombre: evento.nombre }, ...this.conPuntaje(resenias, paginacion) };
  };

  // Reseñas de todos los eventos de un organizador (C6, públicas): su reputación antes de comprar
  delOrganizador = async (organizadorId, paginacion) => {
    const organizador = await this.usuarioRepository.findById(organizadorId);
    if (!organizador || organizador.rol !== RolUsuario.ORGANIZADOR) {
      throw new NoEncontradoError(`No existe un organizador con id ${organizadorId}`);
    }
    const resenias = await this.reseniaRepository.findByOrganizador(organizador.id);
    return { organizador: resumenUsuario(organizador), ...this.conPuntaje(resenias, paginacion) };
  };
}
