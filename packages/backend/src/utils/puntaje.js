// Puntaje de un conjunto de reseñas: el promedio redondeado a un decimal y cuántas son.
// Sin reseñas, el promedio es null (no 0): "sin datos" no es lo mismo que "puntaje bajo" (decisión 27).
export function calcularPuntaje(resenias) {
  if (resenias.length === 0) return { promedio: null, cantidad: 0 };
  const suma = resenias.reduce((total, resenia) => total + resenia.puntuacion, 0);
  return { promedio: Math.round((suma / resenias.length) * 10) / 10, cantidad: resenias.length };
}
