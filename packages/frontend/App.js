import "./global.css";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { SesionProvider } from "./src/context/SesionContext";
import { NavegacionPrincipal } from "./src/navigation/NavegacionPrincipal";
import { escucharFocoDeLaApp, queryClient } from "./src/services/queryClient";

// Punto de entrada: arma los "proveedores" que usan todas las pantallas, de afuera hacia adentro:
// - SafeAreaProvider: conoce el área segura del celular (notch, barra de estado, gestos)
// - QueryClientProvider: la caché de React Query
// - SesionProvider: quién está usando la app
// - NavigationContainer: la navegación entre pantallas (en el TP, el BrowserRouter)
// Título de la pestaña del navegador (solo en la versión web): "Mis compras · AI Ticket It"
const tituloEnLaWeb = {
  formatter: (opciones, ruta) => {
    const pantalla = opciones?.title ?? ruta?.name;
    return pantalla ? `${pantalla} · AI Ticket It` : "AI Ticket It";
  },
};

export default function App() {
  useEffect(() => escucharFocoDeLaApp(), []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SesionProvider>
          <NavigationContainer documentTitle={tituloEnLaWeb}>
            <NavegacionPrincipal />
          </NavigationContainer>
        </SesionProvider>
      </QueryClientProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
