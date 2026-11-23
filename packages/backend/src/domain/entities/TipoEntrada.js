export class TipoEntrada {
  constructor({ id = null, nombre, descripcion, precio, cupo }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.precio = precio;
    this.cupo = cupo;
  }

  // Cuántas entradas quedan, sabiendo cuántas ocupan las compras (eso lo calcula el service con el repositorio)
  disponibles(ocupadas = 0) {
    return Math.max(this.cupo - ocupadas, 0);
  }

  hayCupoPara(cantidad, ocupadas = 0) {
    return cantidad > 0 && cantidad <= this.disponibles(ocupadas);
  }
}
