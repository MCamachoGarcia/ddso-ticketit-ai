// La fecha y la hora del formulario de eventos se escriben como texto: "DD/MM/AAAA" y "HH:MM" (decisión 40).
// Estas funciones van y vienen entre ese texto y el ISO que usa el backend, siempre en la hora local del celular.

const dosDigitos = (n) => String(n).padStart(2, "0");

// Mientras se escribe: deja solo los números y pone las barras solas ("13122026" → "13/12/2026")
export const enmascararFecha = (texto) => {
  const d = texto.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

// Igual para la hora ("2130" → "21:30")
export const enmascararHora = (texto) => {
  const d = texto.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
};

// ISO del backend → { fecha: "13/12/2026", hora: "21:00" }
export const separarFechaYHora = (iso) => {
  const f = new Date(iso);
  return {
    fecha: `${dosDigitos(f.getDate())}/${dosDigitos(f.getMonth() + 1)}/${f.getFullYear()}`,
    hora: `${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`,
  };
};

// { fecha, hora } → Date, o null si no es una fecha real (por ejemplo, 31/02 o 25:00)
export const unirFechaYHora = (fecha, hora) => {
  const partesFecha = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha);
  const partesHora = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!partesFecha || !partesHora) return null;

  const [, dia, mes, anio] = partesFecha.map(Number);
  const [, horas, minutos] = partesHora.map(Number);
  const resultado = new Date(anio, mes - 1, dia, horas, minutos);

  // new Date "corrige" las fechas imposibles (31/02 pasa a 03/03): si cambió algo, no era válida
  const coincide =
    resultado.getDate() === dia &&
    resultado.getMonth() === mes - 1 &&
    resultado.getFullYear() === anio &&
    resultado.getHours() === horas &&
    resultado.getMinutes() === minutos;
  return coincide ? resultado : null;
};
