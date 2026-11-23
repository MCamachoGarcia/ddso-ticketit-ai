import { z } from "zod";
import { parametrosPaginacion } from "./PaginacionSchema.js";
import { EstadoCompra } from "../domain/enums/EstadoCompra.js";

export const crearCompraSchema = z
  .object({
    eventoId: z.string().trim().min(1, "El evento es obligatorio"),
    tipoEntradaId: z.string().trim().min(1, "El tipo de entrada es obligatorio"),
    cantidad: z.number().int("La cantidad debe ser un número entero").positive("La cantidad debe ser mayor a 0"),
  })
  .strict();

// Listados de compras (mis compras y compras de un evento): filtro opcional por estado, paginados
export const listarComprasSchema = z
  .object({
    estado: z.enum(Object.values(EstadoCompra)).optional(),
    ...parametrosPaginacion,
  })
  .strict();
