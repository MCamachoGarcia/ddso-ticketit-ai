// "Base de datos" en memoria: vive a nivel de módulo para que todas las instancias compartan los mismos datos
const compras = [];
let siguienteId = 1;

export class CompraRepository {
  async findAll() {
    return [...compras];
  }

  async findById(id) {
    return compras.find((compra) => compra.id === String(id)) ?? null;
  }

  async findByComprador(compradorId) {
    return compras.filter((compra) => compra.comprador.id === String(compradorId));
  }

  async findByEvento(eventoId) {
    return compras.filter((compra) => compra.evento.id === String(eventoId));
  }

  // Entradas de un tipo que están reservadas: suma las cantidades de las compras que ocupan cupo
  async entradasOcupadas(tipoEntradaId) {
    return compras
      .filter((compra) => compra.tipoEntrada.id === String(tipoEntradaId) && compra.ocupaCupo())
      .reduce((total, compra) => total + compra.cantidad, 0);
  }

  async save(compra) {
    compra.id = String(siguienteId++);
    compras.push(compra);
    return compra;
  }

  async update(compra) {
    const posicion = compras.findIndex((guardada) => guardada.id === compra.id);
    if (posicion === -1) return null;
    compras[posicion] = compra;
    return compra;
  }

  // Vacía la lista y reinicia los ids. Lo usan el seed y los tests para arrancar desde cero.
  static limpiar() {
    compras.length = 0;
    siguienteId = 1;
  }
}
