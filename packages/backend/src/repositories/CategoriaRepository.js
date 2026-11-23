// "Base de datos" en memoria: vive a nivel de módulo para que todas las instancias compartan los mismos datos
const categorias = [];
let siguienteId = 1;

export class CategoriaRepository {
  async findAll() {
    return [...categorias];
  }

  async findById(id) {
    return categorias.find((categoria) => categoria.id === String(id)) ?? null;
  }

  async save(categoria) {
    categoria.id = String(siguienteId++);
    categorias.push(categoria);
    return categoria;
  }

  // Vacía la lista y reinicia los ids. Lo usan el seed y los tests para arrancar desde cero.
  static limpiar() {
    categorias.length = 0;
    siguienteId = 1;
  }
}
