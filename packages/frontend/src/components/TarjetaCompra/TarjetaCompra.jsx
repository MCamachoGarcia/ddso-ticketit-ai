import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BadgeEstado } from "../BadgeEstado/BadgeEstado";
import { ESTADOS_COMPRA } from "../../utils/estadosCompra";
import { formatearDiasParaElEvento, formatearFechaCorta, formatearPrecio } from "../../utils/formato";
import { COLORES } from "../../styles/colores";

// Tarjeta de una compra en las listas (Mis compras). Recibe la compra tal como la manda el backend.
export function TarjetaCompra({ compra, onPress }) {
  const { evento, tipoEntrada, cantidad, total, estado, diasParaElEvento } = compra;
  const faltan = formatearDiasParaElEvento(diasParaElEvento);
  const entradas = `${cantidad} ${cantidad === 1 ? "entrada" : "entradas"} ${tipoEntrada.nombre}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${evento.nombre}, ${formatearFechaCorta(evento.fecha)} hs. ${entradas}, total ${formatearPrecio(
        total,
      )}. ${ESTADOS_COMPRA[estado].texto}${faltan ? `. ${faltan}` : ""}`}
      className="gap-2 rounded-2xl bg-white p-4 shadow-sm active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-tinta" numberOfLines={2}>
          {evento.nombre}
        </Text>
        <BadgeEstado estado={estado} />
      </View>

      <View className="flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={16} color={COLORES.tintaSuave} />
        <Text className="flex-1 text-sm text-tinta-suave">{formatearFechaCorta(evento.fecha)}</Text>
        {/* Cuenta regresiva: solo para las compras confirmadas de eventos que todavía no pasaron */}
        {faltan && <Text className="text-sm font-semibold text-marca">{faltan}</Text>}
      </View>

      <View className="flex-row items-center justify-between gap-2 border-t border-gray-100 pt-2">
        <Text className="flex-1 text-sm text-tinta">{entradas}</Text>
        <Text className="text-base font-bold text-tinta">{formatearPrecio(total)}</Text>
      </View>
    </Pressable>
  );
}
