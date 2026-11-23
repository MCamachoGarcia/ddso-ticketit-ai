import { Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORES } from "../../styles/colores";

/**
 * Un campo de formulario: etiqueta visible arriba, el TextInput y, si hay, el error abajo.
 * En React Native no hay <label for>: la etiqueta se le da al lector con accessibilityLabel,
 * y el error se suma a la descripción (accessibilityHint) para que también lo escuche.
 *
 * accesorio (opcional): algo a la derecha, dentro del borde del campo (por ejemplo, "mostrar contraseña").
 * El resto de las props van directo al TextInput (placeholder, keyboardType, multiline, secureTextEntry…).
 */
export function Campo({ etiqueta, valor, onCambiar, error, ayuda, opcional = false, multiline = false, accesorio, ...props }) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-semibold text-tinta">
        {etiqueta}
        {opcional && <Text className="font-normal text-tinta-suave"> (opcional)</Text>}
      </Text>
      <View
        className={`min-h-11 flex-row items-center rounded-xl border bg-white ${multiline ? "min-h-24 items-start" : ""} ${
          error ? "border-red-600" : "border-gray-300"
        }`}
      >
        <TextInput
          value={valor}
          onChangeText={onCambiar}
          accessibilityLabel={etiqueta}
          accessibilityHint={error ? `Error: ${error}` : ayuda}
          placeholderTextColor={COLORES.tintaSuave}
          multiline={multiline}
          // En Android un campo de varias líneas arranca con el texto centrado: se lo sube arriba
          textAlignVertical={multiline ? "top" : "center"}
          className={`flex-1 px-3 py-2 text-base text-tinta ${multiline ? "min-h-24" : ""}`}
          {...props}
        />
        {accesorio}
      </View>
      {/* El error con ícono y texto, no solo el borde rojo (accesibilidad) */}
      {error ? (
        <View className="flex-row items-start gap-1">
          <Ionicons name="alert-circle" size={16} color="#B91C1C" />
          <Text className="flex-1 text-sm text-red-700">{error}</Text>
        </View>
      ) : ayuda ? (
        <Text className="text-xs text-tinta-suave">{ayuda}</Text>
      ) : null}
    </View>
  );
}
