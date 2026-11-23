import { z } from "zod";
import { parametrosPaginacion } from "./PaginacionSchema.js";

export const enviarMensajeSchema = z
  .object({
    mensaje: z
      .string()
      .trim()
      .min(1, "El mensaje no puede estar vacío")
      .max(1000, "El mensaje no puede superar los 1000 caracteres"),
  })
  .strict();

const fechaIso = z.iso.datetime({ offset: true, local: true }).transform((fecha) => new Date(fecha));

// Paginación de chat (decisión 26): por defecto los últimos `limit` mensajes.
// `antes` trae los anteriores a una fecha (al subir en el chat) y `desde` los posteriores (los nuevos).
export const listarMensajesSchema = z
  .object({
    limit: parametrosPaginacion.limit,
    antes: fechaIso.optional(),
    desde: fechaIso.optional(),
  })
  .strict()
  .refine(({ antes, desde }) => !(antes && desde), {
    message: "No se pueden usar antes y desde a la vez",
    path: ["antes"],
  });
