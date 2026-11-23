// Manejo unificado de los errores que llegan del backend (igual que en el TP).
//
// El backend responde siempre { error, detalles?, timestamp } con un código HTTP según el problema.
// Acá se traduce a algo que cualquier pantalla pueda mostrar igual: un tipo, un título, un mensaje en español
// y, si hay, el detalle de qué campos están mal.

export const TIPOS_DE_ERROR = {
  RED: "red",
  VALIDACION: "validacion",
  SESION: "sesion",
  PERMISO: "permiso",
  NO_ENCONTRADO: "noEncontrado",
  REGLA_DE_NEGOCIO: "reglaDeNegocio",
  SERVIDOR: "servidor",
  DESCONOCIDO: "desconocido",
};

const MENSAJES_POR_DEFECTO = {
  [TIPOS_DE_ERROR.RED]: "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.",
  [TIPOS_DE_ERROR.VALIDACION]: "Los datos enviados no son válidos.",
  [TIPOS_DE_ERROR.SESION]: "Tenés que identificarte para hacer esto.",
  [TIPOS_DE_ERROR.PERMISO]: "No tenés permiso para realizar esta acción.",
  [TIPOS_DE_ERROR.NO_ENCONTRADO]: "No encontramos lo que buscabas.",
  [TIPOS_DE_ERROR.REGLA_DE_NEGOCIO]: "No se pudo completar la acción.",
  [TIPOS_DE_ERROR.SERVIDOR]: "Tuvimos un problema de nuestro lado. Probá de nuevo en unos minutos.",
  [TIPOS_DE_ERROR.DESCONOCIDO]: "Ocurrió un error inesperado.",
};

export const TITULOS_POR_TIPO = {
  [TIPOS_DE_ERROR.RED]: "Sin conexión",
  [TIPOS_DE_ERROR.VALIDACION]: "Revisá los datos",
  [TIPOS_DE_ERROR.SESION]: "Sesión no válida",
  [TIPOS_DE_ERROR.PERMISO]: "No tenés permiso",
  [TIPOS_DE_ERROR.NO_ENCONTRADO]: "No encontrado",
  [TIPOS_DE_ERROR.REGLA_DE_NEGOCIO]: "No se pudo completar",
  [TIPOS_DE_ERROR.SERVIDOR]: "Problema del servidor",
  [TIPOS_DE_ERROR.DESCONOCIDO]: "Algo salió mal",
};

const tipoSegunEstado = (estado) => {
  if (estado === 400) return TIPOS_DE_ERROR.VALIDACION;
  if (estado === 401) return TIPOS_DE_ERROR.SESION;
  if (estado === 403) return TIPOS_DE_ERROR.PERMISO;
  if (estado === 404) return TIPOS_DE_ERROR.NO_ENCONTRADO;
  if (estado === 409) return TIPOS_DE_ERROR.REGLA_DE_NEGOCIO;
  if (estado >= 500) return TIPOS_DE_ERROR.SERVIDOR;
  return TIPOS_DE_ERROR.DESCONOCIDO;
};

// Nuestro backend manda cada detalle como "campo: mensaje" (por ejemplo "cantidad: La cantidad debe ser mayor a 0")
const separarDetalle = (detalle) => {
  const separador = detalle.indexOf(": ");
  return separador > 0
    ? { campo: detalle.slice(0, separador), mensaje: detalle.slice(separador + 2) }
    : { mensaje: detalle };
};

/**
 * Convierte cualquier error (de axios o no) en { tipo, titulo, estado, mensaje, detalles, reintentable }.
 * - mensaje: siempre un texto en español apto para mostrar. En los 5xx nunca se muestra lo que diga el servidor.
 * - detalles: [{ campo?, mensaje }] con lo que falló en la validación.
 * - reintentable: tiene sentido ofrecer "Reintentar" (sin conexión o falla del servidor).
 */
export function normalizarError(error) {
  const respuesta = error?.response;

  if (!respuesta) {
    // Sin respuesta: el pedido no llegó al servidor (sin conexión, backend apagado, IP equivocada)
    const tipo = error?.request || error?.code === "ERR_NETWORK" ? TIPOS_DE_ERROR.RED : TIPOS_DE_ERROR.DESCONOCIDO;
    return {
      tipo,
      titulo: TITULOS_POR_TIPO[tipo],
      estado: null,
      mensaje: MENSAJES_POR_DEFECTO[tipo],
      detalles: [],
      reintentable: tipo === TIPOS_DE_ERROR.RED,
    };
  }

  const estado = respuesta.status;
  const tipo = tipoSegunEstado(estado);
  const delServidor = tipo === TIPOS_DE_ERROR.SERVIDOR;
  const detalles = Array.isArray(respuesta.data?.detalles) ? respuesta.data.detalles : [];

  return {
    tipo,
    titulo: TITULOS_POR_TIPO[tipo],
    estado,
    mensaje: (!delServidor && respuesta.data?.error) || MENSAJES_POR_DEFECTO[tipo],
    detalles: delServidor ? [] : detalles.map(separarDetalle),
    reintentable: delServidor,
  };
}

// El mensaje en una sola línea, por ejemplo para un aviso después de una acción
export function mensajeError(error) {
  const { mensaje, detalles } = normalizarError(error);
  return detalles.length ? `${mensaje}: ${detalles.map((d) => d.mensaje).join(", ")}` : mensaje;
}
