import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../../src/app.js";
import { cargarSeed } from "../../src/scripts/seed.js";

// Ids del seed: usuarios 1 y 2 son organizadores, 3 y 4 compradores. El evento 7 ya pasó.
const ORGANIZADOR = "1";
const COMPRADOR = "3";

const enDias = (dias) => new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

const eventoValido = () => ({
  nombre: "Recital de prueba",
  descripcion: "Banda invitada",
  categoriaId: "1",
  fecha: enDias(15),
  multimedia: ["https://example.com/flyer.jpg"],
  tiposEntrada: [
    { nombre: "Campo", precio: 20000, cupo: 100 },
    { nombre: "VIP", descripcion: "Con meet & greet", precio: 60000, cupo: 10 },
  ],
});

const crear = (body, usuarioId = ORGANIZADOR) => {
  const pedido = request(app).post("/eventos");
  if (usuarioId) pedido.set("x-usuario-id", usuarioId);
  return pedido.send(body);
};

describe("API de eventos", () => {
  beforeEach(async () => {
    await cargarSeed();
  });

  describe("GET /eventos", () => {
    it("devuelve los eventos próximos del seed, paginados y ordenados por fecha", async () => {
      const res = await request(app).get("/eventos");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ page: 1, limit: 10, total: 6, totalPages: 1 });
      const fechas = res.body.resultados.map((evento) => evento.fecha);
      expect(fechas).toEqual([...fechas].sort());
      expect(res.body.resultados.map((evento) => evento.nombre)).not.toContain("Recital acústico de otoño");
    });

    it("combina filtros, orden y paginación", async () => {
      const res = await request(app).get("/eventos?texto=musica&orden=precio&direccion=desc&limit=1");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ total: 1, limit: 1 });
      expect(res.body.resultados[0].nombre).toBe("Los Pericos en el Luna Park");
    });

    it("filtra por categoría", async () => {
      const res = await request(app).get("/eventos?categoriaId=2");
      expect(res.body.resultados.map((evento) => evento.nombre)).toEqual(["Hamlet"]);
    });

    it.each([
      ["orden desconocido", "orden=popularidad", "orden:"],
      ["dirección inválida", "direccion=arriba", "direccion:"],
      ["precio no numérico", "precioMin=barato", "precioMin: Debe ser un número no negativo"],
      ["precioMin mayor a precioMax", "precioMin=100&precioMax=10", "precioMin: precioMin no puede ser mayor a precioMax"],
      ["página inválida", "page=0", "page: Debe ser un número entero positivo"],
      ["parámetro desconocido", "ciudad=caba", "ciudad"],
    ])("responde 400 con %s", async (_caso, query, detalle) => {
      const res = await request(app).get(`/eventos?${query}`);

      expect(res.status).toBe(400);
      expect(res.body.detalles.some((d) => d.includes(detalle))).toBe(true);
    });
  });

  describe("GET /eventos/:id", () => {
    it("devuelve el detalle de un evento, aunque ya haya pasado", async () => {
      const res = await request(app).get("/eventos/7");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: "7", nombre: "Recital acústico de otoño", organizador: { id: "1" } });
    });

    it("responde 404 si no existe", async () => {
      const res = await request(app).get("/eventos/99");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /eventos", () => {
    it("un organizador crea un evento: queda como organizador y aparece en la búsqueda", async () => {
      const res = await crear(eventoValido());

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: "8",
        nombre: "Recital de prueba",
        categoria: { id: "1", nombre: "Música" },
        organizador: { id: "1", nombre: "Ana", apellido: "Paz" },
        precioDesde: 20000,
      });
      expect(res.body.tiposEntrada).toEqual([
        { id: expect.any(String), nombre: "Campo", descripcion: "", precio: 20000, cupo: 100 },
        { id: expect.any(String), nombre: "VIP", descripcion: "Con meet & greet", precio: 60000, cupo: 10 },
      ]);

      const busqueda = await request(app).get("/eventos?texto=recital de prueba");
      expect(busqueda.body.total).toBe(1);
    });

    it("ignora un organizador enviado en el body: el body no lo acepta", async () => {
      const res = await crear({ ...eventoValido(), organizadorId: "2" });
      expect(res.status).toBe(400);
    });

    it("responde 401 si no se identifica al usuario", async () => {
      const res = await crear(eventoValido(), null);
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Falta identificar al usuario (header x-usuario-id)");
    });

    it("responde 401 si el usuario no existe", async () => {
      const res = await crear(eventoValido(), "99");
      expect(res.status).toBe(401);
    });

    it("responde 403 si lo intenta un comprador", async () => {
      const res = await crear(eventoValido(), COMPRADOR);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Esta acción solo la puede realizar un usuario ORGANIZADOR");
    });

    it.each([
      ["sin tipos de entrada", { tiposEntrada: [] }, "tiposEntrada: El evento debe tener al menos un tipo de entrada"],
      [
        "tipos de entrada con el mismo nombre",
        { tiposEntrada: [{ nombre: "VIP", precio: 1, cupo: 1 }, { nombre: "vip", precio: 2, cupo: 1 }] },
        "tiposEntrada: Los tipos de entrada de un evento no pueden repetir el nombre",
      ],
      ["cupo en 0", { tiposEntrada: [{ nombre: "General", precio: 1, cupo: 0 }] }, "tiposEntrada.0.cupo: El cupo debe ser mayor a 0"],
      ["precio negativo", { tiposEntrada: [{ nombre: "General", precio: -1, cupo: 1 }] }, "tiposEntrada.0.precio: El precio no puede ser negativo"],
      ["nombre vacío", { nombre: "  " }, "nombre: El nombre es obligatorio"],
      ["fecha con formato inválido", { fecha: "el sábado" }, "fecha:"],
      ["multimedia que no es una URL", { multimedia: ["flyer.jpg"] }, "multimedia.0: Cada elemento multimedia debe ser una URL"],
    ])("responde 400 con %s", async (_caso, cambios, detalle) => {
      const res = await crear({ ...eventoValido(), ...cambios });

      expect(res.status).toBe(400);
      expect(res.body.detalles.some((d) => d.includes(detalle))).toBe(true);
    });

    it("responde 400 si la fecha ya pasó", async () => {
      const res = await crear({ ...eventoValido(), fecha: enDias(-1) });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("La fecha del evento debe ser futura");
    });

    it("responde 404 si la categoría no existe", async () => {
      const res = await crear({ ...eventoValido(), categoriaId: "99" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("No existe una categoría con id 99");
    });
  });

  // Evento 1 del seed: organizador 1 (Ana), tipos 1 Campo, 2 Platea y 3 VIP.
  // Evento 2: organizador 2. Evento 7: organizador 1, ya pasó (tipo 12).
  describe("PUT /eventos/:id", () => {
    const edicionValida = () => ({
      nombre: "Los Pericos - fecha reprogramada",
      descripcion: "Recital aniversario con todos sus clásicos",
      categoriaId: "5",
      fecha: enDias(40),
      multimedia: [],
      tiposEntrada: [
        { id: "1", nombre: "Campo", descripcion: "De pie", precio: 38000, cupo: 600 },
        { id: "2", nombre: "Platea", descripcion: "Sentado", precio: 52000, cupo: 200 },
        { id: "3", nombre: "VIP", descripcion: "Con meet & greet", precio: 120000, cupo: 20 },
        { nombre: "Palco", descripcion: "Para 4 personas", precio: 300000, cupo: 5 },
      ],
    });

    const editar = (eventoId, body, usuarioId = ORGANIZADOR) => {
      const pedido = request(app).put(`/eventos/${eventoId}`);
      if (usuarioId) pedido.set("x-usuario-id", usuarioId);
      return pedido.send(body);
    };

    it("el organizador edita su evento: cambia los datos, conserva los ids y agrega el tipo nuevo", async () => {
      const res = await editar("1", edicionValida());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: "1",
        nombre: "Los Pericos - fecha reprogramada",
        categoria: { id: "5", nombre: "Festivales" },
        organizador: { id: "1" },
        precioDesde: 38000,
      });
      expect(res.body.tiposEntrada.map((tipo) => [tipo.id, tipo.nombre, tipo.precio])).toEqual([
        ["1", "Campo", 38000],
        ["2", "Platea", 52000],
        ["3", "VIP", 120000],
        ["13", "Palco", 300000],
      ]);

      const detalle = await request(app).get("/eventos/1");
      expect(detalle.body.nombre).toBe("Los Pericos - fecha reprogramada");
    });

    it("responde 401 sin identificarse", async () => {
      expect((await editar("1", edicionValida(), null)).status).toBe(401);
    });

    it("responde 403 si lo intenta un comprador", async () => {
      expect((await editar("1", edicionValida(), COMPRADOR)).status).toBe(403);
    });

    it("responde 403 si lo intenta otro organizador", async () => {
      const res = await editar("2", edicionValida(), ORGANIZADOR);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Solo el organizador del evento puede realizar esta acción");
    });

    it("responde 404 si el evento no existe", async () => {
      expect((await editar("99", edicionValida())).status).toBe(404);
    });

    it("responde 409 si el evento ya se realizó", async () => {
      const res = await editar("7", { ...edicionValida(), tiposEntrada: [{ id: "12", nombre: "General", precio: 1, cupo: 1 }] });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("No se puede editar un evento que ya se realizó");
    });

    it("responde 409 si se quita un tipo de entrada", async () => {
      const body = edicionValida();
      body.tiposEntrada = body.tiposEntrada.filter((tipo) => tipo.id !== "3");

      const res = await editar("1", body);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("No se pueden quitar tipos de entrada de un evento. Faltan: VIP (id 3)");
    });

    it("responde 400 si un tipo de entrada es de otro evento", async () => {
      const body = edicionValida();
      body.tiposEntrada.push({ id: "4", nombre: "Pullman", precio: 1, cupo: 1 });

      const res = await editar("1", body);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("El tipo de entrada 4 no pertenece a este evento");
    });

    it("responde 400 si un tipo aparece dos veces", async () => {
      const body = edicionValida();
      body.tiposEntrada.push({ id: "1", nombre: "Campo bis", precio: 1, cupo: 1 });

      const res = await editar("1", body);

      expect(res.status).toBe(400);
      expect(res.body.detalles).toContain("tiposEntrada: Un mismo tipo de entrada no puede aparecer dos veces");
    });

    it("responde 400 si la nueva fecha ya pasó", async () => {
      const res = await editar("1", { ...edicionValida(), fecha: enDias(-1) });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("La fecha del evento debe ser futura");
    });

    it("responde 400 si falta un campo, porque PUT recibe el evento completo", async () => {
      const { descripcion: _sinDescripcion, ...body } = edicionValida();

      const res = await editar("1", body);

      expect(res.status).toBe(400);
      expect(res.body.detalles.some((d) => d.startsWith("descripcion:"))).toBe(true);
    });

    it("si la edición falla, el evento queda como estaba", async () => {
      const body = edicionValida();
      body.tiposEntrada = body.tiposEntrada.filter((tipo) => tipo.id !== "3");
      await editar("1", body);

      const detalle = await request(app).get("/eventos/1");
      expect(detalle.body.nombre).toBe("Los Pericos en el Luna Park");
      expect(detalle.body.tiposEntrada).toHaveLength(3);
    });
  });
});
