export class Evento {
  constructor({
    id = null,
    nombre,
    descripcion,
    categoria,
    fecha,
    tiposEntrada = [],
    multimedia = [],
    organizador,
  }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.categoria = categoria;
    this.fecha = fecha;
    this.tiposEntrada = tiposEntrada;
    this.multimedia = multimedia;
    this.organizador = organizador;
  }

  // Busca uno de sus tipos de entrada por id, o null si no es de este evento
  tipoEntrada(id) {
    return this.tiposEntrada.find((tipo) => tipo.id === String(id)) ?? null;
  }

  // Se considera realizado desde que empieza: el evento no tiene hora de fin
  yaSeRealizo(fechaHora) {
    return this.fecha <= fechaHora;
  }

  // El precio "desde": el más barato de sus tipos de entrada. Se usa para ordenar las búsquedas (decisión 23).
  precioMinimo() {
    if (this.tiposEntrada.length === 0) return null;
    return Math.min(...this.tiposEntrada.map((tipo) => tipo.precio));
  }

  // Un evento tiene varios precios (uno por tipo de entrada): entra en el rango si alguno de ellos cae dentro
  tuPrecioEstaEntre(minimo, maximo) {
    return this.tiposEntrada.some((tipo) => tipo.precio >= minimo && tipo.precio <= maximo);
  }
}
