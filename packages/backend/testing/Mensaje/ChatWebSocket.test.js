import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { createRequire } from "module";
import request from "supertest";
import { bearer } from "../ayudas/autenticacion.js";

// El token solo (sin "Bearer "), como lo manda el cliente en el primer mensaje del socket
const tokenDe = (usuarioId) => bearer(usuarioId).slice("Bearer ".length);
import { app } from "../../src/app.js";
import { cargarSeed } from "../../src/scripts/seed.js";
import { chatWebSocket } from "../../src/websocket/ChatWebSocket.js";

const require = createRequire(import.meta.url);
const { WebSocket } = require("ws");

// Prueba de punta a punta: servidor real, cliente WebSocket real y mensajes enviados por REST.
// Seed: la compra 2 es de Leo (3) en un evento de Ana (1).
const ANA = "1";
const LEO = "3";
const SOFIA = "4";

// Cliente que guarda lo que recibe y permite esperar el próximo mensaje
const conectar = (puerto) =>
  new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://localhost:${puerto}/ws`);
    const recibidos = [];
    const esperando = [];
    socket.on("message", (datos) => {
      const mensaje = JSON.parse(datos.toString());
      const siguiente = esperando.shift();
      if (siguiente) siguiente(mensaje);
      else recibidos.push(mensaje);
    });
    socket.proximo = () =>
      recibidos.length ? Promise.resolve(recibidos.shift()) : new Promise((resolver) => esperando.push(resolver));
    socket.pedir = (datos) => {
      socket.send(typeof datos === "string" ? datos : JSON.stringify(datos));
      return socket.proximo();
    };
    socket.on("open", () => resolve(socket));
    socket.on("error", reject);
  });

describe("Chat en tiempo real por WebSocket", () => {
  let servidor;
  let puerto;
  let sockets;

  beforeAll(async () => {
    servidor = app.listen(0);
    chatWebSocket.iniciar(servidor);
    puerto = servidor.address().port;
  });

  afterAll(async () => {
    chatWebSocket.cerrar();
    await new Promise((resolve) => servidor.close(resolve));
  });

  beforeEach(async () => {
    await cargarSeed();
    sockets = [];
  });

  afterEach(() => {
    sockets.forEach((socket) => socket.close());
  });

  const abrir = async () => {
    const socket = await conectar(puerto);
    sockets.push(socket);
    return socket;
  };

  const suscribirComo = async (usuarioId, compraId) => {
    const socket = await abrir();
    expect(await socket.pedir({ tipo: "autenticar", token: tokenDe(usuarioId) })).toMatchObject({ tipo: "autenticado" });
    expect(await socket.pedir({ tipo: "suscribir", compraId })).toEqual({ tipo: "suscripto", compraId });
    return socket;
  };

  it("un mensaje enviado por REST le llega en tiempo real a los dos participantes", async () => {
    const leo = await suscribirComo(LEO, "2");
    const ana = await suscribirComo(ANA, "2");

    const respuesta = await request(servidor)
      .post("/compras/2/mensajes")
      .set("Authorization", bearer(ANA))
      .send({ mensaje: "Las puertas abren a las 19" });

    const esperado = { tipo: "mensaje", compraId: "2", mensaje: respuesta.body };
    expect(await leo.proximo()).toEqual(esperado);
    expect(await ana.proximo()).toEqual(esperado);
  });

  it("no le llega a quien tiene abierto el chat de otra compra", async () => {
    const otroChat = await suscribirComo(LEO, "3");
    const mismoChat = await suscribirComo(LEO, "2");

    await request(servidor).post("/compras/2/mensajes").set("Authorization", bearer(LEO)).send({ mensaje: "Hola" });

    expect((await mismoChat.proximo()).mensaje.mensaje).toBe("Hola");
    // El otro chat no recibió nada: lo próximo que recibe es la respuesta a este pedido
    expect(await otroChat.pedir({ tipo: "desuscribir", compraId: "3" })).toEqual({ tipo: "desuscripto", compraId: "3" });
  });

  it("después de desuscribirse no recibe más mensajes", async () => {
    const leo = await suscribirComo(LEO, "2");
    await leo.pedir({ tipo: "desuscribir", compraId: "2" });

    await request(servidor).post("/compras/2/mensajes").set("Authorization", bearer(ANA)).send({ mensaje: "Hola" });

    expect(await leo.pedir({ tipo: "suscribir", compraId: "2" })).toEqual({ tipo: "suscripto", compraId: "2" });
  });

  it("no deja suscribirse al chat de una compra ajena", async () => {
    const sofia = await abrir();
    await sofia.pedir({ tipo: "autenticar", token: tokenDe(SOFIA) });

    expect(await sofia.pedir({ tipo: "suscribir", compraId: "2" })).toEqual({
      tipo: "error",
      error: "Solo el comprador o el organizador del evento pueden ver esta compra",
    });
  });

  it.each([
    ["suscribirse sin autenticarse", { tipo: "suscribir", compraId: "2" }, "Primero hay que autenticarse"],
    ["autenticarse sin token", { tipo: "autenticar" }, "Falta el token"],
    ["autenticarse con un token inválido", { tipo: "autenticar", token: "no-es-un-jwt" }, "El token no es válido"],
    ["mandar algo que no es JSON", "hola", "El mensaje no es un JSON válido"],
  ])("responde un error al %s, sin cortar la conexión", async (_caso, pedido, error) => {
    const socket = await abrir();

    expect(await socket.pedir(pedido)).toEqual({ tipo: "error", error });
    expect(await socket.pedir({ tipo: "autenticar", token: tokenDe(LEO) })).toMatchObject({ tipo: "autenticado" });
  });
});
