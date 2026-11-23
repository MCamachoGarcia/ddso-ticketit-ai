import { useInfiniteQuery } from "@tanstack/react-query";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { TarjetaEvento } from "../../components/TarjetaEvento/TarjetaEvento";
import { ListaPaginada, paginaSiguiente } from "../../components/ListaPaginada/ListaPaginada";
import { obtenerFavoritos } from "../../services/favoritosService";

// Favoritos del comprador: los últimos que marcó primero. Reutiliza la lista y la tarjeta de Explorar.
export default function Favoritos({ navigation }) {
  // La clave empieza con "favoritos": cuando el corazón invalida ["favoritos"], esta lista se actualiza sola
  const favoritos = useInfiniteQuery({
    queryKey: ["favoritos", "lista"],
    queryFn: ({ pageParam }) => obtenerFavoritos(pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: paginaSiguiente,
  });

  return (
    <Pantalla scroll={false}>
      <ListaPaginada
        consulta={favoritos}
        renderItem={(evento) => (
          <TarjetaEvento evento={evento} onPress={() => navigation.navigate("DetalleEvento", { eventoId: evento.id })} />
        )}
        vacio={{
          icono: "heart-outline",
          titulo: "Todavía no tenés favoritos",
          mensaje: "Tocá el corazón de un evento para guardarlo acá.",
        }}
      />
    </Pantalla>
  );
}
