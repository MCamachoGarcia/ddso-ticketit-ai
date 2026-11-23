import express from "express";
import { AuthController } from "../controllers/AuthController.js";
import { AuthService } from "../services/AuthService.js";
import { autenticar } from "../middlewares/autenticar.js";

const authController = new AuthController(new AuthService());

const router = express.Router();

// Registrarse e ingresar son públicos: devuelven { token, usuario }
router.post("/registro", (req, res) => authController.registro(req, res));
router.post("/login", (req, res) => authController.login(req, res));
// El usuario del token (requiere token)
router.get("/me", autenticar, (req, res) => authController.me(req, res));

export default router;
