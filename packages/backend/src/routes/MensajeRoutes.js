import express from "express";
import { MensajeController } from "../controllers/MensajeController.js";
import { MensajeService } from "../services/MensajeService.js";
import { CompraRepository } from "../repositories/CompraRepository.js";
import { compraService } from "./CompraRoutes.js";
import { chatWebSocket } from "../websocket/ChatWebSocket.js";
import { autenticar } from "../middlewares/autenticar.js";
import { exigirParticipanteDeLaCompra } from "../middlewares/permisos.js";

// Cada mensaje nuevo se avisa en tiempo real por el WebSocket
export const mensajeService = new MensajeService(compraService, new CompraRepository(), chatWebSocket);
const mensajeController = new MensajeController(mensajeService);

// Se monta en /compras/:id/mensajes: el chat de una compra (C3/O3)
const router = express.Router({ mergeParams: true });

// Leer y escribir: solo el comprador o el organizador del evento de esa compra, en cualquier estado
router.use(autenticar, exigirParticipanteDeLaCompra);

router.route("/")
  .get((req, res) => mensajeController.listar(req, res))
  .post((req, res) => mensajeController.enviar(req, res));

export default router;
