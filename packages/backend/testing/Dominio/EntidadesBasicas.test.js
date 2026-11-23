import { describe, expect, it } from "@jest/globals";
import { Usuario } from "../../src/domain/entities/Usuario.js";
import { Categoria } from "../../src/domain/entities/Categoria.js";
import { Mensaje } from "../../src/domain/entities/Mensaje.js";
import { Resenia } from "../../src/domain/entities/Resenia.js";
import { CambioEstadoCompra } from "../../src/domain/entities/CambioEstadoCompra.js";
import { EstadoCompra } from "../../src/domain/enums/EstadoCompra.js";
import { RolUsuario } from "../../src/domain/enums/RolUsuario.js";

// Entidades sin comportamiento propio: se prueba que guarden sus datos y sus valores por defecto
describe("Entidades básicas del dominio", () => {
  const usuario = new Usuario({
    nombre: "Leo",
    apellido: "Ruiz",
    email: "leo@demo.com",
    passwordHash: "hash-de-prueba",
    rol: RolUsuario.COMPRADOR,
  });

  it("Usuario guarda sus datos y su rol, y arranca sin id y sin favoritos", () => {
    expect(usuario).toEqual({
      id: null,
      nombre: "Leo",
      apellido: "Ruiz",
      email: "leo@demo.com",
      passwordHash: "hash-de-prueba",
      rol: RolUsuario.COMPRADOR,
      favoritos: [],
    });
  });

  it("RolUsuario tiene los 2 roles y no se puede modificar", () => {
    expect(Object.values(RolUsuario)).toEqual(["COMPRADOR", "ORGANIZADOR"]);
    expect(Object.isFrozen(RolUsuario)).toBe(true);
  });

  it("cada Usuario tiene su propia lista de favoritos", () => {
    const otro = new Usuario({ nombre: "Ana", apellido: "Paz" });
    otro.favoritos.push("evento");
    expect(usuario.favoritos).toEqual([]);
  });

  it("Categoria guarda nombre y descripción", () => {
    expect(new Categoria({ nombre: "Música", descripcion: "Recitales" })).toEqual({
      id: null,
      nombre: "Música",
      descripcion: "Recitales",
    });
  });

  it("Mensaje toma la fecha actual si no se indica y arranca sin id (lo asigna el repositorio)", () => {
    const antes = new Date();
    const mensaje = new Mensaje({ usuario, mensaje: "¿A qué hora abren las puertas?" });

    expect(mensaje.usuario).toBe(usuario);
    expect(mensaje.enviado.getTime()).toBeGreaterThanOrEqual(antes.getTime());
    expect(mensaje.id).toBeNull();
  });

  it("Resenia guarda comprador, evento, detalle y puntuación", () => {
    const resenia = new Resenia({ comprador: usuario, evento: "evento", detalle: "Muy bueno", puntuacion: 4.5 });
    expect(resenia).toMatchObject({ id: null, comprador: usuario, detalle: "Muy bueno", puntuacion: 4.5 });
  });

  it("CambioEstadoCompra toma la fecha actual si no se indica", () => {
    const cambio = new CambioEstadoCompra({ estado: EstadoCompra.CONFIRMADA, quien: usuario });
    expect(cambio.fechaHora).toBeInstanceOf(Date);
    expect(cambio).not.toHaveProperty("compra");
  });

  it("EstadoCompra tiene los 5 estados y no se puede modificar", () => {
    expect(Object.values(EstadoCompra)).toEqual([
      "PENDIENTE_DE_PAGO",
      "CONFIRMADA",
      "UTILIZADA",
      "CANCELADA",
      "REEMBOLSADA",
    ]);
    expect(Object.isFrozen(EstadoCompra)).toBe(true);
  });
});
