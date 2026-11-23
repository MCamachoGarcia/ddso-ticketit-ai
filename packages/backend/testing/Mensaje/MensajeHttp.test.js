import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { bearer } from "../ayudas/autenticacion.js";
import { app } from "../../src/app.js";
import { cargarSeed } from "../../src/scripts/seed.js";

// Seed: la compra 2 es de Leo (3) en un evento de Ana (1) y tiene 3 mensajes.
// La 3 es de Leo en un evento de la Productora (2), cancelada. La 5 es de Leo, utilizada.
const ANA = "1";
const PRODUCTORA = "2";
const LEO = "3";
const SOFIA = "4";

const como = (usuarioId, pedido) => (usuarioId ? pedido.set("Authorization", bearer(usuarioId)) : pedido);
const leer = (compraId, usuarioId, query = "") => como(usuarioId, request(app).get(`/compras/${compraId}/mensajes${query}`));
const escribir = (compraId, usuarioId, body) => como(usuarioId, request(app).post(`/compras/${compraId}/mensajes`)).send(body);

describe("API del chat de una compra", () => {
  beforeEach(async () => {
    await cargarSeed();
  });

  describe("GET /compras/:id/mensajes", () => {
    it("el comprador ve el chat en orden cronológico", async () => {
      const res = await leer("2", LEO);

      expect(res.status).toBe(200);
      expect(res.body.hayAnteriores).toBe(false);
      expect(res.body.mensajes.map((m) => [m.usuario.id, m.mensaje])).toEqual([
        [LEO, "Hola, ¿a qué hora abren las puertas?"],
        [ANA, "¡Hola Leo! Las puertas abren a las 19 hs."],
        [LEO, "Genial, ¡gracias!"],
      ]);
    });

    it("el organizador del evento también lo ve", async () => {
      expect((await leer("2", ANA)).status).toBe(200);
    });

    it("con limit trae los últimos y avisa que hay anteriores", async () => {
      const res = await leer("2", LEO, "?limit=1");

      expect(res.body.mensajes.map((m) => m.mensaje)).toEqual(["Genial, ¡gracias!"]);
      expect(res.body.hayAnteriores).toBe(true);
    });

    it("con antes carga los anteriores a un mensaje", async () => {
      const { mensajes } = (await leer("2", LEO)).body;
      const res = await leer("2", LEO, `?antes=${encodeURIComponent(mensajes[2].enviado)}`);

      expect(res.body.mensajes.map((m) => m.id)).toEqual([mensajes[0].id, mensajes[1].id]);
    });

    it.each([
      ["otro comprador", SOFIA, 403],
      ["otro organizador", PRODUCTORA, 403],
      ["sin identificarse", null, 401],
    ])("%s → %i", async (_quien, usuarioId, codigo) => {
      expect((await leer("2", usuarioId)).status).toBe(codigo);
    });

    it("responde 404 si la compra no existe", async () => {
      expect((await leer("99", LEO)).status).toBe(404);
    });

    it.each([
      ["limit mayor a 50", "?limit=51", "limit: El límite máximo es 50"],
      ["antes y desde juntos", "?antes=2026-11-01T00:00:00Z&desde=2026-10-01T00:00:00Z", "antes: No se pueden usar antes y desde a la vez"],
      ["una fecha inválida", "?desde=ayer", "desde:"],
    ])("responde 400 con %s", async (_caso, query, detalle) => {
      const res = await leer("2", LEO, query);

      expect(res.status).toBe(400);
      expect(res.body.detalles.some((d) => d.includes(detalle))).toBe(true);
    });
  });

  describe("POST /compras/:id/mensajes", () => {
    it("el organizador responde: el autor es quien está identificado", async () => {
      const res = await escribir("2", ANA, { mensaje: "  Recordá traer el DNI  " });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: "4",
        usuario: { id: ANA, nombre: "Ana", rol: "ORGANIZADOR" },
        mensaje: "Recordá traer el DNI",
      });

      const chat = (await leer("2", LEO)).body.mensajes;
      expect(chat.at(-1).mensaje).toBe("Recordá traer el DNI");
    });

    it.each([
      ["cancelada", "3", PRODUCTORA],
      ["utilizada", "5", LEO],
    ])("se puede escribir en una compra %s (en cualquier momento)", async (_estado, compraId, usuarioId) => {
      expect((await escribir(compraId, usuarioId, { mensaje: "Consulta" })).status).toBe(201);
    });

    it.each([
      ["vacío", { mensaje: "   " }, "mensaje: El mensaje no puede estar vacío"],
      ["demasiado largo", { mensaje: "a".repeat(1001) }, "mensaje: El mensaje no puede superar los 1000 caracteres"],
      ["con un autor en el body", { mensaje: "Hola", usuarioId: SOFIA }, "usuarioId"],
    ])("responde 400 con un mensaje %s", async (_caso, body, detalle) => {
      const res = await escribir("2", LEO, body);

      expect(res.status).toBe(400);
      expect(res.body.detalles.some((d) => d.includes(detalle))).toBe(true);
    });

    it("alguien ajeno a la compra no puede escribir", async () => {
      expect((await escribir("2", SOFIA, { mensaje: "Hola" })).status).toBe(403);
    });
  });
});
