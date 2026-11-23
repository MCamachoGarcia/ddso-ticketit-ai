import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { bearer } from "../ayudas/autenticacion.js";
import { app } from "../../src/app.js";
import { cargarSeed } from "../../src/scripts/seed.js";

// Seed: el evento 7 (de Ana, ya pasó) tiene la reseña de Leo (5 estrellas, por su compra 5 utilizada).
// Sofía (4) usó una entrada del evento 7 y todavía no lo reseñó (compra 6). La Productora (2) no tiene reseñas. El evento 1 es de Ana y es futuro.
const ANA = "1";
const PRODUCTORA = "2";
const LEO = "3";
const SOFIA = "4";

const resenar = (eventoId, body, usuarioId = LEO) => {
  const pedido = request(app).post(`/eventos/${eventoId}/resenias`);
  if (usuarioId) pedido.set("Authorization", bearer(usuarioId));
  return pedido.send(body);
};


describe("API de reseñas", () => {
  beforeEach(async () => {
    await cargarSeed();
  });

  describe("POST /eventos/:id/resenias (C5)", () => {
    it("un comprador que usó su entrada reseña el evento", async () => {
      const res = await resenar("7", { puntuacion: 3, detalle: "  Buen sonido, mucha fila  " }, SOFIA);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: "2",
        evento: { id: "7" },
        comprador: { id: SOFIA, nombre: "Sofía" },
        puntuacion: 3,
        detalle: "Buen sonido, mucha fila",
      });
    });

    it("no deja reseñar dos veces el mismo evento: 409", async () => {
      const res = await resenar("7", { puntuacion: 4, detalle: "Otra vez" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Ya reseñaste este evento");
    });

    it("no deja reseñar sin haber usado una entrada: 409", async () => {
      // Leo tiene una compra CONFIRMADA del evento 1, pero todavía no la usó
      const res = await resenar("1", { puntuacion: 5, detalle: "Todavía no fui" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Para reseñar un evento tenés que haber usado una entrada");
    });

    it.each([
      ["puntuación 0", { puntuacion: 0, detalle: "x" }, "puntuacion: La puntuación debe estar entre 1 y 5"],
      ["puntuación 6", { puntuacion: 6, detalle: "x" }, "puntuacion: La puntuación debe estar entre 1 y 5"],
      ["puntuación decimal", { puntuacion: 4.5, detalle: "x" }, "puntuacion: La puntuación debe ser un número entero"],
      ["sin comentario", { puntuacion: 4, detalle: "   " }, "detalle: El comentario es obligatorio"],
      ["un autor en el body", { puntuacion: 4, detalle: "x", compradorId: SOFIA }, "compradorId"],
    ])("responde 400 con %s", async (_caso, body, detalle) => {
      const res = await resenar("7", body);

      expect(res.status).toBe(400);
      expect(res.body.detalles.some((d) => d.includes(detalle))).toBe(true);
    });

    it.each([
      ["sin identificarse", null, 401],
      ["siendo organizador", ANA, 403],
    ])("responde %s → %i", async (_caso, usuarioId, codigo) => {
      expect((await resenar("7", { puntuacion: 5, detalle: "x" }, usuarioId)).status).toBe(codigo);
    });

    it("responde 404 si el evento no existe", async () => {
      expect((await resenar("99", { puntuacion: 5, detalle: "x" })).status).toBe(404);
    });
  });

  describe("GET /eventos/:id/resenias", () => {
    it("es público y trae el promedio del evento", async () => {
      const res = await request(app).get("/eventos/7/resenias");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ evento: { id: "7" }, promedio: 5, cantidad: 1 });
      expect(res.body.resenias.resultados[0]).toMatchObject({ comprador: { id: LEO }, puntuacion: 5 });
    });

    it("un evento sin reseñas devuelve promedio null", async () => {
      const res = await request(app).get("/eventos/1/resenias");
      expect(res.body).toMatchObject({ promedio: null, cantidad: 0, resenias: { total: 0 } });
    });

    it("responde 404 si el evento no existe", async () => {
      expect((await request(app).get("/eventos/99/resenias")).status).toBe(404);
    });
  });

  describe("GET /organizadores/:id/resenias (C6)", () => {
    it("es público: la reputación del organizador con las reseñas de todos sus eventos", async () => {
      const res = await request(app).get(`/organizadores/${ANA}/resenias`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ organizador: { id: ANA, nombre: "Ana" }, promedio: 5, cantidad: 1 });
    });

    it("el promedio cambia con cada reseña nueva", async () => {
      await resenar("7", { puntuacion: 2, detalle: "No me gustó" }, SOFIA);

      const res = await request(app).get(`/organizadores/${ANA}/resenias`);
      expect(res.body).toMatchObject({ promedio: 3.5, cantidad: 2 });
    });

    it("un organizador sin reseñas devuelve promedio null", async () => {
      const res = await request(app).get(`/organizadores/${PRODUCTORA}/resenias`);
      expect(res.body).toMatchObject({ promedio: null, cantidad: 0 });
    });

    it.each([
      ["un usuario que no existe", "99"],
      ["un comprador", LEO],
    ])("responde 404 con %s", async (_caso, id) => {
      expect((await request(app).get(`/organizadores/${id}/resenias`)).status).toBe(404);
    });
  });

  describe("el puntaje en los eventos", () => {
    it("el detalle de un evento trae el puntaje de su organizador", async () => {
      const res = await request(app).get("/eventos/1");
      expect(res.body.organizador.puntaje).toEqual({ promedio: 5, cantidad: 1 });
    });

    it.each(["asc", "desc"])("ordenar por puntaje (%s) deja al final a la Productora, que no tiene reseñas", async (direccion) => {
      const res = await request(app).get(`/eventos?orden=puntaje&direccion=${direccion}`);

      expect(res.status).toBe(200);
      const organizadores = res.body.resultados.map((evento) => evento.organizador.id);
      expect(organizadores).toEqual([ANA, ANA, ANA, PRODUCTORA, PRODUCTORA, PRODUCTORA]);
    });
  });
});
