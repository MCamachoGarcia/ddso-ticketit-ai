import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ESTILOS = {
  error: { caja: "bg-red-50", texto: "text-red-800", icono: "alert-circle", color: "#B91C1C" },
  info: { caja: "bg-amber-50", texto: "text-amber-900", icono: "information-circle", color: "#92400E" },
};

// Un mensaje destacado con ícono y texto (nunca solo color). Se anuncia solo al lector de pantalla cuando aparece.
export function Aviso({ texto, tipo = "error" }) {
  if (!texto) return null;
  const estilo = ESTILOS[tipo];
  return (
    <View className={`flex-row items-start gap-2 rounded-xl p-3 ${estilo.caja}`} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Ionicons name={estilo.icono} size={20} color={estilo.color} />
      <Text className={`flex-1 text-sm ${estilo.texto}`}>{texto}</Text>
    </View>
  );
}
