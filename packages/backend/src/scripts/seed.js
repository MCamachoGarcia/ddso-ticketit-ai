import { Categoria } from "../domain/entities/Categoria.js";
import { Compra } from "../domain/entities/Compra.js";
import { EstadoCompra } from "../domain/enums/EstadoCompra.js";
import { CompraRepository } from "../repositories/CompraRepository.js";
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

// Una compra por cada estado, para probar todas las pantallas y transiciones. evento, tipo y comprador son
// índices; "pasos" son los cambios de estado después de PENDIENTE_DE_PAGO, con quién y cuándo (días desde hoy).
const C = 2; // Leo, comprador
const S = 3; // Sofía, compradora
const ORGANIZADOR_DEL_EVENTO = "organizador";
const COMPRAS = [
  // Pendiente: el organizador (Ana) la puede confirmar
  { evento: 0, tipo: 2, comprador: S, cantidad: 1, creadaHace: 1, pasos: [] },
  // Confirmada: muestra los días que faltan; el comprador la puede cancelar
  { evento: 0, tipo: 0, comprador: C, cantidad: 2, creadaHace: 5, pasos: [[EstadoCompra.CONFIRMADA, ORGANIZADOR_DEL_EVENTO, -4]] },
  // Cancelada sin haber pagado: no se puede reembolsar
  { evento: 1, tipo: 0, comprador: C, cantidad: 1, creadaHace: 3, pasos: [[EstadoCompra.CANCELADA, C, -2]] },
  // Pagada y cancelada: el organizador (Ana) la puede reembolsar
  {
    evento: 3,
    tipo: 1,
    comprador: S,
    cantidad: 1,
    creadaHace: 6,
    pasos: [[EstadoCompra.CONFIRMADA, ORGANIZADOR_DEL_EVENTO, -5], [EstadoCompra.CANCELADA, S, -1]],
  },
  // Utilizada, de un evento que ya pasó: lista para reseñar
  {
    evento: 6,
    tipo: 0,
    comprador: C,
    cantidad: 2,
    creadaHace: 45,
    pasos: [[EstadoCompra.CONFIRMADA, ORGANIZADOR_DEL_EVENTO, -44], [EstadoCompra.UTILIZADA, ORGANIZADOR_DEL_EVENTO, "evento"]],
  },
];

// Vacía las listas en memoria y carga los datos de ejemplo. Se llama al iniciar el servidor.
export async function cargarSeed() {
  CategoriaRepository.limpiar();
  UsuarioRepository.limpiar();
  EventoRepository.limpiar();
  CompraRepository.limpiar();

  const categoriaRepository = new CategoriaRepository();
  const usuarioRepository = new UsuarioRepository();
  const eventoRepository = new EventoRepository();
  const compraRepository = new CompraRepository();

  const categorias = [];
  for (const datos of CATEGORIAS) {
    categorias.push(await categoriaRepository.save(new Categoria(datos)));
  }

  const usuarios = [];
  for (const datos of USUARIOS) {
    usuarios.push(await usuarioRepository.save(new Usuario({ ...datos, passwordHash: null })));
  }

  const eventos = [];
  for (const { categoria, organizador, tiposEntrada, ...datos } of EVENTOS) {
    eventos.push(
      await eventoRepository.save(
        new Evento({
          ...datos,
          categoria: categorias[categoria],
          organizador: usuarios[organizador],
          tiposEntrada: tiposEntrada.map((tipo) => new TipoEntrada(tipo)),
        }),
      ),
    );
  }

  // Las transiciones pasan por actualizarEstado, así el seed respeta las mismas reglas que la API
  for (const { evento: e, tipo, comprador: c, cantidad, creadaHace, pasos } of COMPRAS) {
    const evento = eventos[e];
    const comprador = usuarios[c];
    const compra = new Compra({
      comprador,
      evento,
      tipoEntrada: evento.tiposEntrada[tipo],
      cantidad,
      creadaEl: dentroDe(-creadaHace, 12),
    });
    for (const [estado, quien, dias] of pasos) {
      const usuario = quien === ORGANIZADOR_DEL_EVENTO ? evento.organizador : usuarios[quien];
      compra.actualizarEstado(estado, usuario, dias === "evento" ? evento.fecha : dentroDe(dias, 12));
    }
    await compraRepository.save(compra);
  }

  // Una conversación de ejemplo en la compra 2 (Leo, evento de Ana)
  const compraConChat = await compraRepository.findById("2");
  const [leo, ana] = [usuarios[C], compraConChat.evento.organizador];
  compraConChat.agregarMensaje(leo, "Hola, ¿a qué hora abren las puertas?", dentroDe(-3, 10));
  compraConChat.agregarMensaje(ana, "¡Hola Leo! Las puertas abren a las 19 hs.", dentroDe(-3, 11));
  compraConChat.agregarMensaje(leo, "Genial, ¡gracias!", dentroDe(-3, 12));
  await compraRepository.update(compraConChat);
}
