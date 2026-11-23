import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatearFechaCorta, formatearPrecio, formatearPuntaje } from "../../utils/formato";
import { COLORES } from "../../styles/colores";
import { Estrellas } from "../Estrellas/Estrellas";

// Un ícono por categoría, para que cada tarjeta se reconozca de un vistazo
const ICONO_POR_CATEGORIA = {
  Música: "musical-notes",
  Teatro: "film",
  Deportes: "football",
  Conferencias: "mic",
  Festivales: "sparkles",
  "Stand-up": "happy",
};

// Para el lector de pantalla, que lee toda la tarjeta en una frase
const textoDelPuntaje = ({ promedio, cantidad }) =>
  promedio === null
    ? "sin reseñas"
    : `puntaje ${formatearPuntaje(promedio)} de 5 en ${cantidad} ${cantidad === 1 ? "reseña" : "reseñas"}`;

// Para el organizador: cuántos tipos de entrada y cuántas entradas en total pone a la venta
const textoDeEntradas = (tiposEntrada) => {
  const cupoTotal = tiposEntrada.reduce((total, tipo) => total + tipo.cupo, 0);
  const tipos = tiposEntrada.length === 1 ? "1 tipo de entrada" : `${tiposEntrada.length} tipos de entrada`;
  return `${tipos} · ${cupoTotal.toLocaleString("es-AR")} lugares`;
};

// Tarjeta de un evento en las listas (Explorar, Favoritos, Mis eventos). Recibe el evento tal como lo manda el backend.
// deOrganizador: en Mis eventos el organizador es uno mismo, así que en su lugar se muestran las entradas a la venta
export function TarjetaEvento({ evento, onPress, deOrganizador = false }) {
  const { nombre, categoria, fecha, organizador, precioDesde } = evento;
  const puntaje = organizador.puntaje ?? { promedio: null, cantidad: 0 };

  const descripcionDelPie = deOrganizador
    ? `${textoDeEntradas(evento.tiposEntrada)}${evento.realizado ? ". Ya se realizó" : ""}`
    : `Organiza ${organizador.nombre} ${organizador.apellido}, ${textoDelPuntaje(puntaje)}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      // El lector lee toda la tarjeta en una frase, en lugar de cada texto suelto
      accessibilityLabel={`${nombre}. ${categoria.nombre}, ${formatearFechaCorta(fecha)}. ${descripcionDelPie}. Desde ${formatearPrecio(
        precioDesde,
      )}`}
      className="flex-row gap-3 rounded-2xl bg-white p-3 shadow-sm active:opacity-80"
    >
      <View className="h-20 w-20 items-center justify-center rounded-xl bg-marca-claro">
        <Ionicons name={ICONO_POR_CATEGORIA[categoria.nombre] ?? "ticket"} size={30} color={COLORES.marca} />
      </View>

      <View className="flex-1 justify-between">
        <View>
          <Text className="text-xs font-semibold uppercase text-marca">{categoria.nombre}</Text>
          <Text className="text-base font-semibold text-tinta" numberOfLines={2}>
            {nombre}
          </Text>
          <Text className="text-sm text-tinta-suave">{formatearFechaCorta(fecha)}</Text>
        </View>

        <View className="mt-1 flex-row items-end justify-between gap-2">
          {/* Organizador y su reputación: estrellas según el promedio, o "Sin reseñas" si todavía no tiene */}
          {deOrganizador ? (
            <View className="flex-1 gap-1">
              <Text className="text-xs text-tinta-suave">{textoDeEntradas(evento.tiposEntrada)}</Text>
              {evento.realizado && (
                <View className="flex-row items-center gap-1 self-start rounded-full bg-gray-200 px-2 py-0.5">
                  <Ionicons name="checkmark-done" size={12} color={COLORES.tinta} />
                  <Text className="text-xs font-semibold text-tinta">Realizado</Text>
                </View>
              )}
            </View>
          ) : (
            <View className="flex-1">
              <Text className="text-xs text-tinta-suave" numberOfLines={1}>
                {organizador.nombre} {organizador.apellido}
              </Text>
              {puntaje.promedio === null ? (
                <Text className="text-xs italic text-tinta-suave">Sin reseñas</Text>
              ) : (
                <View className="flex-row items-center gap-1">
                  <Estrellas promedio={puntaje.promedio} />
                  <Text className="text-xs text-tinta-suave">({puntaje.cantidad})</Text>
                </View>
              )}
            </View>
          )}
          <Text className="text-sm font-bold text-tinta">Desde {formatearPrecio(precioDesde)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
