import { Categoria } from "../domain/entities/Categoria.js";
import { Evento } from "../domain/entities/Evento.js";
import { TipoEntrada } from "../domain/entities/TipoEntrada.js";
import { Usuario } from "../domain/entities/Usuario.js";
import { RolUsuario } from "../domain/enums/RolUsuario.js";
import { CategoriaRepository } from "../repositories/CategoriaRepository.js";
import { EventoRepository } from "../repositories/EventoRepository.js";
import { UsuarioRepository } from "../repositories/UsuarioRepository.js";

const CATEGORIAS = [
  { nombre: "Música", descripcion: "Recitales y conciertos" },
  { nombre: "Teatro", descripcion: "Obras de teatro y musicales" },
  { nombre: "Deportes", descripcion: "Partidos y competencias" },
  { nombre: "Conferencias", descripcion: "Charlas, congresos y workshops" },
  { nombre: "Festivales", descripcion: "Festivales de varios días o artistas" },
  { nombre: "Stand-up", descripcion: "Comedia en vivo" },
];

// El passwordHash queda vacío hasta implementar el login (decisión 23)
const USUARIOS = [
  { nombre: "Ana", apellido: "Paz", email: "ana.organizadora@demo.com", rol: RolUsuario.ORGANIZADOR },
  { nombre: "Productora", apellido: "Sur", email: "productora.sur@demo.com", rol: RolUsuario.ORGANIZADOR },
  { nombre: "Leo", apellido: "Ruiz", email: "leo.comprador@demo.com", rol: RolUsuario.COMPRADOR },
  { nombre: "Sofía", apellido: "Gómez", email: "sofia.compradora@demo.com", rol: RolUsuario.COMPRADOR },
];

// Fecha relativa a hoy, para que los eventos "próximos" sigan siéndolo cada vez que arranca el servidor
const dentroDe = (dias, hora = 21) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, 0, 0, 0);
  return fecha;
};

// categoria y organizador son índices de las listas de arriba
const EVENTOS = [
  {
    nombre: "Los Pericos en el Luna Park",
    descripcion: "Recital aniversario con todos sus clásicos",
    categoria: 0,
    organizador: 0,
    fecha: dentroDe(20),
    tiposEntrada: [
      { nombre: "Campo", descripcion: "De pie, frente al escenario", precio: 35000, cupo: 500 },
      { nombre: "Platea", descripcion: "Sentado, primer anillo", precio: 52000, cupo: 200 },
      { nombre: "VIP", descripcion: "Con meet & greet", precio: 120000, cupo: 20 },
    ],
  },
  {
    nombre: "Hamlet",
    descripcion: "La tragedia de Shakespeare en una versión contemporánea",
    categoria: 1,
    organizador: 1,
    fecha: dentroDe(8, 20),
    tiposEntrada: [
      { nombre: "Platea", descripcion: "Filas 1 a 15", precio: 28000, cupo: 150 },
      { nombre: "Pullman", descripcion: "Primer piso", precio: 18000, cupo: 80 },
    ],
  },
  {
    nombre: "Superclásico de veteranos",
    descripcion: "Partido a beneficio entre ex jugadores",
    categoria: 2,
    organizador: 1,
    fecha: dentroDe(35, 17),
    tiposEntrada: [{ nombre: "General", descripcion: "Popular", precio: 12000, cupo: 3000 }],
  },
  {
    nombre: "Conferencia de IA aplicada al desarrollo",
    descripcion: "Charlas sobre herramientas de inteligencia artificial para programar",
    categoria: 3,
    organizador: 0,
    fecha: dentroDe(12, 9),
    tiposEntrada: [
      { nombre: "General", descripcion: "Acceso a todas las charlas", precio: 15000, cupo: 300 },
      { nombre: "Estudiante", descripcion: "Con libreta universitaria", precio: 5000, cupo: 100 },
    ],
  },
  {
    nombre: "Festival de Verano",
    descripcion: "Tres escenarios y más de 20 bandas",
    categoria: 4,
    organizador: 0,
    fecha: dentroDe(60, 14),
    tiposEntrada: [
      { nombre: "Abono 2 días", descripcion: "Sábado y domingo", precio: 90000, cupo: 5000 },
      { nombre: "Día único", descripcion: "Un día a elección", precio: 55000, cupo: 5000 },
    ],
  },
  {
    nombre: "Noche de stand-up",
    descripcion: "Cinco comediantes en un show de dos horas",
    categoria: 5,
    organizador: 1,
    fecha: dentroDe(5, 22),
    tiposEntrada: [{ nombre: "General", descripcion: "Mesa compartida", precio: 9000, cupo: 120 }],
  },
  {
    // Ya pasó: no aparece en la búsqueda, pero sirve para probar compras utilizadas y reseñas
    nombre: "Recital acústico de otoño",
    descripcion: "Show íntimo en formato acústico",
    categoria: 0,
    organizador: 0,
    fecha: dentroDe(-30),
    tiposEntrada: [{ nombre: "General", descripcion: "Ubicación libre", precio: 20000, cupo: 100 }],
  },
];

// Vacía las listas en memoria y carga los datos de ejemplo. Se llama al iniciar el servidor.
export async function cargarSeed() {
  CategoriaRepository.limpiar();
  UsuarioRepository.limpiar();
  EventoRepository.limpiar();

  const categoriaRepository = new CategoriaRepository();
  const usuarioRepository = new UsuarioRepository();
  const eventoRepository = new EventoRepository();

  const categorias = [];
  for (const datos of CATEGORIAS) {
    categorias.push(await categoriaRepository.save(new Categoria(datos)));
  }

  const usuarios = [];
  for (const datos of USUARIOS) {
    usuarios.push(await usuarioRepository.save(new Usuario({ ...datos, passwordHash: null })));
  }

  for (const { categoria, organizador, tiposEntrada, ...datos } of EVENTOS) {
    await eventoRepository.save(
      new Evento({
        ...datos,
        categoria: categorias[categoria],
        organizador: usuarios[organizador],
        tiposEntrada: tiposEntrada.map((tipo) => new TipoEntrada(tipo)),
      }),
    );
  }
}
