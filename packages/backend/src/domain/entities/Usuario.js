export class Usuario {
  // Cada usuario tiene un único rol: COMPRADOR u ORGANIZADOR (ver RolUsuario).
  // passwordHash nunca se devuelve en una respuesta: los DTO de los services lo dejan afuera.
  constructor({ id = null, nombre, apellido, email, passwordHash, rol, favoritos = [] }) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.passwordHash = passwordHash;
    this.rol = rol;
    this.favoritos = favoritos;
  }

  // Los favoritos se comparan por id de evento (decisión 29)
  esFavorito(eventoId) {
    return this.favoritos.some((evento) => evento.id === String(eventoId));
  }

  // Marcar dos veces el mismo evento no lo duplica
  agregarFavorito(evento) {
    if (!this.esFavorito(evento.id)) this.favoritos.push(evento);
  }

  // Quitar uno que no estaba no es un error: el resultado es el mismo
  quitarFavorito(eventoId) {
    this.favoritos = this.favoritos.filter((evento) => evento.id !== String(eventoId));
  }
}
