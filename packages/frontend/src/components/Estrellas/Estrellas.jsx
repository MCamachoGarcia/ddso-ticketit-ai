import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Ámbar oscuro: como gráfico necesita 3:1 contra el fondo (WCAG 1.4.11); sobre blanco da 5:1
const COLOR_ESTRELLA = "#B45309";

// Qué ícono va en cada una de las 5 posiciones, redondeando el promedio a la media estrella más cercana.
// Ejemplo: 4.3 → 4.5 → [llena, llena, llena, llena, media]
const iconosPara = (promedio) => {
  const redondeado = Math.round(promedio * 2) / 2;
  return [1, 2, 3, 4, 5].map((posicion) => {
    if (redondeado >= posicion) return "star";
    if (redondeado >= posicion - 0.5) return "star-half";
    return "star-outline";
  });
};

/**
 * Puntaje de 1 a 5 con estrellas llenas, medias y vacías.
 * Para el lector de pantalla es una sola imagen con su valor ("Puntaje 4,3 de 5"), no cinco íconos sueltos.
 * Si no hay puntaje (promedio null), no se dibuja nada: quien lo usa decide qué mostrar en su lugar.
 */
export function Estrellas({ promedio, tamanio = 14 }) {
  if (promedio === null || promedio === undefined) return null;

  return (
    <View
      className="flex-row"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Puntaje ${promedio.toFixed(1).replace(".", ",")} de 5`}
    >
      {iconosPara(promedio).map((icono, i) => (
        <Ionicons key={i} name={icono} size={tamanio} color={COLOR_ESTRELLA} />
      ))}
    </View>
  );
}
