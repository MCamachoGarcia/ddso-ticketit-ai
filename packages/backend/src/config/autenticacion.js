// Configuración del JWT (decisión 42). El secreto va en una variable de entorno, nunca en el repositorio.
// Se lee en cada llamada y no al cargar el módulo: en index.js, dotenv carga el .env después de los imports.

const LARGO_MINIMO_DEL_SECRETO = 32;

export function secretoJwt() {
  const secreto = process.env.JWT_SECRET;
  if (!secreto || secreto.length < LARGO_MINIMO_DEL_SECRETO) {
    throw new Error(
      `Falta la variable de entorno JWT_SECRET (al menos ${LARGO_MINIMO_DEL_SECRETO} caracteres). Agregala al .env del backend.`,
    );
  }
  return secreto;
}

// Cuánto dura un token: 2 horas, sin refresh token (decisión 42). Se puede cambiar con JWT_EXPIRES_IN.
export const vencimientoJwt = () => process.env.JWT_EXPIRES_IN || "2h";

// Costo del hash de bcrypt: cada +1 duplica el tiempo. 10 es el valor habitual (y el de la clase).
export const RONDAS_BCRYPT = 10;
