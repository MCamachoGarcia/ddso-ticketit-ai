import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Usuario } from "../domain/entities/Usuario.js";
import { ReglaDeNegocioError } from "../domain/errors/ErroresDeDominio.js";
import { NoAutenticadoError } from "../errors/ErroresDeAutorizacion.js";
import { UsuarioRepository } from "../repositories/UsuarioRepository.js";
import { RONDAS_BCRYPT, secretoJwt, vencimientoJwt } from "../config/autenticacion.js";

// Siempre el mismo mensaje, falle el email o la contraseña: así no se revela qué emails tienen cuenta (clase 10)
const CREDENCIALES_INVALIDAS = "Email o contraseña incorrectos";

// Autenticación (decisión 42): registro, login y verificación del token.
// El token es un JWT firmado con { sub: id, rol }, que vence en 2 horas.
export class AuthService {
  constructor(usuarioRepository = new UsuarioRepository()) {
    this.usuarioRepository = usuarioRepository;
  }

  // Lo que se devuelve de un usuario: nunca el passwordHash
  toDTO(usuario) {
    return { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, rol: usuario.rol };
  }

  // En el payload va solo lo necesario: se puede leer sin la clave (está codificado, no cifrado)
  firmarToken(usuario) {
    return jwt.sign({ sub: usuario.id, rol: usuario.rol }, secretoJwt(), { expiresIn: vencimientoJwt() });
  }

  conToken(usuario) {
    return { token: this.firmarToken(usuario), usuario: this.toDTO(usuario) };
  }

  registro = async ({ nombre, apellido, email, password, rol }) => {
    if (await this.usuarioRepository.findByEmail(email)) {
      throw new ReglaDeNegocioError("Ya existe una cuenta con ese email");
    }
    // Se guarda solo el hash: la contraseña no queda en ningún lado
    const passwordHash = await bcrypt.hash(password, RONDAS_BCRYPT);
    const usuario = await this.usuarioRepository.save(new Usuario({ nombre, apellido, email, passwordHash, rol }));
    return this.conToken(usuario);
  };

  login = async ({ email, password }) => {
    const usuario = await this.usuarioRepository.findByEmail(email);
    const coincide = usuario?.passwordHash ? await bcrypt.compare(password, usuario.passwordHash) : false;
    if (!coincide) throw new NoAutenticadoError(CREDENCIALES_INVALIDAS);
    return this.conToken(usuario);
  };

  // Verifica la firma y el vencimiento, y busca al usuario (puede no existir más). Lo usan el middleware y el WebSocket.
  usuarioDelToken = async (token) => {
    let payload;
    try {
      payload = jwt.verify(token, secretoJwt());
    } catch (error) {
      throw new NoAutenticadoError(
        error.name === "TokenExpiredError" ? "La sesión venció: volvé a iniciar sesión" : "El token no es válido",
      );
    }
    const usuario = await this.usuarioRepository.findById(payload.sub);
    if (!usuario) throw new NoAutenticadoError("El usuario del token no existe");
    return usuario;
  };
}
