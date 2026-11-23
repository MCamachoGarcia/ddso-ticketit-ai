import { ActivityIndicator, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { marcarFavorito, obtenerFavoritos, quitarFavorito } from "../../services/favoritosService";
import { COLORES } from "../../styles/colores";

// Rojo accesible para el corazón marcado (como gráfico pide 3:1; sobre el fondo da más de 4.5:1)
const ROJO_CORAZON = "#DC2626";

/**
 * Corazón para marcar o quitar un evento de favoritos (decisión 29).
 * Para saber si ya es favorito, usa la lista de favoritos del comprador, que React Query guarda en caché:
 * todas las pantallas comparten la misma lista, y al marcar o quitar se actualiza en todas.
 * (Cuando la búsqueda traiga esFavorito, ver pendientes.md, esto se puede simplificar.)
 */
export function BotonFavorito({ eventoId }) {
  const queryClient = useQueryClient();

  const favoritos = useQuery({ queryKey: ["favoritos"], queryFn: () => obtenerFavoritos() });
  const esFavorito = favoritos.data?.resultados.some((evento) => evento.id === eventoId) ?? false;

  const cambiar = useMutation({
    mutationFn: () => (esFavorito ? quitarFavorito(eventoId) : marcarFavorito(eventoId)),
    // Los favoritos cambiaron. Invalidar ["favoritos"] alcanza a toda clave que empiece así:
    // esta lista y la de la pestaña Favoritos (["favoritos", "lista"]). Las dos se actualizan solas.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favoritos"] }),
  });

  const ocupado = favoritos.isLoading || cambiar.isPending;

  return (
    <Pressable
      onPress={() => cambiar.mutate()}
      disabled={ocupado}
      // Solo un ícono: necesita un nombre para el lector de pantalla (regla 8 de accesibilidad)
      accessibilityRole="button"
      accessibilityLabel={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
      accessibilityState={{ selected: esFavorito, busy: ocupado }}
      className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-60"
    >
      {ocupado ? (
        <ActivityIndicator color={COLORES.tintaSuave} />
      ) : (
        <Ionicons name={esFavorito ? "heart" : "heart-outline"} size={26} color={esFavorito ? ROJO_CORAZON : COLORES.tinta} />
      )}
    </Pressable>
  );
}
