import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MensajeService } from "../../src/services/MensajeService.js";
import { Compra } from "../../src/domain/entities/Compra.js";
import { Evento } from "../../src/domain/entities/Evento.js";
import { TipoEntrada } from "../../src/domain/entities/TipoEntrada.js";
import { Usuario } from "../../src/domain/entities/Usuario.js";
import { RolUsuario } from "../../src/domain/enums/RolUsuario.js";
import { NoEncontradoError } from "../../src/domain/errors/ErroresDeDominio.js";

const leo = new Usuario({ id: "3", nombre: "Leo", apellido: "Ruiz", email: "leo@demo.com", passwordHash: "secreto", rol: RolUsuario.COMPRADOR });
const ana = new Usuario({ id: "1", nombre: "Ana", apellido: "Paz", rol: RolUsuario.ORGANIZADOR });
const minuto = (n) => new Date(Date.UTC(2026, 10, 23, 10, n));

describe("MensajeService", () => {
  let compra;
  let compraService;
  let compraRepository;
  let notificador;
  let service;

  beforeEach(() => {
    const tipo = new TipoEntrada({ id: "1", nombre: "Campo", descripcion: "", precio: 1, cupo: 10 });
    const evento = new Evento({ id: "1", nombre: "Recital", descripcion: "x", fecha: new Date("2027-01-01"), organizador: ana, tiposEntrada: [tipo] });
    compra = new Compra({ id: "7", comprador: leo, evento, tipoEntrada: tipo, cantidad: 1 });
    // 5 mensajes, a los minutos 1 a 5
    [1, 2, 3, 4, 5].forEach((n) => {
      Object.assign(compra.agregarMensaje(n % 2 ? leo : ana, `mensaje ${n}`, minuto(n)), { id: String(n) });
    });

    compraService = { buscarCompra: jest.fn().mockResolvedValue(compra) };
    compraRepository = { update: jest.fn((c) => Promise.resolve(c)) };
    notificador = { notificarMensaje: jest.fn() };
    service = new MensajeService(compraService, compraRepository, notificador);
  });

  const textos = (resultado) => resultado.mensajes.map((m) => m.mensaje);

  describe("listar", () => {
    it("sin filtros devuelve los últimos `limit` en orden cronológico", async () => {
      const resultado = await service.listar("7", { limit: 3 });

      expect(textos(resultado)).toEqual(["mensaje 3", "mensaje 4", "mensaje 5"]);
      expect(resultado.hayAnteriores).toBe(true);
    });

    it("si entran todos, no hay anteriores", async () => {
      const resultado = await service.listar("7", {});
      expect(textos(resultado)).toHaveLength(5);
      expect(resultado.hayAnteriores).toBe(false);
    });

    it("con antes devuelve los últimos `limit` anteriores a esa fecha", async () => {
      const resultado = await service.listar("7", { limit: 2, antes: minuto(4) });

      expect(textos(resultado)).toEqual(["mensaje 2", "mensaje 3"]);
      expect(resultado.hayAnteriores).toBe(true);
    });

    it("con desde devuelve los posteriores a esa fecha (los nuevos)", async () => {
      const resultado = await service.listar("7", { desde: minuto(3) });
      expect(textos(resultado)).toEqual(["mensaje 4", "mensaje 5"]);
    });

    it("con desde y sin mensajes nuevos devuelve una lista vacía", async () => {
      const resultado = await service.listar("7", { desde: minuto(5) });
      expect(resultado).toEqual({ mensajes: [], hayAnteriores: false });
    });

    it("cada mensaje expone solo los datos públicos del autor, con su rol", async () => {
      const [primero] = (await service.listar("7", {})).mensajes;

      expect(primero).toEqual({
        id: "1",
        usuario: { id: "3", nombre: "Leo", apellido: "Ruiz", rol: "COMPRADOR" },
        mensaje: "mensaje 1",
        enviado: minuto(1).toISOString(),
      });
      expect(JSON.stringify(primero)).not.toContain("secreto");
    });

    it("propaga el 404 si la compra no existe", async () => {
      compraService.buscarCompra.mockRejectedValue(new NoEncontradoError("No existe una compra con id 9"));
      await expect(service.listar("9", {})).rejects.toThrow(NoEncontradoError);
    });
  });

  describe("enviar", () => {
    it("agrega el mensaje a la compra, la guarda y devuelve el DTO", async () => {
      const dto = await service.enviar("7", ana, "Las puertas abren a las 19", minuto(10));

      expect(compra.mensajes.at(-1)).toMatchObject({ usuario: ana, mensaje: "Las puertas abren a las 19" });
      expect(compraRepository.update).toHaveBeenCalledWith(compra);
      expect(dto).toMatchObject({ usuario: { id: "1", rol: "ORGANIZADOR" }, mensaje: "Las puertas abren a las 19" });
    });

    it("avisa en tiempo real a quienes tienen abierto el chat de esa compra", async () => {
      const dto = await service.enviar("7", ana, "Hola", minuto(10));
      expect(notificador.notificarMensaje).toHaveBeenCalledWith("7", dto);
    });

    it("sin notificador (por ejemplo, en tests) funciona igual", async () => {
      const sinTiempoReal = new MensajeService(compraService, compraRepository);
      await expect(sinTiempoReal.enviar("7", ana, "Hola")).resolves.toMatchObject({ mensaje: "Hola" });
    });
  });
});
