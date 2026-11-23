import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORES } from "../styles/colores";

// Estilos compartidos por las dos navegaciones (comprador y organizador)

// Barra de título de las pantallas apiladas (las que se abren al tocar algo y tienen "atrás")
export const opcionesDePila = {
  headerTintColor: COLORES.tinta,
  headerTitleStyle: { fontWeight: "600" },
  headerShadowVisible: false,
  headerStyle: { backgroundColor: COLORES.fondo },
  headerBackButtonDisplayMode: "minimal",
};

// Barra de pestañas de abajo. Es un hook porque el alto depende del celular:
// - la etiqueta tiene lineHeight mayor que la letra; si no, las letras con "cola" (la p de Explorar) salen cortadas,
//   porque la etiqueta se limita a una línea y se recorta lo que sobresale de su caja;
// - el alto suma el área segura de abajo (la barra de gestos del iPhone): fijarlo a mano la dejaría tapada.
export function useOpcionesDePestanias() {
  const { bottom } = useSafeAreaInsets();
  return {
    ...opcionesDePila,
    tabBarActiveTintColor: COLORES.marca,
    tabBarInactiveTintColor: COLORES.tintaSuave,
    tabBarStyle: { backgroundColor: COLORES.blanco, height: 64 + bottom, paddingTop: 6, paddingBottom: 8 + bottom },
    // flexShrink 0: si falta lugar, que no sea la etiqueta la que se aplasta (su caja recorta lo que sobresale)
    tabBarLabelStyle: { fontSize: 11, lineHeight: 15, flexShrink: 0 },
  };
}

// Pantallas que usan los dos roles: se registran en las dos pilas
export const TITULOS_COMPARTIDOS = {
  DetalleCompra: "Compra",
  Chat: "Chat",
  ReseniasOrganizador: "Reseñas",
};
