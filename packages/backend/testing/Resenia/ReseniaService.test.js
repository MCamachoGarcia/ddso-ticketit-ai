import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ReseniaService } from "../../src/services/ReseniaService.js";
import { Resenia } from "../../src/domain/entities/Resenia.js";
import { Usuario } from "../../src/domain/entities/Usuario.js";
import { EstadoCompra } from "../../src/domain/enums/EstadoCompra.js";
import { RolUsuario } from "../../src/domain/enums/RolUsuario.js";
import { NoEncontradoError, ReglaDeNegocioError } from "../../src/domain/errors/ErroresDeDominio.js";

const AHORA = new Date("2026-11-23T12:00:00");
const ana = new Usuario({ id: "1", nombre: "Ana", apellido: "Paz", rol: RolUsuario.ORGANIZADOR });
const leo = new Usuario({ id: "3", nombre: "Leo", apellido: "Ruiz", email: "leo@demo.com", passwordHash: "secreto", rol: RolUsuario.COMPRADOR });
const recital = { id: "7", nombre: "Recital", fecha: new Date("2026-10-25T21:00:00"), organizador: ana };
const compra = (evento, estado) => ({ evento, estado });

describe("ReseniaService", () => {
  let reseniaRepository;
  let eventoService;
  let compraRepository;
  let usuarioRepository;
  let service;

  beforeEach(() => {
    reseniaRepository = {
      findByEvento: jest.fn().mockResolvedValue([]),
      findByOrganizador: jest.fn().mockResolvedValue([]),
      findByCompradorYEvento: jest.fn().mockResolvedValue(null),
      save: jest.fn((resenia) => Promise.resolve(Object.assign(resenia, { id: "1" }))),
    };
    eventoService = { buscarEvento: jest.fn().mockResolvedValue(recital) };
    compraRepository = { findByComprador: jest.fn().mockResolvedValue([compra(recital, EstadoCompra.UTILIZADA)]) };
    usuarioRepository = { findById: jest.fn().mockResolvedValue(ana) };
    service = new ReseniaService(reseniaRepository, eventoService, compraRepository, usuarioRepository);
  });

  const datos = { puntuacion: 4, detalle: "Muy bueno" };

  describe("crear", () => {
    it("crea la reseña del comprador sobre el evento y devuelve su DTO", async () => {
      const dto = await service.crear("7", leo, datos, AHORA);

      const guardada = reseniaRepository.save.mock.calls[0][0];
      expect(guardada).toBeInstanceOf(Resenia);
      expect(guardada).toMatchObject({ comprador: leo, evento: recital, puntuacion: 4, detalle: "Muy bueno", fecha: AHORA });
      expect(dto).toEqual({
        id: "1",
        evento: { id: "7", nombre: "Recital", fecha: recital.fecha.toISOString() },
        comprador: { id: "3", nombre: "Leo", apellido: "Ruiz" },
        puntuacion: 4,
        detalle: "Muy bueno",
        fecha: AHORA.toISOString(),
      });
    });

    it.each([
      ["no tiene compras de ese evento", []],
      ["su compra está solo confirmada (no usó la entrada)", [compra(recital, EstadoCompra.CONFIRMADA)]],
      ["usó una entrada, pero de otro evento", [compra({ id: "1" }, EstadoCompra.UTILIZADA)]],
    ])("no deja reseñar si %s", async (_caso, compras) => {
      compraRepository.findByComprador.mockResolvedValue(compras);

      await expect(service.crear("7", leo, datos, AHORA)).rejects.toThrow(
        new ReglaDeNegocioError("Para reseñar un evento tenés que haber usado una entrada"),
      );
      expect(reseniaRepository.save).not.toHaveBeenCalled();
    });

    it("no deja reseñar dos veces el mismo evento", async () => {
      reseniaRepository.findByCompradorYEvento.mockResolvedValue(new Resenia({}));

      await expect(service.crear("7", leo, datos, AHORA)).rejects.toThrow(new ReglaDeNegocioError("Ya reseñaste este evento"));
      expect(reseniaRepository.findByCompradorYEvento).toHaveBeenCalledWith("3", "7");
    });

    it("propaga el 404 si el evento no existe", async () => {
      eventoService.buscarEvento.mockRejectedValue(new NoEncontradoError("No existe un evento con id 9"));
      await expect(service.crear("9", leo, datos, AHORA)).rejects.toThrow(NoEncontradoError);
    });
  });

  describe("listados", () => {
    const resenias = [
      new Resenia({ id: "1", comprador: leo, evento: recital, puntuacion: 5, detalle: "a", fecha: new Date("2026-11-01") }),
      new Resenia({ id: "2", comprador: leo, evento: recital, puntuacion: 4, detalle: "b", fecha: new Date("2026-11-05") }),
      new Resenia({ id: "3", comprador: leo, evento: recital, puntuacion: 4, detalle: "c", fecha: new Date("2026-11-03") }),
    ];

    it("las reseñas de un evento vienen con su promedio y de la más reciente a la más vieja", async () => {
      reseniaRepository.findByEvento.mockResolvedValue(resenias);

      const resultado = await service.delEvento("7", {});

      expect(resultado).toMatchObject({ evento: { id: "7", nombre: "Recital" }, promedio: 4.3, cantidad: 3 });
      expect(resultado.resenias.resultados.map((r) => r.id)).toEqual(["2", "3", "1"]);
      expect(resultado.resenias).toMatchObject({ page: 1, limit: 10, total: 3 });
    });

    it("las reseñas de un organizador traen su puntaje", async () => {
      reseniaRepository.findByOrganizador.mockResolvedValue(resenias);

      const resultado = await service.delOrganizador("1", { page: 1, limit: 2 });

      expect(resultado).toMatchObject({ organizador: { id: "1", nombre: "Ana", apellido: "Paz" }, promedio: 4.3, cantidad: 3 });
      expect(resultado.resenias.resultados).toHaveLength(2);
      expect(JSON.stringify(resultado)).not.toContain("secreto");
    });

    it("un organizador sin reseñas tiene promedio null", async () => {
      expect(await service.delOrganizador("1", {})).toMatchObject({ promedio: null, cantidad: 0 });
    });

    it.each([
      ["no existe", null],
      ["es un comprador", leo],
    ])("responde 404 si el usuario %s", async (_caso, usuario) => {
      usuarioRepository.findById.mockResolvedValue(usuario);
      await expect(service.delOrganizador("3", {})).rejects.toThrow(new NoEncontradoError("No existe un organizador con id 3"));
    });
  });
});
