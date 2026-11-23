import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { CategoriaService } from "../../src/services/CategoriaService.js";
import { Categoria } from "../../src/domain/entities/Categoria.js";
import { NoEncontradoError } from "../../src/domain/errors/ErroresDeDominio.js";

const crear = (id, nombre) => Object.assign(new Categoria({ nombre, descripcion: `Desc ${nombre}` }), { id });

describe("CategoriaService", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = { findAll: jest.fn(), findById: jest.fn() };
    service = new CategoriaService(repository);
  });

  describe("getAll", () => {
    it("devuelve todas las categorías como lista, ordenadas por nombre y como DTO", async () => {
      repository.findAll.mockResolvedValue([crear("1", "Teatro"), crear("2", "Deportes"), crear("3", "Música")]);

      expect(await service.getAll()).toEqual([
        { id: "2", nombre: "Deportes", descripcion: "Desc Deportes" },
        { id: "3", nombre: "Música", descripcion: "Desc Música" },
        { id: "1", nombre: "Teatro", descripcion: "Desc Teatro" },
      ]);
    });

    it("no recorta la lista aunque tenga más de 10 categorías", async () => {
      repository.findAll.mockResolvedValue(Array.from({ length: 12 }, (_, i) => crear(String(i + 1), `Cat ${i + 1}`)));
      expect(await service.getAll()).toHaveLength(12);
    });

    it("devuelve una lista vacía si no hay categorías", async () => {
      repository.findAll.mockResolvedValue([]);
      expect(await service.getAll()).toEqual([]);
    });
  });

  describe("getById", () => {
    it("devuelve la categoría como DTO", async () => {
      repository.findById.mockResolvedValue(crear("3", "Música"));

      expect(await service.getById("3")).toEqual({ id: "3", nombre: "Música", descripcion: "Desc Música" });
      expect(repository.findById).toHaveBeenCalledWith("3");
    });

    it("lanza NoEncontradoError si no existe", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById("99")).rejects.toThrow(
        new NoEncontradoError("No existe una categoría con id 99"),
      );
    });
  });
});
