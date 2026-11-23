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
}
