import express from "express";
import categoriaRouter from "./CategoriaRoutes.js";

const router = express.Router();

// La raíz solo se identifica: no expone la lista de endpoints
router.get("/", (_req, res) => {
  res.status(200).json({ name: "API AI Ticket It" });
});

router.use("/categorias", categoriaRouter);

export default router;
