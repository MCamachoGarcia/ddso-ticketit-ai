// Errores propios del negocio. No saben nada de HTTP: solo dicen qué salió mal.
// El middleware errorHandler es quien decide con qué código HTTP se responde cada uno.

export class ErrorDeDominio extends Error {
  constructor(message, detalles = []) {
    super(message);
    this.name = this.constructor.name;
    this.detalles = detalles;
    this.timestamp = new Date().toISOString();
  }
}

// Los datos recibidos no cumplen el formato esperado (campos faltantes, tipos incorrectos, etc.)
export class DatosInvalidosError extends ErrorDeDominio {}

// Se buscó algo que no existe (un evento, una compra, un usuario...)
export class NoEncontradoError extends ErrorDeDominio {}

// La acción es válida en formato, pero el negocio no la permite en la situación actual
export class ReglaDeNegocioError extends ErrorDeDominio {}

export class TransicionDeEstadoInvalidaError extends ReglaDeNegocioError {
  constructor(estadoActual, estadoNuevo) {
    super(`No se puede pasar una compra de ${estadoActual} a ${estadoNuevo}`);
    this.estadoActual = estadoActual;
    this.estadoNuevo = estadoNuevo;
  }
}

export class SinCupoError extends ReglaDeNegocioError {
  constructor(tipoEntrada, cantidad) {
    super(
      `No hay cupo para ${cantidad} entrada(s) ${tipoEntrada.nombre}: quedan ${tipoEntrada.cupo}`,
    );
  }
}
