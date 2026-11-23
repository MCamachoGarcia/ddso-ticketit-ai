import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PermisosService } from "../../src/services/PermisosService.js";
import { Evento } from "../../src/domain/entities/Evento.js";
import { Compra } from "../../src/domain/entities/Compra.js";
import { TipoEntrada } from "../../src/domain/entities/TipoEntrada.js";
import { Usuario } from "../../src/domain/entities/Usuario.js";
import { RolUsuario } from "../../src/domain/enums/RolUsuario.js";
import { NoEncontradoError } from "../../src/domain/errors/ErroresDeDominio.js";
import { SinPermisoError } from "../../src/errors/ErroresDeAutorizacion.js";

const usuario = (id) => new Usuario({ id, nombre: "x", apellido: "x", rol: RolUsuario.ORGANIZADOR });

describe("PermisosService", () => {
  let repository;
  let compraRepository;
  let service;

  beforeEach(() => {
    repository = { findById: jest.fn() };
    compraRepository = { findById: jest.fn() };
    service = new PermisosService(repository, compraRepository);
  });

  describe("controles sobre una compra", () => {
    // Compra de Leo (3) en un evento de Ana (1)
    beforeEach(() => {
      const tipo = new TipoEntrada({ id: "1", nombre: "Campo", descripcion: "", precio: 1, cupo: 1 });
      const evento = new Evento({ id: "5", nombre: "Recital", descripcion: "x", fecha: new Date(), organizador: usuario("1"), tiposEntrada: [tipo] });
      compraRepository.findById.mockResolvedValue(new Compra({ id: "8", comprador: usuario("3"), evento, tipoEntrada: tipo, cantidad: 1 }));
    });

    it.each([
      ["exigirCompradorDeLaCompra", "3", true],
      ["exigirCompradorDeLaCompra", "1", false],
      ["exigirOrganizadorDeLaCompra", "1", true],
      ["exigirOrganizadorDeLaCompra", "3", false],
      ["exigirOrganizadorDeLaCompra", "2", false],
      ["exigirParticipanteDeLaCompra", "3", true],
      ["exigirParticipanteDeLaCompra", "1", true],
      ["exigirParticipanteDeLaCompra", "4", false],
    ])("%s con el usuario %s: ¿lo deja pasar? %s", async (control, usuarioId, permitido) => {
      const resultado = service[control](usuario(usuarioId), "8");
      if (permitido) {
        await expect(resultado).resolves.toBeUndefined();
      } else {
        await expect(resultado).rejects.toThrow(SinPermisoError);
      }
    });

    it("si la compra no existe responde NoEncontradoError en cualquier control", async () => {
      compraRepository.findById.mockResolvedValue(null);
      await expect(service.exigirParticipanteDeLaCompra(usuario("3"), "99")).rejects.toThrow(
        new NoEncontradoError("No existe una compra con id 99"),
      );
    });
  });

  describe("exigirOrganizadorDelEvento", () => {
    beforeEach(() => {
      repository.findById.mockResolvedValue(
        new Evento({ id: "5", nombre: "Recital", descripcion: "x", fecha: new Date(), organizador: usuario("1") }),
      );
    });

    it("deja pasar al organizador del evento, comparando por id aunque sean objetos distintos", async () => {
      await expect(service.exigirOrganizadorDelEvento(usuario("1"), "5")).resolves.toBeUndefined();
      expect(repository.findById).toHaveBeenCalledWith("5");
    });

    it("rechaza a otro organizador con SinPermisoError", async () => {
      await expect(service.exigirOrganizadorDelEvento(usuario("2"), "5")).rejects.toThrow(
        new SinPermisoError("Solo el organizador del evento puede realizar esta acción"),
      );
    });

    it("lanza NoEncontradoError si el evento no existe", async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.exigirOrganizadorDelEvento(usuario("1"), "99")).rejects.toThrow(NoEncontradoError);
    });
  });
});
