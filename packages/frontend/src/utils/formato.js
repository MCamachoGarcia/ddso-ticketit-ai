// Formatos para mostrar datos: precios en pesos y fechas en español de Argentina

const PESOS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

// 35000 → "$ 35.000"
export const formatearPrecio = (precio) => PESOS.format(precio);

const FECHA_CORTA = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

// "2026-12-14T00:00:00.000Z" → "sáb, 13 dic, 21:00" (en la hora local del celular)
export const formatearFechaCorta = (iso) => FECHA_CORTA.format(new Date(iso));

// 4.333 → "4,3"
export const formatearPuntaje = (promedio) => promedio.toFixed(1).replace(".", ",");
