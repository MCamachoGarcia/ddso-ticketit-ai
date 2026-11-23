import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { errorHandler } from "../../src/middlewares/errorHandler.js";
import {
  DatosInvalidosError,
  ErrorDeDominio,
  NoEncontradoError,
  ReglaDeNegocioError,
  SinCupoError,
  TransicionDeEstadoInvalidaError,
} from "../../src/domain/errors/ErroresDeDominio.js";
import { NoAutenticadoError, SinPermisoError } from "../../src/errors/ErroresDeAutorizacion.js";

const crearRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("errorHandler", () => {
  let res;

  beforeEach(() => {
    res = crearRes();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ["DatosInvalidosError", new DatosInvalidosError("Datos inválidos"), 400],
    ["NoAutenticadoError", new NoAutenticadoError(), 401],
    ["SinPermisoError", new SinPermisoError(), 403],
    ["NoEncontradoError", new NoEncontradoError("No existe el evento"), 404],
    ["ReglaDeNegocioError", new ReglaDeNegocioError("No se puede"), 409],
    ["TransicionDeEstadoInvalidaError (hereda de ReglaDeNegocio)", new TransicionDeEstadoInvalidaError("UTILIZADA", "CANCELADA"), 409],
    ["SinCupoError (hereda de ReglaDeNegocio)", new SinCupoError({ nombre: "VIP" }, 3, 1), 409],
  ])("traduce %s a %i con su mensaje y timestamp", (_nombre, error, codigo) => {
    errorHandler(error, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(codigo);
    expect(res.json).toHaveBeenCalledWith({ error: error.message, timestamp: error.timestamp });
  });

  it("incluye los detalles cuando el error los tiene", () => {
    const error = new DatosInvalidosError("Datos inválidos", ["cantidad: debe ser mayor a 0"]);
    errorHandler(error, {}, res, () => {});

    expect(res.json).toHaveBeenCalledWith({
      error: "Datos inválidos",
      detalles: ["cantidad: debe ser mayor a 0"],
      timestamp: error.timestamp,
    });
  });

  it("responde 400 cuando el body no es un JSON válido", () => {
    const error = Object.assign(new SyntaxError("Unexpected token"), { type: "entity.parse.failed" });
    errorHandler(error, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toBe("El cuerpo del pedido no es un JSON válido");
  });

  it.each([
    ["un error inesperado de JavaScript", new TypeError("Cannot read properties of undefined")],
    ["un ErrorDeDominio sin una categoría con código", new ErrorDeDominio("Algo del dominio")],
  ])("ante %s responde 500 sin exponer el mensaje interno", (_caso, error) => {
    errorHandler(error, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error).toBe("Error interno del servidor");
    expect(console.error).toHaveBeenCalledWith(error);
  });

  it("los errores de dominio no tienen código HTTP", () => {
    expect(new ReglaDeNegocioError("x")).not.toHaveProperty("status");
  });
});
