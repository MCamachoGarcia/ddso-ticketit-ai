import { z } from "zod";

// Los query params llegan como texto: se acepta solo un entero positivo escrito como tal ("2", no "2.5" ni "abc")
const enteroPositivo = z
  .string()
  .regex(/^[1-9][0-9]*$/, "Debe ser un número entero positivo")
  .pipe(z.coerce.number().int().positive());

// Se reutiliza en los schemas de búsqueda que suman filtros además de la paginación
export const parametrosPaginacion = {
  page: enteroPositivo.optional(),
  limit: enteroPositivo.refine((limit) => limit <= 50, "El límite máximo es 50").optional(),
};

export const paginacionSchema = z.object(parametrosPaginacion).strict();
