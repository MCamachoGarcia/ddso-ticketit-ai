import { describe, expect, it } from "@jest/globals";
import { TipoEntrada } from "../../src/domain/entities/TipoEntrada.js";

describe("TipoEntrada", () => {
  const general = new TipoEntrada({
    nombre: "General",
    descripcion: "Campo",
    precio: 10000,
    cupo: 5,
  });

  it("guarda los atributos recibidos y arranca sin id", () => {
    expect(general).toMatchObject({ id: null, nombre: "General", descripcion: "Campo", precio: 10000, cupo: 5 });
  });

  describe("hayCupoPara", () => {
    it.each([
      [1, true],
      [5, true],
      [6, false],
      [0, false],
      [-1, false],
    ])("para %i entrada(s) devuelve %s con un cupo de 5", (cantidad, esperado) => {
      expect(general.hayCupoPara(cantidad)).toBe(esperado);
    });

    it("no hay cupo para nada cuando el cupo es 0", () => {
      const agotada = new TipoEntrada({ nombre: "VIP", descripcion: "Frente", precio: 1, cupo: 0 });
      expect(agotada.hayCupoPara(1)).toBe(false);
    });

    it.each([
      [2, 3, true],
      [3, 3, false],
      [1, 5, false],
    ])("con %i pedidas y %i ya ocupadas (cupo 5) devuelve %s", (cantidad, ocupadas, esperado) => {
      expect(general.hayCupoPara(cantidad, ocupadas)).toBe(esperado);
    });
  });

  describe("disponibles", () => {
    it("resta las ocupadas al cupo", () => {
      expect(general.disponibles(2)).toBe(3);
    });

    it("sin ocupadas son todo el cupo", () => {
      expect(general.disponibles()).toBe(5);
    });

    it("nunca es negativo", () => {
      expect(general.disponibles(8)).toBe(0);
    });
  });
});
