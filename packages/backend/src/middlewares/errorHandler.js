import {
  DatosInvalidosError,
  NoEncontradoError,
  ReglaDeNegocioError,
} from "../domain/errors/ErroresDeDominio.js";
import { NoAutenticadoError, SinPermisoError } from "../errors/ErroresDeAutorizacion.js";

// Único lugar que traduce los errores a códigos HTTP.
// El orden importa: se usa la primera clase que coincida (las subclases heredan el código de su padre).
const CODIGOS_POR_ERROR = [
  [DatosInvalidosError, 400],
  [NoAutenticadoError, 401],
  [SinPermisoError, 403],
  [NoEncontradoError, 404],
  [ReglaDeNegocioError, 409],
];

export function errorHandler(err, _req, res, _next) {
  const coincidencia = CODIGOS_POR_ERROR.find(([ClaseDeError]) => err instanceof ClaseDeError);
  if (coincidencia) {
    const [, codigo] = coincidencia;
    return res.status(codigo).json({
      error: err.message,
      ...(err.detalles?.length ? { detalles: err.detalles } : {}),
      timestamp: err.timestamp,
    });
  }

  // JSON mal formado en el body: lo detecta express.json() antes de llegar a nuestro código
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "El cuerpo del pedido no es un JSON válido",
      timestamp: new Date().toISOString(),
    });
  }

  // Cualquier otro error es inesperado: se registra y no se expone el detalle interno
  console.error(err);
  return res.status(500).json({
    error: "Error interno del servidor",
    timestamp: new Date().toISOString(),
  });
}
