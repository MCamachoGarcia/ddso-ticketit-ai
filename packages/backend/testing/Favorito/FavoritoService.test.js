import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FavoritoService } from "../../src/services/FavoritoService.js";
import { Evento } from "../../src/domain/entities/Evento.js";
import { Usuario } from "../../src/domain/entities/Usuario.js";
import { RolUsuario } from "../../src/domain/enums/RolUsuario.js";
import { NoEncontradoError } from "../../src/domain/errors/ErroresDeDominio.js";

const AHORA = new Date("2026-11-23T12:00:00");
const ana = new Usuario({ id: "1", nombre: "Ana", apellido: "Paz", rol: RolUsuario.ORGANIZADOR });
const crearEvento = (id, fecha) =>
  new Evento({ id, nombre: `Evento ${id}`, descripcion: "x", categoria: { id: "1", nombre: "Música" }, fecha, organizador: ana, tiposEntrada: [] });

describe("FavoritoService", () => {
  let leo;
  let usuarioRepository;
  let eventoService;
  let service;
  let proximo;
  let pasado;

  beforeEach(() => {
    leo = new Usuario({ id: "3", nombre: "Leo", apellido: "Ruiz", rol: RolUsuario.COMPRADOR });
    proximo = crearEvento("1", new Date("2026-12-20"));
    pasado = crearEvento("7", new Date("2026-10-25"));

    usuarioRepository = { update: jest.fn((usuario) => Promise.resolve(usuario)) };
    eventoService = {
      buscarEvento: jest.fn((id) => Promise.resolve({ 1: proximo, 7: pasado }[id] ?? Promise.reject(new NoEncontradoError(`No existe un evento con id ${id}`)))),
      puntajesPorOrganizador: jest.fn().mockResolvedValue(new Map([["1", { promedio: 5, cantidad: 1 }]])),
      toDTO: jest.fn((evento, puntaje) => ({ id: evento.id, organizador: { id: evento.organizador.id, puntaje } })),
    };
    service = new FavoritoService(usuarioRepository, eventoService);
  });

  it("marcar agrega el evento a los favoritos del comprador y lo guarda", async () => {
    await service.marcar(leo, "1");

    expect(leo.favoritos).toEqual([proximo]);
    expect(usuarioRepository.update).toHaveBeenCalledWith(leo);
  });

  it("desmarcar lo quita y guarda", async () => {
    leo.agregarFavorito(proximo);
    await service.desmarcar(leo, "1");

    expect(leo.favoritos).toEqual([]);
    expect(usuarioRepository.update).toHaveBeenCalledWith(leo);
  });

  it.each(["marcar", "desmarcar"])("%s un evento que no existe responde 404 sin guardar", async (accion) => {
    await expect(service[accion](leo, "99")).rejects.toThrow(NoEncontradoError);
    expect(usuarioRepository.update).not.toHaveBeenCalled();
  });

  it("listar devuelve los últimos marcados primero, con el puntaje del organizador y si ya se realizó", async () => {
    leo.agregarFavorito(pasado);
    leo.agregarFavorito(proximo);

    const pagina = await service.listar(leo, {}, AHORA);

    expect(pagina.resultados).toEqual([
      { id: "1", organizador: { id: "1", puntaje: { promedio: 5, cantidad: 1 } }, realizado: false },
      { id: "7", organizador: { id: "1", puntaje: { promedio: 5, cantidad: 1 } }, realizado: true },
    ]);
    expect(pagina).toMatchObject({ page: 1, limit: 10, total: 2 });
  });

  it("listar no modifica el orden guardado de los favoritos", async () => {
    leo.agregarFavorito(pasado);
    leo.agregarFavorito(proximo);
    await service.listar(leo, {}, AHORA);

    expect(leo.favoritos.map((e) => e.id)).toEqual(["7", "1"]);
  });
});
