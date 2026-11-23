import { AuthService } from "../services/AuthService.js";
import { loginSchema, registroSchema } from "../schemas/AuthSchema.js";
import { validar } from "../schemas/validar.js";

export class AuthController {
  constructor(authService = new AuthService()) {
    this.authService = authService;
  }

  registro = async (req, res) => {
    const datos = validar(registroSchema, req.body);
    res.status(201).json(await this.authService.registro(datos));
  };

  login = async (req, res) => {
    const datos = validar(loginSchema, req.body);
    res.status(200).json(await this.authService.login(datos));
  };

  // Quién es el usuario del token: la app lo usa al abrir, para saber si la sesión guardada sigue vigente
  me = async (req, res) => {
    res.status(200).json(this.authService.toDTO(req.usuario));
  };
}
