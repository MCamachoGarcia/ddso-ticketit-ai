// "Base de datos" en memoria: vive a nivel de módulo para que todas las instancias compartan los mismos datos
const resenias = [];
let siguienteId = 1;

export class ReseniaRepository {
  async findAll() {
    return [...resenias];
  }

  async findByEvento(eventoId) {
    return resenias.filter((resenia) => resenia.evento.id === String(eventoId));
  }

  // Las reseñas de todos los eventos de un organizador: forman su puntaje
  async findByOrganizador(organizadorId) {
    return resenias.filter((resenia) => resenia.evento.organizador.id === String(organizadorId));
  }

  async findByCompradorYEvento(compradorId, eventoId) {
    return (
      resenias.find(
        (resenia) => resenia.comprador.id === String(compradorId) && resenia.evento.id === String(eventoId),
      ) ?? null
    );
  }

  async save(resenia) {
    resenia.id = String(siguienteId++);
    resenias.push(resenia);
    return resenia;
  }

  // Vacía la lista y reinicia los ids. Lo usan el seed y los tests para arrancar desde cero.
  static limpiar() {
    resenias.length = 0;
    siguienteId = 1;
  }
}
