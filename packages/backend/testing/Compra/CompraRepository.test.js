import { beforeEach, describe, expect, it } from "@jest/globals";
import { CompraRepository } from "../../src/repositories/CompraRepository.js";
import { Compra } from "../../src/domain/entities/Compra.js";
import { Evento } from "../../src/domain/entities/Evento.js";
import { TipoEntrada } from "../../src/domain/entities/TipoEntrada.js";
import { Usuario } from "../../src/domain/entities/Usuario.js";
import { EstadoCompra } from "../../src/domain/enums/EstadoCompra.js";

const leo = new Usuario({ id: "3", nombre: "Leo", apellido: "Ruiz" });
const sofia = new Usuario({ id: "4", nombre: "Sofía", apellido: "Gómez" });
const campo = new TipoEntrada({ id: "1", nombre: "Campo", descripcion: "", precio: 100, cupo: 50 });
const vip = new TipoEntrada({ id: "2", nombre: "VIP", descripcion: "", precio: 500, cupo: 5 });
const recital = new Evento({ id: "1", nombre: "Recital", descripcion: "x", fecha: new Date("2027-01-10"), tiposEntrada: [campo, vip] });
const obra = new Evento({ id: "2", nombre: "Obra", descripcion: "x", fecha: new Date("2027-01-10"), tiposEntrada: [] });

const nueva = (comprador, evento, tipoEntrada, cantidad) => new Compra({ comprador, evento, tipoEntrada, cantidad });

describe("CompraRepository (en memoria)", () => {
  let repository;

  beforeEach(() => {
    CompraRepository.limpiar();
    repository = new CompraRepository();
  });

  it("asigna ids incrementales y busca por id", async () => {
    const compra = await repository.save(nueva(leo, recital, campo, 2));

    expect(compra.id).toBe("1");
    expect(await repository.findById("1")).toBe(compra);
    expect(await repository.findById("9")).toBeNull();
  });

  it("filtra por comprador y por evento", async () => {
    await repository.save(nueva(leo, recital, campo, 1));
    await repository.save(nueva(sofia, recital, vip, 1));
    await repository.save(nueva(leo, obra, campo, 1));

    expect((await repository.findByComprador("3")).map((c) => c.id)).toEqual(["1", "3"]);
    expect((await repository.findByEvento("1")).map((c) => c.id)).toEqual(["1", "2"]);
  });

  it("entradasOcupadas suma las cantidades del tipo, salvo las compras que liberan cupo", async () => {
    await repository.save(nueva(leo, recital, campo, 2));
    await repository.save(nueva(sofia, recital, campo, 3));
    const cancelada = nueva(leo, recital, campo, 10);
    cancelada.actualizarEstado(EstadoCompra.CANCELADA, leo, new Date("2026-11-23"));
    await repository.save(cancelada);
    await repository.save(nueva(leo, recital, vip, 4));

    expect(await repository.entradasOcupadas("1")).toBe(5);
    expect(await repository.entradasOcupadas("2")).toBe(4);
    expect(await repository.entradasOcupadas("99")).toBe(0);
  });

  it("update reemplaza la compra guardada", async () => {
    const compra = await repository.save(nueva(leo, recital, campo, 2));
    expect(await repository.update(compra)).toBe(compra);
    expect(await repository.update(Object.assign(nueva(leo, recital, campo, 1), { id: "9" }))).toBeNull();
  });

  it("asigna id a los mensajes nuevos al guardar y al actualizar, únicos entre compras", async () => {
    const compra = nueva(leo, recital, campo, 1);
    compra.agregarMensaje(leo, "Hola");
    await repository.save(compra);
    compra.agregarMensaje(leo, "¿Hay alguien?");
    await repository.update(compra);
    const otra = nueva(sofia, recital, vip, 1);
    otra.agregarMensaje(sofia, "Consulta");
    await repository.save(otra);

    expect(compra.mensajes.map((m) => m.id)).toEqual(["1", "2"]);
    expect(otra.mensajes[0].id).toBe("3");
  });

  it("limpiar vacía la lista y reinicia los ids", async () => {
    await repository.save(nueva(leo, recital, campo, 2));
    CompraRepository.limpiar();

    expect(await repository.findAll()).toEqual([]);
    expect((await repository.save(nueva(leo, recital, campo, 1))).id).toBe("1");
  });
});
