import { QueryClient, focusManager } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

// React Query guarda en caché lo que trae del backend y maneja solo los estados de carga y error
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Durante 30 segundos los datos se consideran frescos: volver a una pantalla no repite el pedido
      staleTime: 30 * 1000,
      // Un reintento automático si falla (por ejemplo, un corte de red momentáneo)
      retry: 1,
    },
  },
});

// En el navegador, React Query sabe cuándo la pestaña vuelve a estar activa. En el celular no:
// se le avisa cuando la app vuelve del segundo plano, para que actualice los datos (según la documentación oficial).
export function escucharFocoDeLaApp() {
  if (Platform.OS === "web") return () => {};
  const suscripcion = AppState.addEventListener("change", (estado) => {
    focusManager.setFocused(estado === "active");
  });
  return () => suscripcion.remove();
}
