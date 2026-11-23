// "Base de datos" en memoria: vive a nivel de módulo para que todas las instancias compartan los mismos datos
const eventos = [];
let siguienteId = 1;
// Los tipos de entrada también tienen id propio (las compras los referencian). Es único en toda la API.
let siguienteTipoEntradaId = 1;

export class EventoRepository {
  async findAll() {
    return [...eventos];
  }

  async findById(id) {
    return eventos.find((evento) => evento.id === String(id)) ?? null;
  }

  async save(evento) {
    evento.id = String(siguienteId++);
    this.asignarIdsATiposNuevos(evento);
    eventos.push(evento);
    return evento;
  }

  // Reemplaza el evento guardado con el mismo id. Los tipos de entrada agregados al editar reciben su id acá.
  async update(evento) {
    const posicion = eventos.findIndex((guardado) => guardado.id === evento.id);
    if (posicion === -1) return null;
    this.asignarIdsATiposNuevos(evento);
    eventos[posicion] = evento;
    return evento;
  }

  asignarIdsATiposNuevos(evento) {
    evento.tiposEntrada
      .filter((tipo) => !tipo.id)
      .forEach((tipo) => {
        tipo.id = String(siguienteTipoEntradaId++);
      });
  }

  // Vacía la lista y reinicia los ids. Lo usan el seed y los tests para arrancar desde cero.
  static limpiar() {
    eventos.length = 0;
    siguienteId = 1;
    siguienteTipoEntradaId = 1;
  }
}
