import { createRequire } from "module";
import { AuthService } from "../services/AuthService.js";
import { permisosService as permisosPorDefecto } from "../services/PermisosService.js";

// "ws" se carga como CommonJS: con import, Node y Jest 27 exponen cosas distintas
// (Node no pone WebSocketServer en el export por defecto y Jest no ve los exports con nombre)
const require = createRequire(import.meta.url);
const { WebSocket, WebSocketServer } = require("ws");

// Chat en tiempo real (decisión 26). Los mensajes se ENVÍAN por REST (POST /compras/:id/mensajes);
// por acá solo se RECIBEN: el servidor empuja cada mensaje nuevo a quienes tienen abierto el chat de esa compra.
//
// Protocolo (JSON), siempre en este orden:
//   cliente → { tipo: "autenticar", token }       servidor → { tipo: "autenticado", usuario }
//   cliente → { tipo: "suscribir", compraId }      servidor → { tipo: "suscripto", compraId }
//   servidor → { tipo: "mensaje", compraId, mensaje }   (cada vez que alguien escribe)
//   cliente → { tipo: "desuscribir", compraId }    servidor → { tipo: "desuscripto", compraId }
//   servidor → { tipo: "error", error }            (si algo falla; la conexión sigue abierta)
//
// El token va en el primer mensaje y no en la URL, como recomienda la clase: la URL queda en los logs.
// Es el mismo JWT del header Authorization de la API (decisión 42).
export class ChatWebSocket {
  constructor(authService = new AuthService(), permisosService = permisosPorDefecto) {
    this.authService = authService;
    this.permisosService = permisosService;
    // compraId → conjunto de conexiones que tienen abierto ese chat
    this.suscripciones = new Map();
  }

  // Se engancha al mismo servidor HTTP de Express, en la ruta /ws
  iniciar(servidorHttp) {
    this.servidor = new WebSocketServer({ server: servidorHttp, path: "/ws" });
    this.servidor.on("connection", (socket) => this.alConectar(socket));
  }

  alConectar(socket) {
    socket.usuario = null;
    socket.compras = new Set();
    socket.on("message", (datos) =>
      this.alRecibir(socket, datos).catch((error) => this.enviar(socket, { tipo: "error", error: error.message })),
    );
    socket.on("close", () => socket.compras.forEach((compraId) => this.desuscribir(socket, compraId)));
  }

  async alRecibir(socket, datos) {
    let pedido;
    try {
      pedido = JSON.parse(datos.toString());
    } catch {
      throw new Error("El mensaje no es un JSON válido");
    }

    if (pedido.tipo === "autenticar") return this.autenticar(socket, pedido.token);
    if (!socket.usuario) throw new Error("Primero hay que autenticarse");
    if (pedido.tipo === "suscribir") return this.suscribir(socket, String(pedido.compraId));
    if (pedido.tipo === "desuscribir") {
      this.desuscribir(socket, String(pedido.compraId));
      return this.enviar(socket, { tipo: "desuscripto", compraId: String(pedido.compraId) });
    }
    throw new Error(`Tipo de mensaje desconocido: ${pedido.tipo}`);
  }

  // Misma verificación que el middleware autenticar: firma, vencimiento y que el usuario exista
  async autenticar(socket, token) {
    if (!token) throw new Error("Falta el token");
    const usuario = await this.authService.usuarioDelToken(String(token));
    socket.usuario = usuario;
    this.enviar(socket, { tipo: "autenticado", usuario: { id: usuario.id, nombre: usuario.nombre } });
  }

  // Mismo control de pertenencia que el chat por REST: el comprador o el organizador del evento
  async suscribir(socket, compraId) {
    await this.permisosService.exigirParticipanteDeLaCompra(socket.usuario, compraId);
    if (!this.suscripciones.has(compraId)) this.suscripciones.set(compraId, new Set());
    this.suscripciones.get(compraId).add(socket);
    socket.compras.add(compraId);
    this.enviar(socket, { tipo: "suscripto", compraId });
  }

  desuscribir(socket, compraId) {
    this.suscripciones.get(compraId)?.delete(socket);
    socket.compras.delete(compraId);
  }

  // Lo llama MensajeService después de guardar un mensaje
  notificarMensaje(compraId, mensaje) {
    for (const socket of this.suscripciones.get(String(compraId)) ?? []) {
      this.enviar(socket, { tipo: "mensaje", compraId: String(compraId), mensaje });
    }
  }

  enviar(socket, datos) {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(datos));
  }

  cerrar() {
    this.servidor?.clients.forEach((socket) => socket.terminate());
    this.servidor?.close();
    this.suscripciones.clear();
  }
}

export const chatWebSocket = new ChatWebSocket();
