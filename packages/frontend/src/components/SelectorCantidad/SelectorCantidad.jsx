import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORES } from "../../styles/colores";

// Botones − y + para elegir una cantidad. Más cómodo que escribir un número con el teclado del celular.
// Accesibilidad: el lector lo trata como un "ajustable" (adjustable): se sube y se baja deslizando el dedo.
export function SelectorCantidad({ valor, onCambiar, minimo = 1, etiqueta = "Cantidad" }) {
  const restar = () => valor > minimo && onCambiar(valor - 1);
  const sumar = () => onCambiar(valor + 1);

  return (
    <View
      className="flex-row items-center gap-4"
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ now: valor, min: minimo }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={({ nativeEvent }) => (nativeEvent.actionName === "increment" ? sumar() : restar())}
    >
      <BotonRedondo icono="remove" onPress={restar} deshabilitado={valor <= minimo} />
      <Text className="min-w-8 text-center text-xl font-semibold text-tinta">{valor}</Text>
      <BotonRedondo icono="add" onPress={sumar} />
    </View>
  );
}

function BotonRedondo({ icono, onPress, deshabilitado = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      // El grupo ya se anuncia como un todo: los botones no se leen por separado
      importantForAccessibility="no"
      accessibilityElementsHidden
      className={`h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white active:opacity-70 ${
        deshabilitado ? "opacity-40" : ""
      }`}
    >
      <Ionicons name={icono} size={22} color={COLORES.tinta} />
    </Pressable>
  );
}
