import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { EventoService } from "../../src/services/EventoService.js";
import { Evento } from "../../src/domain/entities/Evento.js";
import { TipoEntrada } from "../../src/domain/entities/TipoEntrada.js";
import { Categoria } from "../../src/domain/entities/Categoria.js";
import { Usuario } from "../../src/domain/entities/Usuario.js";
import { RolUsuario } from "../../src/domain/enums/RolUsuario.js";
import {
  DatosInvalidosError,
  NoEncontradoError,
  ReglaDeNegocioError,
} from "../../src/domain/errors/ErroresDeDominio.js";

const AHORA = new Date("2026-11-23T12:00:00");
const dentroDe = (dias) => new Date(AHORA.getTime() + dias * 24 * 60 * 60 * 1000);

const musica = Object.assign(new Categoria({ nombre: "Música", descripcion: "x" }), { id: "1" });
const teatro = Object.assign(new Categoria({ nombre: "Teatro", descripcion: "x" }), { id: "2" });
const organizador = new Usuario({
  id: "1",
  nombre: "Ana",
  apellido: "Paz",
  email: "ana@demo.com",
  passwordHash: "secreto",
  rol: RolUsuario.ORGANIZADOR,
});

let siguienteId = 1;
const crearEvento = ({ nombre, descripcion = "x", categoria = musica, dias, precios }) =>
  new Evento({
    id: String(siguienteId++),
    nombre,
    descripcion,
    categoria,
    organizador,
    fecha: dentroDe(dias),
    tiposEntrada: precios.map((precio, i) => new TipoEntrada({ id: `t${i}`, nombre: `Tipo ${i}`, descripcion: "", precio, cupo: 10 })),
  });

const filtrosPorDefecto = { orden: "fecha", direccion: "asc" };
const nombres = (pagina) => pagina.resultados.map((evento) => evento.nombre);

describe("EventoService", () => {
  let repository;
  let categoriaService;
  let service;

  beforeEach(() => {
    siguienteId = 1;
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn((evento) => Promise.resolve(evento)),
      update: jest.fn((evento) => Promise.resolve(evento)),
    };
    categoriaService = { buscarCategoria: jest.fn() };
    service = new EventoService(repository, categoriaService);
  });

  describe("toDTO", () => {
    it("expone solo los datos públicos del organizador y agrega precioDesde", () => {
      const dto = service.toDTO(crearEvento({ nombre: "Recital", dias: 10, precios: [5000, 2000] }));

      expect(dto.organizador).toEqual({ id: "1", nombre: "Ana", apellido: "Paz" });
      expect(dto.categoria).toEqual({ id: "1", nombre: "Música" });
      expect(dto.precioDesde).toBe(2000);
      expect(typeof dto.fecha).toBe("string");
      expect(JSON.stringify(dto)).not.toContain("secreto");
    });
  });

  describe("buscar", () => {
    beforeEach(() => {
      repository.findAll.mockResolvedValue([
        crearEvento({ nombre: "Recital de rock", dias: 20, precios: [30000, 50000] }),
        crearEvento({ nombre: "Hamlet", descripcion: "Tragedia clásica", categoria: teatro, dias: 5, precios: [18000] }),
        crearEvento({ nombre: "Festival", dias: 60, precios: [9000, 90000] }),
        crearEvento({ nombre: "Acústico pasado", dias: -10, precios: [1000] }),
      ]);
    });

    it("devuelve solo los eventos próximos, ordenados por fecha y paginados", async () => {
      const pagina = await service.buscar(filtrosPorDefecto, AHORA);

      expect(nombres(pagina)).toEqual(["Hamlet", "Recital de rock", "Festival"]);
      expect(pagina).toMatchObject({ page: 1, limit: 10, total: 3, totalPages: 1 });
    });

    it("no incluye un evento que empieza justo ahora", async () => {
      repository.findAll.mockResolvedValue([crearEvento({ nombre: "Ahora", dias: 0, precios: [1] })]);
      expect((await service.buscar(filtrosPorDefecto, AHORA)).total).toBe(0);
    });

    it("filtra por categoría", async () => {
      const pagina = await service.buscar({ ...filtrosPorDefecto, categoriaId: "2" }, AHORA);
      expect(nombres(pagina)).toEqual(["Hamlet"]);
    });

    it.each([
      ["el nombre, sin importar mayúsculas", "HAMLET", ["Hamlet"]],
      ["la descripción", "tragedia", ["Hamlet"]],
      ["el nombre de la categoría, sin importar tildes", "musica", ["Recital de rock", "Festival"]],
      ["un texto que no aparece", "ópera", []],
    ])("busca por texto en %s", async (_caso, texto, esperados) => {
      const pagina = await service.buscar({ ...filtrosPorDefecto, texto }, AHORA);
      expect(nombres(pagina)).toEqual(esperados);
    });

    it("filtra por rango de precio: alcanza con que un tipo de entrada caiga en el rango", async () => {
      const pagina = await service.buscar({ ...filtrosPorDefecto, precioMin: 40000, precioMax: 60000 }, AHORA);
      expect(nombres(pagina)).toEqual(["Recital de rock"]);
    });

    it("con solo precioMax filtra desde 0", async () => {
      const pagina = await service.buscar({ ...filtrosPorDefecto, precioMax: 10000 }, AHORA);
      expect(nombres(pagina)).toEqual(["Festival"]);
    });

    it.each([
      ["fecha", "desc", ["Festival", "Recital de rock", "Hamlet"]],
      ["precio", "asc", ["Festival", "Hamlet", "Recital de rock"]],
      ["precio", "desc", ["Recital de rock", "Hamlet", "Festival"]],
    ])("ordena por %s %s (el precio es el más barato de cada evento)", async (orden, direccion, esperados) => {
      const pagina = await service.buscar({ orden, direccion }, AHORA);
      expect(nombres(pagina)).toEqual(esperados);
    });

    it("a igual precio desempata por fecha", async () => {
      repository.findAll.mockResolvedValue([
        crearEvento({ nombre: "Después", dias: 9, precios: [100] }),
        crearEvento({ nombre: "Antes", dias: 3, precios: [100] }),
      ]);
      const pagina = await service.buscar({ orden: "precio", direccion: "asc" }, AHORA);
      expect(nombres(pagina)).toEqual(["Antes", "Después"]);
    });

    it("respeta page y limit", async () => {
      const pagina = await service.buscar({ ...filtrosPorDefecto, page: 2, limit: 2 }, AHORA);
      expect(nombres(pagina)).toEqual(["Festival"]);
      expect(pagina.totalPages).toBe(2);
    });
  });

  describe("getById", () => {
    it("devuelve el evento aunque ya haya pasado", async () => {
      repository.findById.mockResolvedValue(crearEvento({ nombre: "Acústico pasado", dias: -10, precios: [1] }));
      expect((await service.getById("1")).nombre).toBe("Acústico pasado");
    });

    it("lanza NoEncontradoError si no existe", async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getById("99")).rejects.toThrow(new NoEncontradoError("No existe un evento con id 99"));
    });
  });

  describe("crear", () => {
    const datos = {
      nombre: "Nuevo recital",
      descripcion: "Presentación del disco",
      categoriaId: "1",
      fecha: dentroDe(30),
      multimedia: ["https://example.com/flyer.jpg"],
      tiposEntrada: [
        { nombre: "Campo", descripcion: "", precio: 20000, cupo: 100 },
        { nombre: "VIP", descripcion: "", precio: 60000, cupo: 10 },
      ],
    };

    beforeEach(() => {
      categoriaService.buscarCategoria.mockResolvedValue(musica);
    });

    it("crea el evento con el organizador recibido y devuelve su DTO", async () => {
      const dto = await service.crear(datos, organizador, AHORA);

      const guardado = repository.save.mock.calls[0][0];
      expect(guardado).toBeInstanceOf(Evento);
      expect(guardado.organizador).toBe(organizador);
      expect(guardado.categoria).toBe(musica);
      expect(guardado.tiposEntrada.every((tipo) => tipo instanceof TipoEntrada)).toBe(true);
      expect(dto).toMatchObject({ nombre: "Nuevo recital", precioDesde: 20000, organizador: { id: "1" } });
    });

    it("busca la categoría indicada", async () => {
      await service.crear(datos, organizador, AHORA);
      expect(categoriaService.buscarCategoria).toHaveBeenCalledWith("1");
    });

    it("no lo crea si la categoría no existe", async () => {
      categoriaService.buscarCategoria.mockRejectedValue(new NoEncontradoError("No existe una categoría con id 9"));

      await expect(service.crear({ ...datos, categoriaId: "9" }, organizador, AHORA)).rejects.toThrow(NoEncontradoError);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it.each([
      ["en el pasado", -1],
      ["justo ahora", 0],
    ])("no lo crea si la fecha es %s", async (_caso, dias) => {
      await expect(service.crear({ ...datos, fecha: dentroDe(dias) }, organizador, AHORA)).rejects.toThrow(
        new DatosInvalidosError("La fecha del evento debe ser futura"),
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it("primero verifica la categoría: con categoría inexistente y fecha pasada informa la categoría", async () => {
      categoriaService.buscarCategoria.mockRejectedValue(new NoEncontradoError("No existe una categoría con id 9"));

      await expect(
        service.crear({ ...datos, categoriaId: "9", fecha: dentroDe(-1) }, organizador, AHORA),
      ).rejects.toThrow(NoEncontradoError);
    });
  });

  describe("actualizar", () => {
    let evento;
    let campo;
    let vip;

    // Lo que manda la pantalla de edición: el evento completo, con los tipos existentes identificados por id
    const datosEditados = (cambios = {}) => ({
      nombre: "Recital (nueva fecha)",
      descripcion: "Reprogramado",
      categoriaId: "2",
      fecha: dentroDe(45),
      multimedia: [],
      tiposEntrada: [
        { id: "c1", nombre: "Campo", descripcion: "De pie", precio: 25000, cupo: 150 },
        { id: "v1", nombre: "VIP", descripcion: "", precio: 70000, cupo: 10 },
      ],
      ...cambios,
    });

    beforeEach(() => {
      campo = new TipoEntrada({ id: "c1", nombre: "Campo", descripcion: "", precio: 20000, cupo: 100 });
      vip = new TipoEntrada({ id: "v1", nombre: "VIP", descripcion: "", precio: 60000, cupo: 10 });
      evento = new Evento({
        id: "5",
        nombre: "Recital",
        descripcion: "Original",
        categoria: musica,
        organizador,
        fecha: dentroDe(20),
        tiposEntrada: [campo, vip],
      });
      repository.findById.mockResolvedValue(evento);
      categoriaService.buscarCategoria.mockResolvedValue(teatro);
    });

    it("aplica los cambios del evento y guarda", async () => {
      const dto = await service.actualizar("5", datosEditados(), AHORA);

      expect(repository.update).toHaveBeenCalledWith(evento);
      expect(dto).toMatchObject({ id: "5", nombre: "Recital (nueva fecha)", descripcion: "Reprogramado", categoria: { id: "2" } });
      expect(evento.fecha).toEqual(dentroDe(45));
    });

    it("modifica los tipos existentes conservando su id y su objeto", async () => {
      await service.actualizar("5", datosEditados(), AHORA);

      expect(evento.tiposEntrada[0]).toBe(campo);
      expect(campo).toMatchObject({ id: "c1", descripcion: "De pie", precio: 25000, cupo: 150 });
    });

    it("agrega los tipos sin id como tipos nuevos", async () => {
      const datos = datosEditados();
      datos.tiposEntrada.push({ nombre: "Platea", descripcion: "", precio: 40000, cupo: 50 });

      await service.actualizar("5", datos, AHORA);

      expect(evento.tiposEntrada).toHaveLength(3);
      expect(evento.tiposEntrada[2]).toBeInstanceOf(TipoEntrada);
      expect(evento.tiposEntrada[2]).toMatchObject({ id: null, nombre: "Platea" });
    });

    it("no deja quitar un tipo de entrada existente", async () => {
      const datos = datosEditados({ tiposEntrada: [{ id: "c1", nombre: "Campo", descripcion: "", precio: 1, cupo: 1 }] });

      await expect(service.actualizar("5", datos, AHORA)).rejects.toThrow(
        new ReglaDeNegocioError("No se pueden quitar tipos de entrada de un evento. Faltan: VIP (id v1)"),
      );
    });

    it("no acepta un tipo de entrada de otro evento", async () => {
      const datos = datosEditados();
      datos.tiposEntrada.push({ id: "otro", nombre: "Ajeno", descripcion: "", precio: 1, cupo: 1 });

      await expect(service.actualizar("5", datos, AHORA)).rejects.toThrow(
        new DatosInvalidosError("El tipo de entrada otro no pertenece a este evento"),
      );
    });

    it("no deja editar un evento que ya se realizó", async () => {
      evento.fecha = dentroDe(-1);

      await expect(service.actualizar("5", datosEditados(), AHORA)).rejects.toThrow(
        new ReglaDeNegocioError("No se puede editar un evento que ya se realizó"),
      );
    });

    it("la nueva fecha tiene que ser futura", async () => {
      await expect(service.actualizar("5", datosEditados({ fecha: dentroDe(-1) }), AHORA)).rejects.toThrow(
        new DatosInvalidosError("La fecha del evento debe ser futura"),
      );
    });

    it("propaga el 404 si la categoría no existe", async () => {
      categoriaService.buscarCategoria.mockRejectedValue(new NoEncontradoError("No existe una categoría con id 9"));
      await expect(service.actualizar("5", datosEditados({ categoriaId: "9" }), AHORA)).rejects.toThrow(NoEncontradoError);
    });

    it("lanza NoEncontradoError si el evento no existe", async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.actualizar("99", datosEditados(), AHORA)).rejects.toThrow(NoEncontradoError);
    });

    it.each([
      ["el evento ya se realizó", () => { evento.fecha = dentroDe(-1); }, {}],
      ["la categoría no existe", () => categoriaService.buscarCategoria.mockRejectedValue(new NoEncontradoError("x")), {}],
      ["la fecha nueva ya pasó", () => {}, { fecha: dentroDe(-1) }],
      ["se quita un tipo", () => {}, { tiposEntrada: [{ id: "c1", nombre: "Campo", descripcion: "", precio: 1, cupo: 1 }] }],
    ])("si falla porque %s, no modifica nada", async (_caso, preparar, cambios) => {
      preparar();
      const antes = JSON.stringify(evento);

      await expect(service.actualizar("5", datosEditados(cambios), AHORA)).rejects.toThrow();

      expect(JSON.stringify(evento)).toBe(antes);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
