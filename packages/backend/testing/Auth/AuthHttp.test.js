import { beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../src/app.js";
import { cargarSeed, CONTRASENIA_DEMO } from "../../src/scripts/seed.js";
import { UsuarioRepository } from "../../src/repositories/UsuarioRepository.js";
import { bearer } from "../ayudas/autenticacion.js";

// Seed: Ana (1) y Productora Sur (2) son organizadoras; Leo (3) y Sofía (4), compradores. Todos con "demo1234".
const LEO = { email: "leo.comprador@demo.com", password: CONTRASENIA_DEMO };

const login = (body) => request(app).post("/auth/login").send(body);
const registro = (body) => request(app).post("/auth/registro").send(body);
const me = (authorization) => {
  const pedido = request(app).get("/auth/me");
  return authorization ? pedido.set("Authorization", authorization) : pedido;
};

const NUEVO = { nombre: "Caro", apellido: "Díaz", email: "caro@demo.com", password: "clave-segura", rol: "COMPRADOR" };

describe("Autenticación (decisión 42)", () => {
  beforeEach(async () => {
    await cargarSeed();
  });

  describe("POST /auth/login", () => {
    it("con email y contraseña correctos devuelve un token y el usuario, sin el hash de la contraseña", async () => {
      const res = await login(LEO);

      expect(res.status).toBe(200);
      expect(res.body.usuario).toEqual({ id: "3", nombre: "Leo", apellido: "Ruiz", email: LEO.email, rol: "COMPRADOR" });
      expect(res.body.usuario.passwordHash).toBeUndefined();
      // El payload lleva el id (sub), el rol y el vencimiento: 2 horas
      const payload = jwt.decode(res.body.token);
      expect(payload).toMatchObject({ sub: "3", rol: "COMPRADOR" });
      expect(payload.exp - payload.iat).toBe(2 * 60 * 60);
    });

    it("el email no distingue mayúsculas ni espacios", async () => {
      expect((await login({ ...LEO, email: "  Leo.Comprador@DEMO.com " })).status).toBe(200);
    });

    it.each([
      ["la contraseña es incorrecta", { ...LEO, password: "otra-cosa" }],
      ["el email no existe", { email: "nadie@demo.com", password: CONTRASENIA_DEMO }],
    ])("si %s responde 401 con el mismo mensaje (no revela qué emails existen)", async (_caso, body) => {
      const res = await login(body);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Email o contraseña incorrectos");
    });

    it.each([
      ["sin email", { password: CONTRASENIA_DEMO }],
      ["con un email mal escrito", { email: "leo", password: CONTRASENIA_DEMO }],
      ["sin contraseña", { email: LEO.email }],
    ])("%s responde 400", async (_caso, body) => {
      expect((await login(body)).status).toBe(400);
    });
  });

  describe("POST /auth/registro", () => {
    it("crea la cuenta con el rol elegido y ya devuelve un token", async () => {
      const res = await registro(NUEVO);

      expect(res.status).toBe(201);
      expect(res.body.usuario).toMatchObject({ nombre: "Caro", email: "caro@demo.com", rol: "COMPRADOR" });
      expect((await me(`Bearer ${res.body.token}`)).body.email).toBe("caro@demo.com");
    });

    it("guarda solo el hash de la contraseña, y después se puede ingresar con ella", async () => {
      const { body } = await registro(NUEVO);
      const guardado = await new UsuarioRepository().findById(body.usuario.id);

      expect(guardado.passwordHash).not.toBe(NUEVO.password);
      expect(guardado.passwordHash).toMatch(/^\$2[aby]\$10\$/); // formato de bcrypt con 10 rondas
      expect((await login({ email: NUEVO.email, password: NUEVO.password })).status).toBe(200);
    });

    it("no permite dos cuentas con el mismo email (aunque cambien las mayúsculas): 409", async () => {
      const res = await registro({ ...NUEVO, email: "LEO.comprador@demo.com" });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Ya existe una cuenta con ese email");
    });

    it.each([
      ["una contraseña de menos de 8 caracteres", { ...NUEVO, password: "corta" }, "password"],
      ["un rol que no existe", { ...NUEVO, rol: "ADMIN" }, "rol"],
      ["un email inválido", { ...NUEVO, email: "caro" }, "email"],
      ["sin nombre", { ...NUEVO, nombre: " " }, "nombre"],
      ["campos de más", { ...NUEVO, esAdmin: true }, ""],
    ])("con %s responde 400", async (_caso, body, campo) => {
      const res = await registro(body);

      expect(res.status).toBe(400);
      expect(res.body.detalles.join(" ")).toContain(campo);
    });
  });

  describe("GET /auth/me y el middleware autenticar", () => {
    it("con el token del login devuelve al usuario", async () => {
      const { body } = await login(LEO);

      const res = await me(`Bearer ${body.token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(body.usuario);
    });

    it.each([
      ["sin header", undefined, "Tenés que iniciar sesión (falta el header Authorization: Bearer <token>)"],
      ["sin la palabra Bearer", "un-token", "Tenés que iniciar sesión (falta el header Authorization: Bearer <token>)"],
      ["con un token que no es un JWT", "Bearer no-es-un-jwt", "El token no es válido"],
      [
        "con un token firmado con otro secreto",
        `Bearer ${jwt.sign({ sub: "3" }, "otro-secreto-de-mas-de-32-caracteres-xx")}`,
        "El token no es válido",
      ],
      ["con un token vencido", bearer("3", { expiresIn: -10 }), "La sesión venció: volvé a iniciar sesión"],
      ["con el token de un usuario que no existe", bearer("99"), "El usuario del token no existe"],
    ])("%s responde 401", async (_caso, authorization, error) => {
      const res = await me(authorization);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe(error);
    });

    it("el rol sale del usuario guardado, no del token: un token que dice ORGANIZADOR no alcanza para crear eventos", async () => {
      // Aunque alguien arme un payload con otro rol, si no tiene el secreto la firma no coincide;
      // y aun firmado, el middleware toma el rol del usuario guardado.
      const tokenTrucho = `Bearer ${jwt.sign({ sub: "3", rol: "ORGANIZADOR" }, process.env.JWT_SECRET)}`;

      const res = await request(app).post("/eventos").set("Authorization", tokenTrucho).send({});

      expect(res.status).toBe(403);
    });
  });

  it("de punta a punta: se ingresa, se usa el token y la autorización por rol responde 403", async () => {
    const { body } = await login(LEO);

    const misCompras = await request(app).get("/compras").set("Authorization", `Bearer ${body.token}`);
    const crearEvento = await request(app).post("/eventos").set("Authorization", `Bearer ${body.token}`).send({});

    expect(misCompras.status).toBe(200);
    expect(crearEvento.status).toBe(403);
  });
});
