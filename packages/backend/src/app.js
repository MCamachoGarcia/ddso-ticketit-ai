import express from "express";
import cors from "cors";
import { z } from "zod";
import router from "./routes/router.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { NoEncontradoError } from "./domain/errors/ErroresDeDominio.js";

// Los mensajes de validación que llegan al front salen en español, no en el inglés por defecto de zod
z.config(z.locales.es());

export const app = express();

// La app mobile no tiene las restricciones de origen de un navegador; CORS abierto sirve para probar desde la web
app.use(cors());
app.use(express.json());

app.get("/healthcheck", (_req, res) => res.json({ status: "ok" }));
app.use(router);

// Cualquier ruta que no exista responde 404 con el mismo formato que el resto de los errores
app.use((req, _res) => {
  throw new NoEncontradoError(`No existe la ruta ${req.method} ${req.originalUrl}`);
});

app.use(errorHandler);
