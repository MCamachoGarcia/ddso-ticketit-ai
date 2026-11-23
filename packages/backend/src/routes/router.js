import express from "express";
import categoriaRouter from "./CategoriaRoutes.js";
import eventoRouter from "./EventoRoutes.js";
import compraRouter, { comprasDelEventoRouter } from "./CompraRoutes.js";
import mensajeRouter from "./MensajeRoutes.js";
import { reseniasDelEventoRouter, reseniasDelOrganizadorRouter } from "./ReseniaRoutes.js";
import { favoritoDelEventoRouter, misFavoritosRouter } from "./FavoritoRoutes.js";
import authRouter from "./AuthRoutes.js";

const router = express.Router();

// La raíz solo se identifica: no expone la lista de endpoints
router.get("/", (_req, res) => {
  res.status(200).json({ name: "API AI Ticket It" });
});

// Registro, login y "quién soy" (decisión 42)
router.use("/auth", authRouter);
router.use("/categorias", categoriaRouter);
// Compras de un evento (O1): solo para su organizador. Devuelve las compras con su estado y las entradas
// disponibles de cada tipo. Se monta acá para que EventoRoutes y CompraRoutes no se importen entre sí.
router.use("/eventos/:id/compras", comprasDelEventoRouter);
// Reseñas de un evento: verlas es público; reseñar, solo un comprador que usó una entrada
router.use("/eventos/:id/resenias", reseniasDelEventoRouter);
// Favoritos del comprador. "/eventos/favoritos" va antes que "/eventos": si no, "favoritos" se tomaría como id
router.use("/eventos/favoritos", misFavoritosRouter);
router.use("/eventos/:id/favorito", favoritoDelEventoRouter);
router.use("/eventos", eventoRouter);
// Reputación de un organizador (C6): las reseñas de todos sus eventos y su promedio, pública
router.use("/organizadores/:id/resenias", reseniasDelOrganizadorRouter);
// Chat de una compra. Va antes que "/compras" para no pasar dos veces por autenticar
router.use("/compras/:id/mensajes", mensajeRouter);
router.use("/compras", compraRouter);

export default router;
