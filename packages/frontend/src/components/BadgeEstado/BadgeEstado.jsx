import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ESTADOS_COMPRA } from "../../utils/estadosCompra";

// Etiqueta con el estado de una compra: color, ícono y texto (el color solo no alcanza para quien no distingue colores)
export function BadgeEstado({ estado }) {
  const { texto, icono, clases, color } = ESTADOS_COMPRA[estado];
  return (
    <View
      className={`flex-row items-center gap-1 self-start rounded-full px-2 py-1 ${clases.fondo}`}
      // El lector de pantalla lee "Estado: Confirmada" y no anuncia el ícono por separado
      accessible
      accessibilityLabel={`Estado: ${texto}`}
    >
      <Ionicons name={icono} size={14} color={color} />
      <Text className={`text-xs font-semibold ${clases.texto}`}>{texto}</Text>
    </View>
  );
}
