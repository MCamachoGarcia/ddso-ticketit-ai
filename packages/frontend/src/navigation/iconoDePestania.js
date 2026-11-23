import { Ionicons } from "@expo/vector-icons";

// Ícono de cada pestaña: relleno cuando está activa, solo el contorno cuando no
export const iconoDePestania =
  (nombre) =>
  ({ focused, color, size }) => <Ionicons name={focused ? nombre : `${nombre}-outline`} size={size} color={color} />;
