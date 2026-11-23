import express from "express";
import categoriaRouter from "./CategoriaRoutes.js";
import eventoRouter from "./EventoRoutes.js";
import compraRouter, { comprasDelEventoRouter } from "./CompraRoutes.js";

const router = express.Router();

// La raíz solo se identifica: no expone la lista de endpoints
router.get("/", (_req, res) => {
  res.status(200).json({ name: "API AI Ticket It" });
});

router.use("/categorias", categoriaRouter);
// Compras de un evento (O1): solo para su organizador. Devuelve las compras con su estado y las entradas
// disponibles de cada tipo. Se monta acá para que EventoRoutes y CompraRoutes no se importen entre sí.
router.use("/eventos/:id/compras", comprasDelEventoRouter);
router.use("/eventos", eventoRouter);
router.use("/compras", compraRouter);

export default router;
