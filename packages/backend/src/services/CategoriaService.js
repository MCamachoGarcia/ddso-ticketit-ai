import { CategoriaRepository } from "../repositories/CategoriaRepository.js";
import { NoEncontradoError } from "../domain/errors/ErroresDeDominio.js";

export class CategoriaService {
  constructor(categoriaRepository = new CategoriaRepository()) {
    this.categoriaRepository = categoriaRepository;
  }

  toDTO(categoria) {
    return {
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
    };
  }

  getAll = async () => {
    const categorias = await this.categoriaRepository.findAll();
    return categorias
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map((categoria) => this.toDTO(categoria));
  };

  getById = async (id) => {
    return this.toDTO(await this.buscarCategoria(id));
  };

  // Devuelve la entidad (no el DTO): la usan otros services, como EventoService al crear un evento
  buscarCategoria = async (id) => {
    const categoria = await this.categoriaRepository.findById(id);
    if (!categoria) {
      throw new NoEncontradoError(`No existe una categoría con id ${id}`);
    }
    return categoria;
  };
}
