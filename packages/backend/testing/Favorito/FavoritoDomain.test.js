import { beforeEach, describe, expect, it } from "@jest/globals";
import { Usuario } from "../../src/domain/entities/Usuario.js";

const evento = (id) => ({ id, nombre: `Evento ${id}` });

describe("Usuario: favoritos", () => {
  let leo;

  beforeEach(() => {
    leo = new Usuario({ id: "3", nombre: "Leo", apellido: "Ruiz" });
  });

  it("agrega un evento a favoritos", () => {
    leo.agregarFavorito(evento("1"));
    expect(leo.favoritos.map((e) => e.id)).toEqual(["1"]);
    expect(leo.esFavorito("1")).toBe(true);
  });

  it("marcar dos veces el mismo evento no lo duplica (compara por id)", () => {
    leo.agregarFavorito(evento("1"));
    leo.agregarFavorito(evento("1"));
    expect(leo.favoritos).toHaveLength(1);
  });

  it("quita un favorito, aceptando el id como número o texto", () => {
    leo.agregarFavorito(evento("1"));
    leo.agregarFavorito(evento("2"));
    leo.quitarFavorito(1);
    expect(leo.favoritos.map((e) => e.id)).toEqual(["2"]);
    expect(leo.esFavorito("1")).toBe(false);
  });

  it("quitar uno que no era favorito no cambia nada", () => {
    leo.agregarFavorito(evento("2"));
    leo.quitarFavorito("9");
    expect(leo.favoritos.map((e) => e.id)).toEqual(["2"]);
  });
});
