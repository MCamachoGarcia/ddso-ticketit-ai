import { beforeEach, describe, expect, it } from "@jest/globals";
import { ReseniaRepository } from "../../src/repositories/ReseniaRepository.js";
import { Resenia } from "../../src/domain/entities/Resenia.js";

const ana = { id: "1" };
const productora = { id: "2" };
const recital = { id: "7", organizador: ana };
const obra = { id: "8", organizador: productora };
const leo = { id: "3" };
const sofia = { id: "4" };

const nueva = (comprador, evento, puntuacion = 5) =>
  new Resenia({ comprador, evento, puntuacion, detalle: "x", fecha: new Date("2026-11-01") });

describe("ReseniaRepository (en memoria)", () => {
  let repository;

  beforeEach(async () => {
    ReseniaRepository.limpiar();
    repository = new ReseniaRepository();
    await repository.save(nueva(leo, recital));
    await repository.save(nueva(sofia, recital));
    await repository.save(nueva(leo, obra));
  });

  it("asigna ids incrementales", async () => {
    expect((await repository.findAll()).map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("filtra por evento", async () => {
    expect((await repository.findByEvento("7")).map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("filtra por el organizador del evento", async () => {
    expect((await repository.findByOrganizador("2")).map((r) => r.id)).toEqual(["3"]);
  });

  it("busca la reseña de un comprador sobre un evento", async () => {
    expect((await repository.findByCompradorYEvento("3", "8")).id).toBe("3");
    expect(await repository.findByCompradorYEvento("4", "8")).toBeNull();
  });

  it("limpiar vacía la lista y reinicia los ids", async () => {
    ReseniaRepository.limpiar();
    expect(await repository.findAll()).toEqual([]);
    expect((await repository.save(nueva(leo, recital))).id).toBe("1");
  });
});
