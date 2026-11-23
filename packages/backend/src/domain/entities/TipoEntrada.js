export class TipoEntrada {
  constructor({ id = null, nombre, descripcion, precio, cupo }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.cupo = cupo;
  }

  hayCupoPara(cantidad) {
    return cantidad > 0 && cantidad <= this.cupo;
  }
}
