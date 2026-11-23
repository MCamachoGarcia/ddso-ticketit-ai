import { describe, expect, it } from "@jest/globals";
import { paginar } from "../../src/utils/paginar.js";

const numeros = Array.from({ length: 25 }, (_, i) => i + 1);

describe("paginar", () => {
  it("por defecto devuelve la página 1 con 10 resultados", () => {
    expect(paginar(numeros)).toEqual({
      resultados: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it("devuelve la página pedida", () => {
    expect(paginar(numeros, { page: 2, limit: 10 }).resultados).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it("la última página puede tener menos resultados", () => {
    expect(paginar(numeros, { page: 3, limit: 10 }).resultados).toEqual([21, 22, 23, 24, 25]);
  });

  it("si se pide una página mayor a la última, devuelve la última", () => {
    const pagina = paginar(numeros, { page: 99, limit: 10 });
    expect(pagina.page).toBe(3);
    expect(pagina.resultados).toEqual([21, 22, 23, 24, 25]);
  });

  it("una lista vacía devuelve la página 1 sin resultados", () => {
    expect(paginar([], { page: 3, limit: 5 })).toEqual({ resultados: [], page: 1, limit: 5, total: 0, totalPages: 0 });
  });
});
