import { useEffect, useRef, useState } from "react";
import { WS_URL } from "../services/configuracion";
import { tokenEnUso } from "../services/api";

const ESPERA_PARA_RECONECTAR_MS = 3000;

/**
 * Recibir en tiempo real los mensajes nuevos de un chat (decisión 26), por WebSocket.
 * Protocolo con el backend: { autenticar, token } → { suscribir, compraId } → llegan { tipo: "mensaje", mensaje }.
 * El token va en el primer mensaje y no en la URL, como recomienda la clase (la URL queda en los logs).
 *
 * Si se corta (sin señal, el backend se reinició), reintenta cada 3 segundos y avisa con alReconectar,
 * para que la pantalla vuelva a pedir lo que se perdió mientras tanto.
 *
 * Devuelve el estado de la conexión: "conectando", "en-vivo" o "sin-conexion".
 * Es un hook propio: lógica con estado y efectos reutilizable, igual que en React web.
 */
export function useChatEnVivo(compraId, { alRecibir, alReconectar }) {
  const [estado, setEstado] = useState("conectando");
  // Las funciones se guardan en una ref: así el efecto no se reinicia (y no reconecta) en cada render
  const callbacks = useRef({ alRecibir, alReconectar });
  callbacks.current = { alRecibir, alReconectar };

  useEffect(() => {
    let socket = null;
    let reintento = null;
    let terminado = false;
    let yaEstuvoConectado = false;

    const conectar = () => {
      setEstado("conectando");
      socket = new WebSocket(WS_URL);

      socket.onopen = () => socket.send(JSON.stringify({ tipo: "autenticar", token: tokenEnUso() }));

      socket.onmessage = (evento) => {
        const datos = JSON.parse(evento.data);
        if (datos.tipo === "autenticado") socket.send(JSON.stringify({ tipo: "suscribir", compraId }));
        if (datos.tipo === "suscripto") {
          setEstado("en-vivo");
          if (yaEstuvoConectado) callbacks.current.alReconectar?.();
          yaEstuvoConectado = true;
        }
        if (datos.tipo === "mensaje") callbacks.current.alRecibir(datos.mensaje);
        // Un error de autenticación o de permiso no se arregla reintentando
        if (datos.tipo === "error") {
          terminado = true;
          setEstado("sin-conexion");
          socket.close();
        }
      };

      socket.onclose = () => {
        if (terminado) return;
        setEstado("sin-conexion");
        reintento = setTimeout(conectar, ESPERA_PARA_RECONECTAR_MS);
      };
    };

    conectar();

    // Al salir de la pantalla: se deja de reintentar y se cierra la conexión
    return () => {
      terminado = true;
      clearTimeout(reintento);
      socket?.close();
    };
  }, [compraId]);

  return estado;
}
