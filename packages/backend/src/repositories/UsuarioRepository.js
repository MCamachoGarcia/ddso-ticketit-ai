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

  // Para el login y para no registrar dos cuentas con el mismo email (se comparan en minúsculas)
  async findByEmail(email) {
    const buscado = String(email).trim().toLowerCase();
    return usuarios.find((usuario) => usuario.email.toLowerCase() === buscado) ?? null;
  }

  async save(usuario) {
    usuario.id = String(siguienteId++);
    usuarios.push(usuario);
    return usuario;
  }

  async update(usuario) {
    const posicion = usuarios.findIndex((guardado) => guardado.id === usuario.id);
    if (posicion === -1) return null;
    usuarios[posicion] = usuario;
    return usuario;
  }

  // Vacía la lista y reinicia los ids. Lo usan el seed y los tests para arrancar desde cero.
  static limpiar() {
    usuarios.length = 0;
    siguienteId = 1;
  }
}
