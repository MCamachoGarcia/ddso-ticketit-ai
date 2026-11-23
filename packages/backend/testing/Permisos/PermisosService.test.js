import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PermisosService } from "../../src/services/PermisosService.js";
import { Evento } from "../../src/domain/entities/Evento.js";
import { Usuario } from "../../src/domain/entities/Usuario.js";
import { RolUsuario } from "../../src/domain/enums/RolUsuario.js";
import { NoEncontradoError } from "../../src/domain/errors/ErroresDeDominio.js";
import { SinPermisoError } from "../../src/errors/ErroresDeAutorizacion.js";

const usuario = (id) => new Usuario({ id, nombre: "x", apellido: "x", rol: RolUsuario.ORGANIZADOR });

describe("PermisosService", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = { findById: jest.fn() };
    service = new PermisosService(repository);
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
