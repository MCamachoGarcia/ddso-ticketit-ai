import { DatosInvalidosError } from "../domain/errors/ErroresDeDominio.js";

// Valida datos de entrada (body, query o params) con un schema de zod.
// Si no cumplen, lanza DatosInvalidosError con un detalle legible por campo.
export function validar(schema, datos) {
  const resultado = schema.safeParse(datos ?? {});
  if (!resultado.success) {
    const detalles = resultado.error.issues.map(({ path, message }) =>
      path.length ? `${path.join(".")}: ${message}` : message,
    );
    throw new DatosInvalidosError("Datos inválidos", detalles);
  }
  return resultado.data;
}
