import { z } from "zod";
import { parametrosPaginacion } from "./PaginacionSchema.js";

const textoObligatorio = (campo) => z.string().trim().min(1, `${campo} es obligatorio`);

const tipoEntradaSchema = z
  .object({
    nombre: textoObligatorio("El nombre del tipo de entrada"),
    descripcion: z.string().trim().default(""),
    precio: z.number().nonnegative("El precio no puede ser negativo"),
    cupo: z.number().int("El cupo debe ser un número entero").positive("El cupo debe ser mayor a 0"),
  })
  .strict();

// Al editar, un tipo con id modifica uno existente y uno sin id es nuevo (decisión 24)
const tipoEntradaEditableSchema = tipoEntradaSchema.extend({
  id: z.string().trim().min(1).optional(),
});

const nombresSinRepetir = (tipos) =>
  new Set(tipos.map((tipo) => tipo.nombre.toLowerCase())).size === tipos.length;

const idsSinRepetir = (tipos) => {
  const ids = tipos.filter((tipo) => tipo.id).map((tipo) => tipo.id);
  return new Set(ids).size === ids.length;
};

// Crear y editar (PUT) reciben el evento completo: solo cambia el schema de cada tipo de entrada
const eventoSchema = (schemaTipo) =>
  z
    .object({
      nombre: textoObligatorio("El nombre"),
      descripcion: textoObligatorio("La descripción"),
      categoriaId: textoObligatorio("La categoría"),
      // Fecha y hora en formato ISO 8601, por ejemplo "2026-12-20T21:00:00-03:00"
      fecha: z.iso.datetime({ offset: true, local: true }).transform((fecha) => new Date(fecha)),
      tiposEntrada: z
        .array(schemaTipo)
        .min(1, "El evento debe tener al menos un tipo de entrada")
        .refine(nombresSinRepetir, "Los tipos de entrada de un evento no pueden repetir el nombre")
        .refine(idsSinRepetir, "Un mismo tipo de entrada no puede aparecer dos veces"),
      multimedia: z.array(z.url("Cada elemento multimedia debe ser una URL")).default([]),
    })
    .strict();

export const crearEventoSchema = eventoSchema(tipoEntradaSchema);
export const actualizarEventoSchema = eventoSchema(tipoEntradaEditableSchema);

// Los query params llegan como texto: se acepta un número no negativo escrito como tal ("1500" o "1500.50")
const numeroNoNegativo = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Debe ser un número no negativo")
  .pipe(z.coerce.number());

export const buscarEventosSchema = z
  .object({
    texto: z.string().trim().optional(),
    categoriaId: z.string().trim().optional(),
    precioMin: numeroNoNegativo.optional(),
    precioMax: numeroNoNegativo.optional(),
    // puntaje: el promedio de las reseñas del organizador (decisión 27)
    orden: z.enum(["fecha", "precio", "puntaje"]).default("fecha"),
    direccion: z.enum(["asc", "desc"]).default("asc"),
    ...parametrosPaginacion,
  })
  .strict()
  .refine(
    ({ precioMin, precioMax }) => precioMin === undefined || precioMax === undefined || precioMin <= precioMax,
    { message: "precioMin no puede ser mayor a precioMax", path: ["precioMin"] },
  );
