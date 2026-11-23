// Recorta una lista a la página pedida. Si se pide una página mayor a la última, devuelve la última.
export function paginar(resultados, { page = 1, limit = 10 } = {}) {
  const total = resultados.length;
  const totalPages = Math.ceil(total / limit);
  const pagina = Math.min(page, Math.max(1, totalPages));
  const inicio = (pagina - 1) * limit;

  return {
    resultados: resultados.slice(inicio, inicio + limit),
    page: pagina,
    limit,
    total,
    totalPages,
  };
}
