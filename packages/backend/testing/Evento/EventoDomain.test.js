import { describe, expect, it } from "@jest/globals";
import { Evento } from "../../src/domain/entities/Evento.js";
import { TipoEntrada } from "../../src/domain/entities/TipoEntrada.js";

const crearTipo = (nombre, precio) => new TipoEntrada({ nombre, descripcion: nombre, precio, cupo: 10 });

describe("Evento", () => {
  it("arranca sin tipos de entrada ni multimedia", () => {
    const evento = new Evento({ nombre: "Obra", descripcion: "Teatro", fecha: new Date() });
    expect(evento.id).toBeNull();
    expect(evento.tiposEntrada).toEqual([]);
    expect(evento.multimedia).toEqual([]);
  });

  describe("yaSeRealizo", () => {
    const evento = new Evento({ nombre: "Recital", descripcion: "x", fecha: new Date("2026-12-20T21:00:00") });

    it.each([
      ["antes de que empiece", "2026-12-20T20:59:00", false],
      ["justo cuando empieza", "2026-12-20T21:00:00", true],
      ["después de que empezó", "2026-12-21T10:00:00", true],
    ])("%s → %s", (_caso, fecha, esperado) => {
      expect(evento.yaSeRealizo(new Date(fecha))).toBe(esperado);
    });
  });

  describe("tuPrecioEstaEntre", () => {
    // General $10.000, Platea $25.000, VIP $50.000
    const evento = new Evento({
      nombre: "Recital",
      descripcion: "Banda en vivo",
      fecha: new Date("2026-12-20"),
      tiposEntrada: [crearTipo("General", 10000), crearTipo("Platea", 25000), crearTipo("VIP", 50000)],
    });

    it.each([
      ["el rango incluye uno de sus precios", 20000, 30000, true],
      ["el rango incluye todos sus precios", 0, 100000, true],
      ["el rango cae entre dos precios sin incluir ninguno", 11000, 24000, false],
      ["el rango está por debajo del más barato", 0, 9999, false],
      ["el rango está por encima del más caro", 50001, 90000, false],
      ["un precio coincide con el mínimo del rango", 50000, 60000, true],
      ["un precio coincide con el máximo del rango", 1000, 10000, true],
    ])("%s → %s", (_caso, minimo, maximo, esperado) => {
      expect(evento.tuPrecioEstaEntre(minimo, maximo)).toBe(esperado);
    });

    it("un evento sin tipos de entrada no está en ningún rango", () => {
      const sinEntradas = new Evento({ nombre: "Charla", descripcion: "x", fecha: new Date() });
      expect(sinEntradas.tuPrecioEstaEntre(0, 1000000)).toBe(false);
    });
  });
});
