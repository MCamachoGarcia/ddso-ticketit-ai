// Qué puede hacer cada rol con una compra, según su estado y la fecha del evento.
// Son las mismas reglas que valida el backend (decisiones 15, 18 y 25): acá solo sirven para no mostrar
// botones que van a fallar. Si igual falla (por ejemplo, el evento empezó con la pantalla abierta),
// se muestra el motivo que manda el backend.

import { formatearPrecio as formatear } from "../../utils/formato";

const fuePagada = (compra) => compra.historial.some((cambio) => cambio.estado === "CONFIRMADA");

const ACCIONES = {
  COMPRADOR: [
    {
      accion: "cancelar",
      texto: "Cancelar compra",
      variante: "peligro",
      puede: (compra, empezo) => ["PENDIENTE_DE_PAGO", "CONFIRMADA"].includes(compra.estado) && !empezo,
      confirmacion: (compra) =>
        compra.estado === "CONFIRMADA"
          ? "Tus entradas se liberan y el organizador te devuelve el dinero. No se puede deshacer."
          : "Tus entradas se liberan para que las compre otra persona. No se puede deshacer.",
    },
  ],
  ORGANIZADOR: [
    {
      accion: "confirmar",
      texto: "Confirmar pago",
      variante: "primario",
      puede: (compra, empezo) => compra.estado === "PENDIENTE_DE_PAGO" && !empezo,
      confirmacion: (compra) =>
        `Confirmás que recibiste ${formatear(compra.total)} de ${compra.comprador.nombre} ${compra.comprador.apellido}. No se puede deshacer.`,
    },
    {
      accion: "utilizar",
      texto: "Marcar como utilizada",
      variante: "primario",
      // Las entradas se usan en el evento: recién desde que empieza
      puede: (compra, empezo) => compra.estado === "CONFIRMADA" && empezo,
      confirmacion: () => "Las entradas quedan usadas y no se pueden volver a usar. No se puede deshacer.",
    },
    {
      accion: "reembolsar",
      texto: "Reembolsar",
      variante: "primario",
      // Solo se devuelve lo que se pagó: una compra cancelada que nunca se confirmó no tiene nada que reembolsar
      puede: (compra) => compra.estado === "CANCELADA" && fuePagada(compra),
      confirmacion: (compra) =>
        `Registrás que le devolviste ${formatear(compra.total)} a ${compra.comprador.nombre} ${compra.comprador.apellido}. No se puede deshacer.`,
    },
  ],
};

export const accionesDisponibles = (compra, rol, ahora = new Date()) => {
  const empezo = new Date(compra.evento.fecha) <= ahora;
  return (ACCIONES[rol] ?? []).filter(({ puede }) => puede(compra, empezo));
};
