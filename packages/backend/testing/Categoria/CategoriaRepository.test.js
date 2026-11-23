import { beforeEach, describe, expect, it } from "@jest/globals";
import { CategoriaRepository } from "../../src/repositories/CategoriaRepository.js";
import { Categoria } from "../../src/domain/entities/Categoria.js";

describe("CategoriaRepository (en memoria)", () => {
  let repository;

  beforeEach(() => {
    CategoriaRepository.limpiar();
    repository = new CategoriaRepository();
  });

  it("arranca vacío", async () => {
    expect(await repository.findAll()).toEqual([]);
  });

  it("asigna ids incrementales como texto al guardar", async () => {
    const musica = await repository.save(new Categoria({ nombre: "Música", descripcion: "x" }));
    const teatro = await repository.save(new Categoria({ nombre: "Teatro", descripcion: "x" }));

    expect(musica.id).toBe("1");
    expect(teatro.id).toBe("2");
  });

  it("busca por id, aceptando el id como número o texto", async () => {
    const musica = await repository.save(new Categoria({ nombre: "Música", descripcion: "x" }));

    expect(await repository.findById("1")).toBe(musica);
    expect(await repository.findById(1)).toBe(musica);
    expect(await repository.findById("99")).toBeNull();
  });

  it("todas las instancias comparten los mismos datos", async () => {
    await repository.save(new Categoria({ nombre: "Música", descripcion: "x" }));
    expect(await new CategoriaRepository().findAll()).toHaveLength(1);
  });

  it("findAll devuelve una copia: modificarla no altera los datos guardados", async () => {
    await repository.save(new Categoria({ nombre: "Música", descripcion: "x" }));
    const lista = await repository.findAll();
    lista.pop();

    expect(await repository.findAll()).toHaveLength(1);
  });

  it("limpiar vacía la lista y reinicia los ids", async () => {
    await repository.save(new Categoria({ nombre: "Música", descripcion: "x" }));
    CategoriaRepository.limpiar();

    expect(await repository.findAll()).toEqual([]);
    expect((await repository.save(new Categoria({ nombre: "Teatro", descripcion: "x" }))).id).toBe("1");
  });
});
