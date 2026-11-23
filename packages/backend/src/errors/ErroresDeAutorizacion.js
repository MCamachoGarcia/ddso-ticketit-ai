// Errores de autenticación y autorización. No son del dominio (decisión 15): los lanzan los middlewares de las rutas.
// Tienen la misma forma que los errores de dominio para que el errorHandler los responda con el mismo formato.

class ErrorDeAutorizacion extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.detalles = [];
    this.timestamp = new Date().toISOString();
  }
}

// No se sabe quién hace el pedido: falta la identificación o no corresponde a ningún usuario (401)
export class NoAutenticadoError extends ErrorDeAutorizacion {
  constructor(message = "Tenés que identificarte para realizar esta acción") {
    super(message);
  }
}

// Se sabe quién es, pero su rol o el recurso no le permiten hacer esto (403)
export class SinPermisoError extends ErrorDeAutorizacion {
  constructor(message = "No tenés permiso para realizar esta acción") {
    super(message);
  }
}
