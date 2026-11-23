import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { bearer } from "../ayudas/autenticacion.js";
import { app } from "../../src/app.js";
import { cargarSeed } from "../../src/scripts/seed.js";

// Seed: Leo (3) tiene en favoritos Hamlet (2) y después el Festival de Verano (5). Sofía (4) no tiene.
const ANA = "1";
const LEO = "3";
const SOFIA = "4";

const como = (usuarioId, pedido) => (usuarioId ? pedido.set("Authorization", bearer(usuarioId)) : pedido);
const favoritos = (usuarioId) => como(usuarioId, request(app).get("/eventos/favoritos"));
const marcar = (eventoId, usuarioId = LEO) => como(usuarioId, request(app).put(`/eventos/${eventoId}/favorito`));
const desmarcar = (eventoId, usuarioId = LEO) => como(usuarioId, request(app).delete(`/eventos/${eventoId}/favorito`));
const idsDe = async (usuarioId) => (await favoritos(usuarioId)).body.resultados.map((evento) => evento.id);

describe("API de favoritos", () => {
  beforeEach(async () => {
    await cargarSeed();
  });

  describe("GET /eventos/favoritos", () => {
    it("el comprador ve sus favoritos, los últimos marcados primero, con el formato de la búsqueda", async () => {
      const res = await favoritos(LEO);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ page: 1, limit: 10, total: 2 });
      expect(res.body.resultados.map((evento) => evento.nombre)).toEqual(["Festival de Verano", "Hamlet"]);
      expect(res.body.resultados[0]).toHaveProperty("organizador.puntaje");
      expect(res.body.resultados[0].realizado).toBe(false);
    });

    it("un comprador sin favoritos recibe una lista vacía", async () => {
      expect((await favoritos(SOFIA)).body.total).toBe(0);
    });

    it("no se confunde con el detalle de un evento con id 'favoritos'", async () => {
      expect((await favoritos(LEO)).body).toHaveProperty("resultados");
    });

    it.each([
      ["sin identificarse", null, 401],
      ["un organizador", ANA, 403],
    ])("%s → %i", async (_quien, usuarioId, codigo) => {
      expect((await favoritos(usuarioId)).status).toBe(codigo);
    });
  });

  describe("PUT /eventos/:id/favorito", () => {
    it("marca un evento como favorito: responde 204 y aparece primero en la lista", async () => {
      const res = await marcar("1");

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
      expect(await idsDe(LEO)).toEqual(["1", "5", "2"]);
    });

    it("es idempotente: marcar dos veces no lo duplica", async () => {
      await marcar("1");
      expect((await marcar("1")).status).toBe(204);
      expect(await idsDe(LEO)).toEqual(["1", "5", "2"]);
    });

    it("se puede marcar un evento que ya se realizó, y aparece como realizado", async () => {
      await marcar("7", SOFIA);
      const [evento] = (await favoritos(SOFIA)).body.resultados;
      expect(evento).toMatchObject({ id: "7", realizado: true });
    });

    it("los favoritos de cada comprador son independientes", async () => {
      await marcar("1", SOFIA);
      expect(await idsDe(SOFIA)).toEqual(["1"]);
      expect(await idsDe(LEO)).toEqual(["5", "2"]);
    });

    it.each([
      ["evento inexistente", "99", LEO, 404],
      ["sin identificarse", "1", null, 401],
      ["un organizador", "1", ANA, 403],
    ])("%s → %i", async (_caso, eventoId, usuarioId, codigo) => {
      expect((await marcar(eventoId, usuarioId)).status).toBe(codigo);
    });
  });

  describe("DELETE /eventos/:id/favorito", () => {
    it("quita un favorito: responde 204 y deja de aparecer", async () => {
      const res = await desmarcar("2");

      expect(res.status).toBe(204);
      expect(await idsDe(LEO)).toEqual(["5"]);
    });

    it("es idempotente: quitar uno que no era favorito también responde 204", async () => {
      expect((await desmarcar("1")).status).toBe(204);
      expect(await idsDe(LEO)).toEqual(["5", "2"]);
    });

    it.each([
      ["evento inexistente", "99", LEO, 404],
      ["sin identificarse", "2", null, 401],
      ["un organizador", "2", ANA, 403],
    ])("%s → %i", async (_caso, eventoId, usuarioId, codigo) => {
      expect((await desmarcar(eventoId, usuarioId)).status).toBe(codigo);
    });
  });
});
