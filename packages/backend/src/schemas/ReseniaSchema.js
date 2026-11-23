import { z } from "zod";

export const crearReseniaSchema = z
  .object({
    puntuacion: z
      .number()
      .int("La puntuación debe ser un número entero")
      .min(1, "La puntuación debe estar entre 1 y 5")
      .max(5, "La puntuación debe estar entre 1 y 5"),
    detalle: z
      .string()
      .trim()
      .min(1, "El comentario es obligatorio")
      .max(1000, "El comentario no puede superar los 1000 caracteres"),
  })
  .strict();
