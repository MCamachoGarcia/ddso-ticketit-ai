// "Base de datos" en memoria: vive a nivel de módulo para que todas las instancias compartan los mismos datos
const usuarios = [];
let siguienteId = 1;

export class UsuarioRepository {
  async findAll() {
    return [...usuarios];
  }

  async findById(id) {
    return usuarios.find((usuario) => usuario.id === String(id)) ?? null;
  }

  async save(usuario) {
    usuario.id = String(siguienteId++);
    usuarios.push(usuario);
    return usuario;
  }

  // Vacía la lista y reinicia los ids. Lo usan el seed y los tests para arrancar desde cero.
  static limpiar() {
    usuarios.length = 0;
    siguienteId = 1;
  }
}
