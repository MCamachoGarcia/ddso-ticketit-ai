import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../../src/app.js";
import { cargarSeed } from "../../src/scripts/seed.js";

// Prueba los endpoints de punta a punta: ruta → controller → service → repositorio en memoria con el seed
describe("API de categorías", () => {
  beforeEach(async () => {
    await cargarSeed();
  });

  describe("GET /categorias", () => {
    it("devuelve todas las categorías del seed como lista, ordenadas por nombre", async () => {
      const res = await request(app).get("/categorias");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.map((c) => c.nombre)).toEqual([
        "Conferencias",
        "Deportes",
        "Festivales",
        "Música",
        "Stand-up",
        "Teatro",
      ]);
      expect(res.body[0]).toEqual({ id: "4", nombre: "Conferencias", descripcion: "Charlas, congresos y workshops" });
    });
  });

  describe("GET /categorias/:id", () => {
    it("devuelve una categoría existente", async () => {
      const res = await request(app).get("/categorias/1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: "1", nombre: "Música", descripcion: "Recitales y conciertos" });
    });

    it("responde 404 si no existe", async () => {
      const res = await request(app).get("/categorias/99");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "No existe una categoría con id 99", timestamp: expect.any(String) });
    });
  });

  it("las categorías no se pueden crear desde la API", async () => {
    const res = await request(app).post("/categorias").send({ nombre: "Cine", descripcion: "x" });
    expect(res.status).toBe(404);
  });
});

describe("API: rutas generales", () => {
  it("GET /healthcheck responde ok", async () => {
    const res = await request(app).get("/healthcheck");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("la raíz responde solo el nombre de la API, sin la lista de endpoints", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "API AI Ticket It" });
  });

  it("una ruta inexistente responde 404 con el formato de error", async () => {
    const res = await request(app).get("/no-existe");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("No existe la ruta GET /no-existe");
  });

  it("un body con JSON mal formado responde 400", async () => {
    const res = await request(app)
      .post("/categorias")
      .set("Content-Type", "application/json")
      .send("{ mal formado");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("El cuerpo del pedido no es un JSON válido");
  });
});
