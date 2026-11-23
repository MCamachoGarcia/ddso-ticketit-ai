import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HojaInferior } from "../HojaInferior/HojaInferior";
import { Boton } from "../Boton/Boton";

/**
 * Pedir confirmación antes de una acción que no se puede deshacer (cancelar una compra, reembolsarla…).
 * Se usa una hoja y no Alert.alert: Alert no funciona en la versión web, y así el error del backend
 * se muestra en el mismo lugar, sin cerrar nada.
 */
export function HojaConfirmacion({
  visible,
  titulo,
  mensaje,
  textoConfirmar,
  variante = "primario",
  cargando = false,
  error,
  onConfirmar,
  onCerrar,
}) {
  return (
    <HojaInferior visible={visible} titulo={titulo} onCerrar={onCerrar}>
      <Text className="text-base leading-6 text-tinta">{mensaje}</Text>

      {error && (
        <View className="flex-row items-start gap-2 rounded-xl bg-red-50 p-3" accessibilityLiveRegion="polite" accessibilityRole="alert">
          <Ionicons name="alert-circle" size={20} color="#B91C1C" />
          <Text className="flex-1 text-sm text-red-800">{error}</Text>
        </View>
      )}

      <View className="gap-2">
        <Boton variante={variante} onPress={onConfirmar} cargando={cargando}>
          {textoConfirmar}
        </Boton>
        <Boton variante="secundario" onPress={onCerrar} deshabilitado={cargando}>
          Volver
        </Boton>
      </View>
    </HojaInferior>
  );
}
