import { Categoria } from "../domain/entities/Categoria.js";
import { CategoriaRepository } from "../repositories/CategoriaRepository.js";

const CATEGORIAS = [
  { nombre: "Música", descripcion: "Recitales y conciertos" },
  { nombre: "Teatro", descripcion: "Obras de teatro y musicales" },
  { nombre: "Deportes", descripcion: "Partidos y competencias" },
  { nombre: "Conferencias", descripcion: "Charlas, congresos y workshops" },
  { nombre: "Festivales", descripcion: "Festivales de varios días o artistas" },
  { nombre: "Stand-up", descripcion: "Comedia en vivo" },
];

// Vacía las listas en memoria y carga los datos de ejemplo. Se llama al iniciar el servidor.
export async function cargarSeed() {
  CategoriaRepository.limpiar();
  const categoriaRepository = new CategoriaRepository();
  for (const datos of CATEGORIAS) {
    await categoriaRepository.save(new Categoria(datos));
  }
}
