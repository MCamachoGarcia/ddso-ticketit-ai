// Todo lo que el formulario de eventos hace con sus datos, separado de cómo se dibuja:
// el estado inicial, la validación antes de mandar y la conversión al body del backend.
import { separarFechaYHora, unirFechaYHora } from "../../utils/fechaFormulario";

// Cada tipo de entrada necesita una clave para la lista de React, aunque todavía no tenga id (los nuevos)
let ultimaClave = 0;
const nuevaClave = () => `nuevo-${++ultimaClave}`;

export const tipoEntradaVacio = () => ({ clave: nuevaClave(), nombre: "", descripcion: "", precio: "", cupo: "" });

// Los números se editan como texto (un TextInput siempre devuelve texto): se convierten recién al mandar
export const formularioInicial = (evento) => {
  if (!evento) {
    return {
      nombre: "",
      descripcion: "",
      categoriaId: null,
      fecha: "",
      hora: "",
      multimedia: "",
      tiposEntrada: [tipoEntradaVacio()],
    };
  }
  return {
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    categoriaId: evento.categoria.id,
    ...separarFechaYHora(evento.fecha),
    multimedia: evento.multimedia.join("\n"),
    tiposEntrada: evento.tiposEntrada.map((tipo) => ({
      clave: tipo.id,
      id: tipo.id, // los existentes van con su id: el backend los modifica en lugar de crear otros
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      precio: tipo.precio.toLocaleString("es-AR"), // 12500 → "12.500", como se escribe acá
      cupo: String(tipo.cupo),
    })),
  };
};

// Como se escriben los números en Argentina (y como la app muestra los precios): el punto separa los miles
// y la coma es la decimal. "12.500" → 12500 y "1.500,50" → 1500.5
const aNumero = (texto) => Number(texto.trim().replace(/\./g, "").replace(",", "."));

const urlsDe = (texto) =>
  texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean);

/**
 * Valida antes de mandar, con los mismos mensajes y nombres de campo que el backend
 * ("nombre", "tiposEntrada.0.precio"…). Así los errores de acá y los de allá se muestran igual.
 * Devuelve un objeto { campo: mensaje }; vacío si está todo bien.
 */
export const validarFormulario = (formulario, ahora = new Date()) => {
  const errores = {};
  if (!formulario.nombre.trim()) errores.nombre = "El nombre es obligatorio";
  if (!formulario.descripcion.trim()) errores.descripcion = "La descripción es obligatoria";
  if (!formulario.categoriaId) errores.categoriaId = "Elegí una categoría";

  const fecha = unirFechaYHora(formulario.fecha, formulario.hora);
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formulario.fecha)) errores.fecha = "Escribí la fecha como DD/MM/AAAA";
  else if (!/^\d{2}:\d{2}$/.test(formulario.hora)) errores.hora = "Escribí la hora como HH:MM";
  else if (!fecha) errores.fecha = "Esa fecha u hora no existe";
  else if (fecha <= ahora) errores.fecha = "La fecha del evento debe ser futura";

  urlsDe(formulario.multimedia).forEach((url) => {
    if (!/^https?:\/\/\S+$/.test(url)) errores.multimedia = "Cada línea tiene que ser una dirección que empiece con http:// o https://";
  });

  const nombresVistos = new Set();
  formulario.tiposEntrada.forEach((tipo, i) => {
    const campo = (nombre) => `tiposEntrada.${i}.${nombre}`;
    const nombre = tipo.nombre.trim().toLowerCase();
    if (!nombre) errores[campo("nombre")] = "El nombre es obligatorio";
    else if (nombresVistos.has(nombre)) errores[campo("nombre")] = "Ya hay otro tipo de entrada con este nombre";
    nombresVistos.add(nombre);

    const precio = aNumero(tipo.precio);
    if (tipo.precio.trim() === "" || Number.isNaN(precio)) errores[campo("precio")] = "Escribí el precio (0 si es gratis)";
    else if (precio < 0) errores[campo("precio")] = "El precio no puede ser negativo";

    const cupo = aNumero(tipo.cupo);
    if (!Number.isInteger(cupo) || cupo <= 0) errores[campo("cupo")] = "El cupo debe ser un número entero mayor a 0";
  });

  return errores;
};

// El body que esperan POST /eventos y PUT /eventos/:id (el formulario ya pasó la validación)
export const aDatosDelBackend = (formulario) => ({
  nombre: formulario.nombre.trim(),
  descripcion: formulario.descripcion.trim(),
  categoriaId: formulario.categoriaId,
  fecha: unirFechaYHora(formulario.fecha, formulario.hora).toISOString(),
  multimedia: urlsDe(formulario.multimedia),
  tiposEntrada: formulario.tiposEntrada.map((tipo) => ({
    ...(tipo.id && { id: tipo.id }),
    nombre: tipo.nombre.trim(),
    descripcion: tipo.descripcion.trim(),
    precio: aNumero(tipo.precio),
    cupo: aNumero(tipo.cupo),
  })),
});

// Los detalles de un 400 del backend ("tiposEntrada.0.cupo: ...") al mismo formato { campo: mensaje }.
// "multimedia.2" se muestra en el campo multimedia.
export const erroresDelBackend = (detalles) =>
  Object.fromEntries(
    detalles
      .filter((detalle) => detalle.campo)
      .map(({ campo, mensaje }) => [campo.startsWith("multimedia") ? "multimedia" : campo, mensaje]),
  );
