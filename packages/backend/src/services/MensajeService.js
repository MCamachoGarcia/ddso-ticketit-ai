import { CompraRepository } from "../repositories/CompraRepository.js";
import { CompraService } from "./CompraService.js";

const LIMITE_POR_DEFECTO = 50;

// Si nadie escucha en tiempo real (por ejemplo, en los tests), notificar no hace nada
const sinNotificador = { notificarMensaje: () => {} };

export class MensajeService {
  // El notificador es quien avisa en tiempo real (el WebSocket). Se inyecta: el service no sabe cómo se envía.
  constructor(
    compraService = new CompraService(),
    compraRepository = new CompraRepository(),
    notificador = sinNotificador,
  ) {
    this.compraService = compraService;
    this.compraRepository = compraRepository;
    this.notificador = notificador;
  }

  toDTO(mensaje) {
    return {
      id: mensaje.id,
      // El rol sirve para que la app muestre "Organizador" al lado del nombre
      usuario: {
        id: mensaje.usuario.id,
        nombre: mensaje.usuario.nombre,
        apellido: mensaje.usuario.apellido,
        rol: mensaje.usuario.rol,
      },
      mensaje: mensaje.mensaje,
      enviado: mensaje.enviado.toISOString(),
    };
  }

  // Historial del chat en orden cronológico (decisión 26):
  // - sin filtros: los últimos `limit`
  // - antes: los últimos `limit` anteriores a esa fecha (para cargar más hacia arriba)
  // - desde: los primeros `limit` posteriores a esa fecha (los nuevos)
  listar = async (compraId, { limit = LIMITE_POR_DEFECTO, antes, desde }) => {
    const compra = await this.compraService.buscarCompra(compraId);
    const todos = [...compra.mensajes].sort((a, b) => a.enviado - b.enviado);

    let resultado;
    if (desde) {
      resultado = todos.filter((mensaje) => mensaje.enviado > desde).slice(0, limit);
    } else {
      const candidatos = antes ? todos.filter((mensaje) => mensaje.enviado < antes) : todos;
      resultado = candidatos.slice(-limit);
    }

    // Hay anteriores si el primero devuelto no es el primero del chat
    const hayAnteriores = resultado.length > 0 && todos.indexOf(resultado[0]) > 0;
    return { mensajes: resultado.map((mensaje) => this.toDTO(mensaje)), hayAnteriores };
  };

  // Enviar un mensaje (C3/O3): se guarda en la compra y se avisa a quienes tienen el chat abierto
  enviar = async (compraId, usuario, texto, ahora = new Date()) => {
    const compra = await this.compraService.buscarCompra(compraId);
    const mensaje = compra.agregarMensaje(usuario, texto, ahora);
    await this.compraRepository.update(compra);

    const dto = this.toDTO(mensaje);
    this.notificador.notificarMensaje(compra.id, dto);
    return dto;
  };
}
