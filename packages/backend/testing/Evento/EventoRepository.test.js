import { beforeEach, describe, expect, it } from "@jest/globals";
import { EventoRepository } from "../../src/repositories/EventoRepository.js";
import { Evento } from "../../src/domain/entities/Evento.js";
import { TipoEntrada } from "../../src/domain/entities/TipoEntrada.js";

const crearEvento = (nombre, nombresTipos) =>
  new Evento({
    nombre,
    descripcion: "x",
    fecha: new Date("2027-01-10"),
    tiposEntrada: nombresTipos.map((tipo) => new TipoEntrada({ nombre: tipo, descripcion: "", precio: 1, cupo: 1 })),
  });

describe("EventoRepository (en memoria)", () => {
  let repository;

  beforeEach(() => {
    EventoRepository.limpiar();
    repository = new EventoRepository();
  });

  it("asigna id al evento y a cada uno de sus tipos de entrada", async () => {
    const evento = await repository.save(crearEvento("Recital", ["Campo", "Platea"]));

    expect(evento.id).toBe("1");
    expect(evento.tiposEntrada.map((tipo) => tipo.id)).toEqual(["1", "2"]);
  });

  it("los ids de tipos de entrada no se repiten entre eventos", async () => {
    await repository.save(crearEvento("Recital", ["Campo", "Platea"]));
    const obra = await repository.save(crearEvento("Obra", ["Platea"]));

    expect(obra.id).toBe("2");
    expect(obra.tiposEntrada[0].id).toBe("3");
  });

  it("busca por id", async () => {
    const evento = await repository.save(crearEvento("Recital", ["Campo"]));

    expect(await repository.findById("1")).toBe(evento);
    expect(await repository.findById("99")).toBeNull();
  });

  it("update reemplaza el evento y da id solo a los tipos de entrada nuevos", async () => {
    const evento = await repository.save(crearEvento("Recital", ["Campo", "Platea"]));
    const editado = Object.assign(crearEvento("Recital editado", ["Campo", "Platea", "VIP"]), { id: evento.id });
    editado.tiposEntrada[0].id = "1";
    editado.tiposEntrada[1].id = "2";

    const actualizado = await repository.update(editado);

    expect(actualizado.tiposEntrada.map((tipo) => tipo.id)).toEqual(["1", "2", "3"]);
    expect((await repository.findById(evento.id)).nombre).toBe("Recital editado");
    expect(await repository.findAll()).toHaveLength(1);
  });

  it("update devuelve null si el evento no existe", async () => {
    const fantasma = Object.assign(crearEvento("Fantasma", ["General"]), { id: "99" });
    expect(await repository.update(fantasma)).toBeNull();
  });

  it("findAll devuelve una copia de la lista", async () => {
    await repository.save(crearEvento("Recital", ["Campo"]));
    (await repository.findAll()).pop();

    expect(await repository.findAll()).toHaveLength(1);
  });

  it("limpiar vacía la lista y reinicia ambos contadores de ids", async () => {
    await repository.save(crearEvento("Recital", ["Campo", "Platea"]));
    EventoRepository.limpiar();
    const nuevo = await repository.save(crearEvento("Obra", ["Platea"]));

    expect(await repository.findAll()).toHaveLength(1);
    expect(nuevo.id).toBe("1");
    expect(nuevo.tiposEntrada[0].id).toBe("1");
  });
});
