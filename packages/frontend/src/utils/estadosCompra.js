// Cómo se muestra cada estado de una compra: nombre para la gente, ícono y colores.
// El estado nunca se comunica solo con el color (accesibilidad): siempre va con texto y con ícono.
// Los pares de colores (fondo 100 + texto 800 de Tailwind) superan el contraste 4.5:1.
export const ESTADOS_COMPRA = {
  PENDIENTE_DE_PAGO: {
    texto: "Pendiente de pago",
    icono: "time-outline",
    clases: { fondo: "bg-amber-100", texto: "text-amber-800" },
    color: "#92400E",
  },
  CONFIRMADA: {
    texto: "Confirmada",
    icono: "checkmark-circle-outline",
    clases: { fondo: "bg-green-100", texto: "text-green-800" },
    color: "#166534",
  },
  UTILIZADA: {
    texto: "Utilizada",
    icono: "ticket-outline",
    clases: { fondo: "bg-blue-100", texto: "text-blue-800" },
    color: "#1E40AF",
  },
  CANCELADA: {
    texto: "Cancelada",
    icono: "close-circle-outline",
    clases: { fondo: "bg-red-100", texto: "text-red-800" },
    color: "#991B1B",
  },
  REEMBOLSADA: {
    texto: "Reembolsada",
    icono: "cash-outline",
    clases: { fondo: "bg-gray-200", texto: "text-gray-800" },
    color: "#1F2937",
  },
};
