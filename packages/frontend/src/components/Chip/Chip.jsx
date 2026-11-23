import { Pressable, Text } from "react-native";

// Una opción que se puede elegir, con forma de píldora (por ejemplo, una categoría o un orden).
// Accesibilidad: el lector anuncia "botón, Música, seleccionado"; el estado no depende solo del color.
export function Chip({ texto, seleccionado = false, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionado }}
      className={`min-h-11 justify-center rounded-full border px-4 active:opacity-80 ${
        seleccionado ? "border-marca bg-marca" : "border-gray-300 bg-white"
      }`}
    >
      <Text className={`text-sm font-medium ${seleccionado ? "text-white" : "text-tinta"}`}>{texto}</Text>
    </Pressable>
  );
}
