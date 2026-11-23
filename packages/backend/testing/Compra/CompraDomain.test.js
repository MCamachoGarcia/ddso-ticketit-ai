import { beforeEach, describe, expect, it } from "@jest/globals";
import { Compra } from "../../src/domain/entities/Compra.js";
import { Evento } from "../../src/domain/entities/Evento.js";
import { TipoEntrada } from "../../src/domain/entities/TipoEntrada.js";
import { Usuario } from "../../src/domain/entities/Usuario.js";
import { EstadoCompra } from "../../src/domain/enums/EstadoCompra.js";
import { RolUsuario } from "../../src/domain/enums/RolUsuario.js";
import {
  ReglaDeNegocioError,
  TransicionDeEstadoInvalidaError,
} from "../../src/domain/errors/ErroresDeDominio.js";

const HOY = new Date("2026-11-23T12:00:00");
const FECHA_EVENTO = new Date("2026-12-20T21:00:00");
const DESPUES_DEL_EVENTO = new Date("2026-12-21T10:00:00");

describe("Compra", () => {
  let comprador;
  let organizador;
  let vip;
  let evento;
  let compra;

  beforeEach(() => {
    comprador = new Usuario({ id: "u-1", nombre: "Leo", apellido: "Ruiz", rol: RolUsuario.COMPRADOR });
    organizador = new Usuario({ id: "u-2", nombre: "Ana", apellido: "Paz", rol: RolUsuario.ORGANIZADOR });
    vip = new TipoEntrada({ nombre: "VIP", descripcion: "Frente al escenario", precio: 50000, cupo: 10 });
    evento = new Evento({
      nombre: "Recital",
      descripcion: "Banda en vivo",
      fecha: FECHA_EVENTO,
      tiposEntrada: [vip],
      organizador,
    });
    compra = new Compra({ comprador, evento, tipoEntrada: vip, cantidad: 2 });
  });

  // Lleva la compra por varios estados en fechas válidas: la entrada se usa al empezar el evento, el resto antes
  const llevarA = (...estados) => {
    estados.forEach((estado) =>
      compra.actualizarEstado(estado, comprador, estado === EstadoCompra.UTILIZADA ? FECHA_EVENTO : HOY),
    );
  };

  describe("al crearse", () => {
    it("calcula el total como precio por cantidad", () => {
      expect(compra.total).toBe(100000);
    });

    it("mantiene el total aunque después cambie el precio del tipo de entrada", () => {
      vip.precio = 99999;
      expect(compra.total).toBe(100000);
    });

    it("arranca pendiente de pago, sin mensajes", () => {
      expect(compra.estado).toBe(EstadoCompra.PENDIENTE_DE_PAGO);
      expect(compra.mensajes).toEqual([]);
    });

    it("registra el estado inicial en el historial, hecho por el comprador", () => {
      expect(compra.cambiosDeEstado).toHaveLength(1);
      expect(compra.cambiosDeEstado[0].estado).toBe(EstadoCompra.PENDIENTE_DE_PAGO);
      expect(compra.cambiosDeEstado[0].quien).toBe(comprador);
      expect(compra.cambiosDeEstado[0].fechaHora).toBeInstanceOf(Date);
    });
  });

  describe("transiciones permitidas", () => {
    it.each([
      ["PENDIENTE_DE_PAGO → CONFIRMADA", [EstadoCompra.CONFIRMADA]],
      ["PENDIENTE_DE_PAGO → CANCELADA", [EstadoCompra.CANCELADA]],
      ["CONFIRMADA → UTILIZADA", [EstadoCompra.CONFIRMADA, EstadoCompra.UTILIZADA]],
      ["CONFIRMADA → CANCELADA", [EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA]],
      [
        "CANCELADA → REEMBOLSADA (habiendo pagado)",
        [EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA, EstadoCompra.REEMBOLSADA],
      ],
    ])("%s", (_nombre, estados) => {
      llevarA(...estados);
      expect(compra.estado).toBe(estados.at(-1));
    });
  });

  describe("transiciones no permitidas", () => {
    it.each([
      ["PENDIENTE_DE_PAGO → UTILIZADA", [], EstadoCompra.UTILIZADA],
      ["PENDIENTE_DE_PAGO → REEMBOLSADA", [], EstadoCompra.REEMBOLSADA],
      ["CONFIRMADA → REEMBOLSADA (sin cancelar antes)", [EstadoCompra.CONFIRMADA], EstadoCompra.REEMBOLSADA],
      ["CONFIRMADA → PENDIENTE_DE_PAGO", [EstadoCompra.CONFIRMADA], EstadoCompra.PENDIENTE_DE_PAGO],
      ["CANCELADA → CONFIRMADA", [EstadoCompra.CANCELADA], EstadoCompra.CONFIRMADA],
      [
        "UTILIZADA → CANCELADA",
        [EstadoCompra.CONFIRMADA, EstadoCompra.UTILIZADA],
        EstadoCompra.CANCELADA,
      ],
      [
        "REEMBOLSADA → cualquier estado",
        [EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA, EstadoCompra.REEMBOLSADA],
        EstadoCompra.CONFIRMADA,
      ],
      ["al mismo estado", [EstadoCompra.CONFIRMADA], EstadoCompra.CONFIRMADA],
    ])("%s", (_nombre, estadosPrevios, estadoInvalido) => {
      llevarA(...estadosPrevios);
      const estadoAntes = compra.estado;
      const historialAntes = compra.cambiosDeEstado.length;

      expect(() => compra.actualizarEstado(estadoInvalido, comprador, HOY)).toThrow(
        TransicionDeEstadoInvalidaError,
      );
      expect(compra.estado).toBe(estadoAntes);
      expect(compra.cambiosDeEstado).toHaveLength(historialAntes);
    });

    it("el error indica desde qué estado y hacia cuál se intentó pasar", () => {
      llevarA(EstadoCompra.CONFIRMADA, EstadoCompra.UTILIZADA);
      expect(() => compra.actualizarEstado(EstadoCompra.CANCELADA, comprador, HOY)).toThrow(
        "No se puede pasar una compra de UTILIZADA a CANCELADA",
      );
    });

    it("rechaza un estado que no existe", () => {
      expect(() => compra.actualizarEstado("PERDIDA", comprador, HOY)).toThrow(
        TransicionDeEstadoInvalidaError,
      );
    });
  });

  describe("reembolso", () => {
    it("no permite reembolsar una compra cancelada que nunca se pagó", () => {
      llevarA(EstadoCompra.CANCELADA);

      expect(() => compra.actualizarEstado(EstadoCompra.REEMBOLSADA, organizador, HOY)).toThrow(
        new ReglaDeNegocioError("No se puede reembolsar una compra que nunca se pagó"),
      );
      expect(compra.estado).toBe(EstadoCompra.CANCELADA);
    });

    it("el error de reembolso no es un error de transición", () => {
      llevarA(EstadoCompra.CANCELADA);
      try {
        compra.actualizarEstado(EstadoCompra.REEMBOLSADA, organizador, HOY);
      } catch (error) {
        expect(error).toBeInstanceOf(ReglaDeNegocioError);
        expect(error).not.toBeInstanceOf(TransicionDeEstadoInvalidaError);
      }
      expect.assertions(2);
    });
  });

  describe("pago según la fecha del evento", () => {
    it("permite pagar antes del evento", () => {
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador, HOY);
      expect(compra.estado).toBe(EstadoCompra.CONFIRMADA);
    });

    it.each([
      ["justo cuando empieza", FECHA_EVENTO],
      ["después del evento", DESPUES_DEL_EVENTO],
    ])("no permite pagar %s", (_caso, fecha) => {
      expect(() => compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador, fecha)).toThrow(
        new ReglaDeNegocioError("No se puede confirmar el pago de una compra de un evento que ya se realizó"),
      );
      expect(compra.estado).toBe(EstadoCompra.PENDIENTE_DE_PAGO);
      expect(compra.cambiosDeEstado).toHaveLength(1);
    });
  });

  describe("uso de la entrada según la fecha del evento", () => {
    beforeEach(() => {
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador, HOY);
    });

    it("no permite usarla antes de que empiece el evento, ni un minuto antes", () => {
      const unMinutoAntes = new Date(FECHA_EVENTO.getTime() - 60 * 1000);
      expect(() => compra.actualizarEstado(EstadoCompra.UTILIZADA, organizador, unMinutoAntes)).toThrow(
        new ReglaDeNegocioError("No se puede usar una entrada antes de que empiece el evento"),
      );
      expect(compra.estado).toBe(EstadoCompra.CONFIRMADA);
    });

    it.each([
      ["justo cuando empieza", FECHA_EVENTO],
      ["después de que empezó", DESPUES_DEL_EVENTO],
    ])("permite usarla %s", (_caso, fecha) => {
      compra.actualizarEstado(EstadoCompra.UTILIZADA, organizador, fecha);
      expect(compra.estado).toBe(EstadoCompra.UTILIZADA);
      expect(compra.fechaDeEstado(EstadoCompra.UTILIZADA)).toBe(fecha);
    });
  });

  describe("cancelación según la fecha del evento", () => {
    it("permite cancelar antes del evento", () => {
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador, HOY);
      compra.actualizarEstado(EstadoCompra.CANCELADA, comprador, HOY);
      expect(compra.estado).toBe(EstadoCompra.CANCELADA);
    });

    it("no permite cancelar una compra confirmada después del evento", () => {
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador, HOY);
      expect(() =>
        compra.actualizarEstado(EstadoCompra.CANCELADA, comprador, DESPUES_DEL_EVENTO),
      ).toThrow("No se puede cancelar una compra de un evento que ya se realizó");
      expect(compra.estado).toBe(EstadoCompra.CONFIRMADA);
    });

    it("no permite cancelar en el mismo momento en que empieza el evento", () => {
      expect(() => compra.actualizarEstado(EstadoCompra.CANCELADA, comprador, FECHA_EVENTO)).toThrow(
        ReglaDeNegocioError,
      );
    });

    it("sí permite reembolsar después del evento una compra cancelada a tiempo", () => {
      llevarA(EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA);
      compra.actualizarEstado(EstadoCompra.REEMBOLSADA, organizador, DESPUES_DEL_EVENTO);
      expect(compra.estado).toBe(EstadoCompra.REEMBOLSADA);
    });
  });

  describe("historial", () => {
    it("registra cada cambio con su estado, quién lo hizo y cuándo", () => {
      const pago = new Date("2026-11-24T10:00:00");
      const cancelacion = new Date("2026-11-30T18:00:00");
      const reembolso = new Date("2026-12-02T09:00:00");

      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador, pago);
      compra.actualizarEstado(EstadoCompra.CANCELADA, comprador, cancelacion);
      compra.actualizarEstado(EstadoCompra.REEMBOLSADA, organizador, reembolso);

      expect(compra.cambiosDeEstado.map(({ estado, quien, fechaHora }) => [estado, quien, fechaHora])).toEqual([
        [EstadoCompra.PENDIENTE_DE_PAGO, comprador, compra.cambiosDeEstado[0].fechaHora],
        [EstadoCompra.CONFIRMADA, comprador, pago],
        [EstadoCompra.CANCELADA, comprador, cancelacion],
        [EstadoCompra.REEMBOLSADA, organizador, reembolso],
      ]);
    });

    it("fuePagada es falso mientras no pase por CONFIRMADA", () => {
      expect(compra.fuePagada()).toBe(false);
      llevarA(EstadoCompra.CANCELADA);
      expect(compra.fuePagada()).toBe(false);
    });

    it("fuePagada sigue siendo verdadero aunque después se cancele", () => {
      llevarA(EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA);
      expect(compra.fuePagada()).toBe(true);
    });

    it("fechaDeEstado devuelve cuándo llegó a un estado, o null si nunca pasó por él", () => {
      const pago = new Date("2026-11-24T10:00:00");
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, comprador, pago);

      expect(compra.fechaDeEstado(EstadoCompra.CONFIRMADA)).toBe(pago);
      expect(compra.fechaDeEstado(EstadoCompra.UTILIZADA)).toBeNull();
    });

    it("creadaEl fija la fecha del primer registro del historial", () => {
      const creadaEl = new Date("2026-11-01T10:00:00");
      const otra = new Compra({ comprador, evento, tipoEntrada: vip, cantidad: 1, creadaEl });
      expect(otra.fechaDeEstado(EstadoCompra.PENDIENTE_DE_PAGO)).toBe(creadaEl);
    });
  });

  describe("ocupaCupo", () => {
    it.each([
      ["PENDIENTE_DE_PAGO", [], true],
      ["CONFIRMADA", [EstadoCompra.CONFIRMADA], true],
      ["UTILIZADA", [EstadoCompra.CONFIRMADA, EstadoCompra.UTILIZADA], true],
      ["CANCELADA", [EstadoCompra.CANCELADA], false],
      ["REEMBOLSADA", [EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA, EstadoCompra.REEMBOLSADA], false],
    ])("en %s devuelve %s", (_estado, estados, esperado) => {
      llevarA(...estados);
      expect(compra.ocupaCupo()).toBe(esperado);
    });
  });

  describe("diasParaElEvento", () => {
    // El evento es el 2026-12-20 a las 21 hs
    it.each([
      ["27 días antes", "2026-11-23T12:00:00", 27],
      ["el día anterior a la noche (cuenta días de calendario)", "2026-12-19T23:30:00", 1],
      ["el mismo día, antes de que empiece", "2026-12-20T10:00:00", 0],
    ])("confirmada, %s → %i", (_caso, ahora, esperado) => {
      llevarA(EstadoCompra.CONFIRMADA);
      expect(compra.diasParaElEvento(new Date(ahora))).toBe(esperado);
    });

    it("es null si la compra no está confirmada", () => {
      expect(compra.diasParaElEvento(HOY)).toBeNull();
      llevarA(EstadoCompra.CANCELADA);
      expect(compra.diasParaElEvento(HOY)).toBeNull();
    });

    it("es null si el evento ya empezó (el comprador no asistió)", () => {
      llevarA(EstadoCompra.CONFIRMADA);
      expect(compra.diasParaElEvento(DESPUES_DEL_EVENTO)).toBeNull();
    });
  });
});
