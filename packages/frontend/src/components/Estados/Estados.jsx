import { ActivityIndicator, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Boton } from "../Boton/Boton";
import { normalizarError } from "../../services/errores";
import { COLORES } from "../../styles/colores";

// Los estados de una pantalla además de "con datos" (clase 10): cargando, error y vacío.
// Si el usuario no sabe en cuál está, piensa que la app se colgó.

export function EstadoDeCarga({ mensaje = "Cargando…" }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 py-16">
      <ActivityIndicator size="large" color={COLORES.marca} />
      <Text className="text-tinta-suave">{mensaje}</Text>
    </View>
  );
}

// Recibe el error tal como llegó (de axios) y lo traduce con normalizarError, como en el TP
export function MensajeDeError({ error, onReintentar }) {
  const { titulo, mensaje, detalles, reintentable } = normalizarError(error);
  return (
    <View className="flex-1 items-center justify-center gap-2 px-6 py-16">
      <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
      <Text className="text-lg font-semibold text-tinta">{titulo}</Text>
      <Text className="text-center text-tinta-suave">{mensaje}</Text>
      {detalles.map(({ campo, mensaje: detalle }) => (
        <Text key={`${campo}-${detalle}`} className="text-center text-sm text-tinta-suave">
          • {detalle}
        </Text>
      ))}
      {reintentable && onReintentar && (
        <Boton variante="secundario" className="mt-3" onPress={onReintentar}>
          Reintentar
        </Boton>
      )}
    </View>
  );
}

export function Vacio({ icono = "file-tray-outline", titulo, mensaje, children }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-6 py-16">
      <Ionicons name={icono} size={40} color={COLORES.tintaSuave} />
      <Text className="text-lg font-semibold text-tinta">{titulo}</Text>
      {mensaje && <Text className="text-center text-tinta-suave">{mensaje}</Text>}
      {children}
    </View>
  );
}
