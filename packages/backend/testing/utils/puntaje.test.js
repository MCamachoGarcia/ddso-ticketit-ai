import { describe, expect, it } from "@jest/globals";
import { calcularPuntaje } from "../../src/utils/puntaje.js";

const conPuntuaciones = (...puntuaciones) => puntuaciones.map((puntuacion) => ({ puntuacion }));

describe("calcularPuntaje", () => {
  it("promedia las puntuaciones y cuenta las reseñas", () => {
    expect(calcularPuntaje(conPuntuaciones(5, 4, 3))).toEqual({ promedio: 4, cantidad: 3 });
  });

  it("redondea el promedio a un decimal", () => {
    expect(calcularPuntaje(conPuntuaciones(5, 4, 4))).toEqual({ promedio: 4.3, cantidad: 3 });
  });

  it("sin reseñas el promedio es null, no 0", () => {
    expect(calcularPuntaje([])).toEqual({ promedio: null, cantidad: 0 });
  });
});
