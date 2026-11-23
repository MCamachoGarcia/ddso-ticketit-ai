import { ActivityIndicator, Pressable, Text } from "react-native";
import { COLORES } from "../../styles/colores";

// En React Native no hay <button>: cualquier cosa tocable es un Pressable
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
      className={`flex-row items-center justify-center rounded-xl px-5 py-3 active:opacity-80 ${estilo.caja} ${
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
