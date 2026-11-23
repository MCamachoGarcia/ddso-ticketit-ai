import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { CompraService } from "../../src/services/CompraService.js";
import { Compra } from "../../src/domain/entities/Compra.js";
import { Evento } from "../../src/domain/entities/Evento.js";
import { TipoEntrada } from "../../src/domain/entities/TipoEntrada.js";
import { Usuario } from "../../src/domain/entities/Usuario.js";
import { EstadoCompra } from "../../src/domain/enums/EstadoCompra.js";
import { RolUsuario } from "../../src/domain/enums/RolUsuario.js";
import {
  DatosInvalidosError,
  NoEncontradoError,
  ReglaDeNegocioError,
  SinCupoError,
  TransicionDeEstadoInvalidaError,
} from "../../src/domain/errors/ErroresDeDominio.js";

const AHORA = new Date("2026-11-23T12:00:00");
const dentroDe = (dias) => new Date(AHORA.getTime() + dias * 24 * 60 * 60 * 1000);

const leo = new Usuario({ id: "3", nombre: "Leo", apellido: "Ruiz", email: "leo@demo.com", passwordHash: "secreto", rol: RolUsuario.COMPRADOR });
const ana = new Usuario({ id: "1", nombre: "Ana", apellido: "Paz", rol: RolUsuario.ORGANIZADOR });

describe("CompraService", () => {
  let repository;
  let eventoService;
  let service;
  let campo;
  let vip;
  let evento;

  beforeEach(() => {
    campo = new TipoEntrada({ id: "1", nombre: "Campo", descripcion: "", precio: 20000, cupo: 10 });
    vip = new TipoEntrada({ id: "2", nombre: "VIP", descripcion: "", precio: 60000, cupo: 2 });
    evento = new Evento({ id: "1", nombre: "Recital", descripcion: "x", fecha: dentroDe(20), organizador: ana, tiposEntrada: [campo, vip] });

    repository = {
      findById: jest.fn(),
      findByComprador: jest.fn(),
      findByEvento: jest.fn(),
      entradasOcupadas: jest.fn().mockResolvedValue(0),
      save: jest.fn((compra) => Promise.resolve(Object.assign(compra, { id: "1" }))),
      update: jest.fn((compra) => Promise.resolve(compra)),
    };
    eventoService = { buscarEvento: jest.fn().mockResolvedValue(evento) };
    service = new CompraService(repository, eventoService);
  });

  const compraDe = (tipo, cantidad, creadaEl = dentroDe(-1)) =>
    new Compra({ id: "1", comprador: leo, evento, tipoEntrada: tipo, cantidad, creadaEl });

  describe("toDTO", () => {
    it("expone el precio pagado, el historial y solo los datos públicos de los usuarios", () => {
      const compra = compraDe(campo, 2);
      compra.actualizarEstado(EstadoCompra.CONFIRMADA, ana, AHORA);
      campo.precio = 99999; // el precio cambia después: la compra conserva el que pagó

      const dto = service.toDTO(compra, AHORA);

      expect(dto).toMatchObject({ cantidad: 2, precioUnitario: 20000, total: 40000, estado: "CONFIRMADA", diasParaElEvento: 20 });
      expect(dto.comprador).toEqual({ id: "3", nombre: "Leo", apellido: "Ruiz" });
      expect(dto.historial.map((cambio) => [cambio.estado, cambio.quien.id])).toEqual([
        ["PENDIENTE_DE_PAGO", "3"],
        ["CONFIRMADA", "1"],
      ]);
      expect(JSON.stringify(dto)).not.toContain("secreto");
    });
  });

  describe("comprar", () => {
    const datos = { eventoId: "1", tipoEntradaId: "1", cantidad: 3 };

    it("crea la compra pendiente de pago, con el comprador y el total", async () => {
      const dto = await service.comprar(datos, leo, AHORA);

      const guardada = repository.save.mock.calls[0][0];
      expect(guardada).toBeInstanceOf(Compra);
      expect(guardada.comprador).toBe(leo);
      expect(guardada.tipoEntrada).toBe(campo);
      expect(guardada.fechaDeEstado(EstadoCompra.PENDIENTE_DE_PAGO)).toBe(AHORA);
      expect(dto).toMatchObject({ estado: "PENDIENTE_DE_PAGO", cantidad: 3, total: 60000, diasParaElEvento: null });
    });

    it("consulta las entradas ocupadas del tipo elegido", async () => {
      await service.comprar(datos, leo, AHORA);
      expect(repository.entradasOcupadas).toHaveBeenCalledWith("1");
    });

    it("permite comprar justo las que quedan", async () => {
      repository.entradasOcupadas.mockResolvedValue(7);
      await expect(service.comprar(datos, leo, AHORA)).resolves.toMatchObject({ cantidad: 3 });
    });

    it("rechaza si no alcanza el cupo disponible", async () => {
      repository.entradasOcupadas.mockResolvedValue(8);

      await expect(service.comprar(datos, leo, AHORA)).rejects.toThrow(
        new SinCupoError(campo, 3, 2),
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("rechaza un tipo de entrada que no es del evento", async () => {
      await expect(service.comprar({ ...datos, tipoEntradaId: "99" }, leo, AHORA)).rejects.toThrow(
        new DatosInvalidosError("El tipo de entrada 99 no pertenece al evento 1"),
      );
    });

    it("rechaza si el evento ya se realizó", async () => {
      evento.fecha = dentroDe(-1);
      await expect(service.comprar(datos, leo, AHORA)).rejects.toThrow(
        new ReglaDeNegocioError("No se pueden comprar entradas de un evento que ya se realizó"),
      );
    });

    it("propaga el 404 si el evento no existe", async () => {
      eventoService.buscarEvento.mockRejectedValue(new NoEncontradoError("No existe un evento con id 9"));
      await expect(service.comprar({ ...datos, eventoId: "9" }, leo, AHORA)).rejects.toThrow(NoEncontradoError);
    });
  });

  describe("misCompras", () => {
    beforeEach(() => {
      const vieja = compraDe(campo, 1, dentroDe(-10));
      const nueva = Object.assign(compraDe(vip, 1, dentroDe(-1)), { id: "2" });
      const cancelada = Object.assign(compraDe(campo, 1, dentroDe(-5)), { id: "3" });
      cancelada.actualizarEstado(EstadoCompra.CANCELADA, leo, dentroDe(-4));
      repository.findByComprador.mockResolvedValue([vieja, nueva, cancelada]);
    });

    it("busca las del comprador y las devuelve de la más reciente a la más vieja, paginadas", async () => {
      const pagina = await service.misCompras(leo, {}, AHORA);

      expect(repository.findByComprador).toHaveBeenCalledWith("3");
      expect(pagina.resultados.map((compra) => compra.id)).toEqual(["2", "3", "1"]);
      expect(pagina).toMatchObject({ page: 1, limit: 10, total: 3 });
    });

    it("filtra por estado", async () => {
      const pagina = await service.misCompras(leo, { estado: "CANCELADA" }, AHORA);
      expect(pagina.resultados.map((compra) => compra.id)).toEqual(["3"]);
    });
  });

  describe("cambiarEstado", () => {
    it("aplica la transición con quien la hace y guarda", async () => {
      const compra = compraDe(campo, 1);
      repository.findById.mockResolvedValue(compra);

      const dto = await service.cambiarEstado("1", EstadoCompra.CONFIRMADA, ana, AHORA);

      expect(dto.estado).toBe("CONFIRMADA");
      expect(compra.cambiosDeEstado.at(-1).quien).toBe(ana);
      expect(repository.update).toHaveBeenCalledWith(compra);
    });

    it("propaga los errores del dominio sin guardar", async () => {
      repository.findById.mockResolvedValue(compraDe(campo, 1));

      await expect(service.cambiarEstado("1", EstadoCompra.UTILIZADA, ana, AHORA)).rejects.toThrow(
        TransicionDeEstadoInvalidaError,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it("lanza NoEncontradoError si la compra no existe", async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.cambiarEstado("9", EstadoCompra.CONFIRMADA, ana, AHORA)).rejects.toThrow(
        new NoEncontradoError("No existe una compra con id 9"),
      );
    });
  });

  describe("comprasDelEvento", () => {
    it("devuelve la disponibilidad de cada tipo y las compras paginadas", async () => {
      repository.findByEvento.mockResolvedValue([compraDe(campo, 3)]);
      repository.entradasOcupadas.mockImplementation((tipoId) => Promise.resolve(tipoId === "1" ? 3 : 2));

      const resultado = await service.comprasDelEvento("1", {}, AHORA);

      expect(resultado.evento).toEqual({ id: "1", nombre: "Recital" });
      expect(resultado.disponibilidad).toEqual([
        { tipoEntrada: { id: "1", nombre: "Campo" }, cupo: 10, ocupadas: 3, disponibles: 7 },
        { tipoEntrada: { id: "2", nombre: "VIP" }, cupo: 2, ocupadas: 2, disponibles: 0 },
      ]);
      expect(resultado.compras).toMatchObject({ total: 1, page: 1 });
    });
  });
});
