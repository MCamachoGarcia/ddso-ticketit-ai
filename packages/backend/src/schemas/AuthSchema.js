import { z } from "zod";
import { RolUsuario } from "../domain/enums/RolUsuario.js";

// El email se guarda y se compara en minúsculas y sin espacios: "Ana@Demo.com " es la misma cuenta que "ana@demo.com"
const email = z.string().trim().toLowerCase().pipe(z.email("El email no es válido"));

export const loginSchema = z
  .object({
    email,
    // Al ingresar no se valida el largo: si es incorrecta, el error es el mismo que con un email que no existe
    password: z.string().min(1, "La contraseña es obligatoria"),
  })
  .strict();

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio"),
    apellido: z.string().trim().min(1, "El apellido es obligatorio"),
    email,
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña no puede superar los 72 caracteres"), // bcrypt ignora lo que pasa de 72 bytes
    rol: z.enum(Object.values(RolUsuario), "El rol debe ser COMPRADOR u ORGANIZADOR"),
  })
  .strict();
