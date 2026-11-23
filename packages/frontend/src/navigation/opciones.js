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

// Barra de pestañas de abajo
export const opcionesDePestanias = {
  ...opcionesDePila,
  tabBarActiveTintColor: COLORES.marca,
  tabBarInactiveTintColor: COLORES.tintaSuave,
  tabBarStyle: { backgroundColor: COLORES.blanco },
};

// Pantallas que usan los dos roles: se registran en las dos pilas
export const TITULOS_COMPARTIDOS = {
  DetalleCompra: "Compra",
  Chat: "Chat",
  ReseniasOrganizador: "Reseñas",
};
