import { CompraService } from "../services/CompraService.js";
import { crearCompraSchema, listarComprasSchema } from "../schemas/CompraSchema.js";
import { validar } from "../schemas/validar.js";
import { EstadoCompra } from "../domain/enums/EstadoCompra.js";

export class CompraController {
  constructor(compraService = new CompraService()) {
    this.compraService = compraService;
  }

  comprar = async (req, res) => {
    const datos = validar(crearCompraSchema, req.body);
    // El comprador sale del usuario identificado (req.usuario), nunca del body
    res.status(201).json(await this.compraService.comprar(datos, req.usuario));
  };

  misCompras = async (req, res) => {
    const filtros = validar(listarComprasSchema, req.query);
    res.status(200).json(await this.compraService.misCompras(req.usuario, filtros));
  };

  getById = async (req, res) => {
    res.status(200).json(await this.compraService.getById(req.params.id));
  };

  comprasDelEvento = async (req, res) => {
    const filtros = validar(listarComprasSchema, req.query);
    res.status(200).json(await this.compraService.comprasDelEvento(req.params.id, filtros));
  };

  // Una acción por transición: cada ruta exige su rol y su control de pertenencia
  confirmar = (req, res) => this.cambiarEstado(req, res, EstadoCompra.CONFIRMADA);
  cancelar = (req, res) => this.cambiarEstado(req, res, EstadoCompra.CANCELADA);
  utilizar = (req, res) => this.cambiarEstado(req, res, EstadoCompra.UTILIZADA);
  reembolsar = (req, res) => this.cambiarEstado(req, res, EstadoCompra.REEMBOLSADA);

  cambiarEstado = async (req, res, estado) => {
    res.status(200).json(await this.compraService.cambiarEstado(req.params.id, estado, req.usuario));
  };
}
