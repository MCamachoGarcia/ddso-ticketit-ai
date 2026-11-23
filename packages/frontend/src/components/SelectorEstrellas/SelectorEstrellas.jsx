import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// El mismo ámbar que Estrellas (contraste 5:1 sobre blanco)
const COLOR_ESTRELLA = "#B45309";

// Una palabra para cada puntaje: el número solo dice poco, y así no se depende de contar estrellas
export const TEXTO_PUNTAJE = { 1: "Malo", 2: "Regular", 3: "Bueno", 4: "Muy bueno", 5: "Excelente" };

/**
 * Elegir un puntaje de 1 a 5 tocando estrellas (para reseñar). Las de mostrar están en Estrellas.
 * Para el lector de pantalla es un grupo de 5 opciones excluyentes, como botones de radio:
 * "3 estrellas, Bueno, botón de opción, seleccionado". Cada estrella es un área táctil de 44 px.
 */
export function SelectorEstrellas({ valor, onCambiar }) {
  return (
    <View className="items-center gap-1">
      <View className="flex-row" accessibilityRole="radiogroup" accessibilityLabel="Puntaje">
        {[1, 2, 3, 4, 5].map((puntaje) => (
          <Pressable
            key={puntaje}
            onPress={() => onCambiar(puntaje)}
            accessibilityRole="radio"
            // aria-checked y no accessibilityState: el "checked" de accessibilityState no llega a la web
            aria-checked={valor === puntaje}
            accessibilityLabel={`${puntaje} ${puntaje === 1 ? "estrella" : "estrellas"}, ${TEXTO_PUNTAJE[puntaje]}`}
            className="h-12 w-12 items-center justify-center active:opacity-70"
          >
            <Ionicons name={valor >= puntaje ? "star" : "star-outline"} size={34} color={COLOR_ESTRELLA} />
          </Pressable>
        ))}
      </View>
      {/* El puntaje elegido en palabras (o una indicación si todavía no eligió) */}
      <Text className="text-sm font-semibold text-tinta">{valor ? TEXTO_PUNTAJE[valor] : "Tocá las estrellas para puntuar"}</Text>
    </View>
  );
}
