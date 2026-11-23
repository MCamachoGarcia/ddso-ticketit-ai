import { ActivityIndicator, Pressable, Text } from "react-native";
import { COLORES } from "../../styles/colores";

// En React Native no hay <button>: cualquier cosa tocable es un Pressable.
// Accesibilidad (docs/accesibilidad.md): rol de botón para el lector de pantalla, al menos 44 px de alto
// y colores con contraste de 4.5:1 o más.
const ESTILOS = {
  primario: { caja: "bg-marca", texto: "text-white" },
  secundario: { caja: "bg-white border border-gray-300", texto: "text-tinta" },
  peligro: { caja: "bg-red-600", texto: "text-white" },
};

export function Boton({ children, onPress, variante = "primario", cargando = false, deshabilitado = false, className = "" }) {
  const estilo = ESTILOS[variante];
  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      className={`min-h-11 flex-row items-center justify-center rounded-xl px-5 py-3 active:opacity-80 ${estilo.caja} ${
        inactivo ? "opacity-50" : ""
      } ${className}`}
    >
      {cargando ? (
        <ActivityIndicator color={variante === "secundario" ? COLORES.tinta : COLORES.blanco} />
      ) : (
        <Text className={`text-base font-semibold ${estilo.texto}`}>{children}</Text>
      )}
    </Pressable>
  );
}
