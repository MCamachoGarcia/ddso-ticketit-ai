import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { app } from "../../src/app.js";
import { cargarSeed } from "../../src/scripts/seed.js";

// Seed: usuarios 1 Ana y 2 Productora (organizadores), 3 Leo y 4 Sofía (compradores).
// Evento 1 de Ana: tipos 1 Campo (cupo 500), 2 Platea, 3 VIP (cupo 20). Evento 2 de la Productora. Evento 7 de Ana, ya pasó.
// Compras: 1 Sofía VIP ev1 PENDIENTE · 2 Leo Campo ev1 CONFIRMADA · 3 Leo ev2 CANCELADA sin pagar
//          4 Sofía ev4 CANCELADA pagada · 5 Leo ev7 UTILIZADA
const ANA = "1";
const PRODUCTORA = "2";
const LEO = "3";
const SOFIA = "4";

const como = (usuarioId, pedido) => (usuarioId ? pedido.set("x-usuario-id", usuarioId) : pedido);
const comprar = (body, usuarioId = LEO) => como(usuarioId, request(app).post("/compras")).send(body);
const accion = (compraId, nombre, usuarioId) => como(usuarioId, request(app).post(`/compras/${compraId}/${nombre}`));

describe("API de compras", () => {
  beforeEach(async () => {
    await cargarSeed();
  });

  describe("POST /compras (C7)", () => {
    it("un comprador compra entradas: queda pendiente de pago, a su nombre", async () => {
      const res = await comprar({ eventoId: "1", tipoEntradaId: "2", cantidad: 2 });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: "6",
        evento: { id: "1" },
        tipoEntrada: { id: "2", nombre: "Platea" },
        cantidad: 2,
        precioUnitario: 52000,
        total: 104000,
        estado: "PENDIENTE_DE_PAGO",
        comprador: { id: LEO },
      });
    });

    it("descuenta del cupo: no deja comprar más de lo que queda", async () => {
      // VIP: cupo 20 y 1 ya reservada por Sofía
      expect((await comprar({ eventoId: "1", tipoEntradaId: "3", cantidad: 19 })).status).toBe(201);

      const res = await comprar({ eventoId: "1", tipoEntradaId: "3", cantidad: 1 }, SOFIA);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe("No hay cupo para 1 entrada(s) VIP: quedan 0");
    });

    it("una compra cancelada libera su cupo", async () => {
      await comprar({ eventoId: "1", tipoEntradaId: "3", cantidad: 19 });
      await accion("1", "cancelar", SOFIA); // Sofía cancela su VIP pendiente

      expect((await comprar({ eventoId: "1", tipoEntradaId: "3", cantidad: 1 })).status).toBe(201);
    });

    it("responde 409 si el evento ya se realizó", async () => {
      const res = await comprar({ eventoId: "7", tipoEntradaId: "12", cantidad: 1 });
      expect(res.status).toBe(409);
    });

    it("responde 400 si el tipo de entrada es de otro evento", async () => {
      const res = await comprar({ eventoId: "1", tipoEntradaId: "4", cantidad: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("El tipo de entrada 4 no pertenece al evento 1");
    });

    it("responde 404 si el evento no existe", async () => {
      expect((await comprar({ eventoId: "99", tipoEntradaId: "1", cantidad: 1 })).status).toBe(404);
    });

    it.each([
      ["cantidad 0", { cantidad: 0 }, "cantidad: La cantidad debe ser mayor a 0"],
      ["cantidad decimal", { cantidad: 1.5 }, "cantidad: La cantidad debe ser un número entero"],
      ["sin tipo de entrada", { tipoEntradaId: undefined }, "tipoEntradaId:"],
      ["un comprador en el body", { compradorId: SOFIA }, "compradorId"],
    ])("responde 400 con %s", async (_caso, cambios, detalle) => {
      const res = await comprar({ eventoId: "1", tipoEntradaId: "1", cantidad: 1, ...cambios });

      expect(res.status).toBe(400);
      expect(res.body.detalles.some((d) => d.includes(detalle))).toBe(true);
    });

    it("responde 401 sin identificarse y 403 si es un organizador", async () => {
      expect((await comprar({ eventoId: "1", tipoEntradaId: "1", cantidad: 1 }, null)).status).toBe(401);
      expect((await comprar({ eventoId: "1", tipoEntradaId: "1", cantidad: 1 }, ANA)).status).toBe(403);
    });
  });

  describe("GET /compras: mis compras (C1)", () => {
    it("devuelve solo las del comprador, con estado y días para el evento si está confirmada", async () => {
      const res = await como(LEO, request(app).get("/compras"));

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(3);
      expect(res.body.resultados.every((compra) => compra.comprador.id === LEO)).toBe(true);

      const porEstado = Object.fromEntries(res.body.resultados.map((compra) => [compra.estado, compra.diasParaElEvento]));
      expect(porEstado.CONFIRMADA).toBe(20);
      expect(porEstado.CANCELADA).toBeNull();
      expect(porEstado.UTILIZADA).toBeNull();
    });

    it("filtra por estado", async () => {
      const res = await como(LEO, request(app).get("/compras?estado=UTILIZADA"));
      expect(res.body.resultados.map((compra) => compra.id)).toEqual(["5"]);
    });

    it("responde 400 con un estado que no existe", async () => {
      expect((await como(LEO, request(app).get("/compras?estado=PERDIDA"))).status).toBe(400);
    });

    it("un organizador no tiene 'mis compras': 403", async () => {
      expect((await como(ANA, request(app).get("/compras"))).status).toBe(403);
    });
  });

  describe("GET /compras/:id", () => {
    it.each([
      ["el comprador", LEO, 200],
      ["el organizador del evento", ANA, 200],
      ["otro comprador", SOFIA, 403],
      ["otro organizador", PRODUCTORA, 403],
    ])("%s → %i", async (_quien, usuarioId, codigo) => {
      expect((await como(usuarioId, request(app).get("/compras/2"))).status).toBe(codigo);
    });

    it("responde 404 si no existe", async () => {
      expect((await como(LEO, request(app).get("/compras/99"))).status).toBe(404);
    });
  });

  describe("transiciones", () => {
    it("el organizador del evento confirma una compra pendiente", async () => {
      const res = await accion("1", "confirmar", ANA);

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe("CONFIRMADA");
      expect(res.body.historial.at(-1).quien.id).toBe(ANA);
    });

    it("el comprador cancela su compra confirmada y el organizador la reembolsa", async () => {
      expect((await accion("2", "cancelar", LEO)).body.estado).toBe("CANCELADA");
      expect((await accion("2", "reembolsar", ANA)).body.estado).toBe("REEMBOLSADA");
    });

    it("el organizador reembolsa una compra cancelada que se había pagado", async () => {
      const res = await accion("4", "reembolsar", ANA);
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe("REEMBOLSADA");
    });

    it("no se puede reembolsar una compra cancelada que nunca se pagó: 409", async () => {
      const res = await accion("3", "reembolsar", PRODUCTORA);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("No se puede reembolsar una compra que nunca se pagó");
    });

    it("no se puede marcar como usada antes del evento: 409", async () => {
      const res = await accion("2", "utilizar", ANA);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe("No se puede usar una entrada antes de que empiece el evento");
    });

    it("una compra utilizada no se puede cancelar: 409", async () => {
      const res = await accion("5", "cancelar", LEO);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe("No se puede pasar una compra de UTILIZADA a CANCELADA");
    });

    it.each([
      ["el comprador no puede confirmar", "1", "confirmar", SOFIA, 403],
      ["otro organizador no puede confirmar", "1", "confirmar", PRODUCTORA, 403],
      ["el organizador no puede cancelar", "2", "cancelar", ANA, 403],
      ["otro comprador no puede cancelar", "2", "cancelar", SOFIA, 403],
      ["el comprador no puede reembolsarse", "4", "reembolsar", SOFIA, 403],
      ["el comprador no puede marcarla como usada", "2", "utilizar", LEO, 403],
      ["sin identificarse", "2", "cancelar", null, 401],
      ["compra inexistente", "99", "cancelar", LEO, 404],
    ])("%s → %i", async (_caso, compraId, nombre, usuarioId, codigo) => {
      expect((await accion(compraId, nombre, usuarioId)).status).toBe(codigo);
    });

    it("una transición rechazada no cambia la compra", async () => {
      await accion("5", "cancelar", LEO);
      const res = await como(LEO, request(app).get("/compras/5"));
      expect(res.body.estado).toBe("UTILIZADA");
    });
  });

  describe("GET /eventos/:id/compras (O1)", () => {
    it("el organizador ve las compras de su evento y la disponibilidad de cada tipo", async () => {
      const res = await como(ANA, request(app).get("/eventos/1/compras"));

      expect(res.status).toBe(200);
      expect(res.body.evento).toEqual({ id: "1", nombre: "Los Pericos en el Luna Park" });
      expect(res.body.disponibilidad).toEqual([
        { tipoEntrada: { id: "1", nombre: "Campo" }, cupo: 500, ocupadas: 2, disponibles: 498 },
        { tipoEntrada: { id: "2", nombre: "Platea" }, cupo: 200, ocupadas: 0, disponibles: 200 },
        { tipoEntrada: { id: "3", nombre: "VIP" }, cupo: 20, ocupadas: 1, disponibles: 19 },
      ]);
      expect(res.body.compras.resultados.map((compra) => [compra.id, compra.estado])).toEqual([
        ["1", "PENDIENTE_DE_PAGO"],
        ["2", "CONFIRMADA"],
      ]);
    });

    it("filtra por estado y pagina", async () => {
      const res = await como(ANA, request(app).get("/eventos/1/compras?estado=CONFIRMADA&limit=1"));
      expect(res.body.compras).toMatchObject({ total: 1, limit: 1 });
    });

    it.each([
      ["otro organizador", PRODUCTORA, 403],
      ["un comprador", LEO, 403],
      ["sin identificarse", null, 401],
    ])("%s → %i", async (_quien, usuarioId, codigo) => {
      expect((await como(usuarioId, request(app).get("/eventos/1/compras"))).status).toBe(codigo);
    });

    it("responde 404 si el evento no existe", async () => {
      expect((await como(ANA, request(app).get("/eventos/99/compras"))).status).toBe(404);
    });
  });

  describe("editar un evento con compras", () => {
    it("no deja bajar el cupo por debajo de lo vendido: 409", async () => {
      const evento = (await request(app).get("/eventos/1")).body;
      const body = {
        nombre: evento.nombre,
        descripcion: evento.descripcion,
        categoriaId: evento.categoria.id,
        fecha: evento.fecha,
        multimedia: evento.multimedia,
        tiposEntrada: evento.tiposEntrada.map(({ id, nombre, descripcion, precio, cupo }) => ({
          id, nombre, descripcion, precio, cupo: id === "1" ? 1 : cupo,
        })),
      };

      const res = await como(ANA, request(app).put("/eventos/1")).send(body);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("El cupo de Campo no puede ser menor a las 2 entradas ya vendidas");
    });
  });
});
