import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { Chip } from "../../components/Chip/Chip";
import { TarjetaEvento } from "../../components/TarjetaEvento/TarjetaEvento";
import { ListaPaginada, paginaSiguiente } from "../../components/ListaPaginada/ListaPaginada";
import { buscarEventos, obtenerCategorias } from "../../services/eventosService";
import { COLORES } from "../../styles/colores";

// Las formas de ordenar, con nombres que entiende cualquiera (el backend recibe orden y direccion)
const ORDENES = [
  { id: "proximos", texto: "Más próximos", orden: "fecha", direccion: "asc" },
  { id: "baratos", texto: "Más baratos", orden: "precio", direccion: "asc" },
  { id: "caros", texto: "Más caros", orden: "precio", direccion: "desc" },
  { id: "puntuados", texto: "Mejor puntuados", orden: "puntaje", direccion: "desc" },
];

// Explorar (C2): buscar eventos por texto, filtrar por categoría y ordenar. Lista con scroll infinito.
export default function Explorar({ navigation }) {
  // Lo que se está escribiendo y lo que efectivamente se busca son dos cosas distintas:
  // se busca recién al confirmar (por ahora; al final lo reemplaza el debounce)
  const [textoEscrito, setTextoEscrito] = useState("");
  const [textoBuscado, setTextoBuscado] = useState("");
  const [categoriaId, setCategoriaId] = useState(null);
  const [ordenId, setOrdenId] = useState("proximos");

  const { orden, direccion } = ORDENES.find((opcion) => opcion.id === ordenId);
  // Solo se mandan los filtros que tienen valor
  const filtros = {
    orden,
    direccion,
    ...(textoBuscado && { texto: textoBuscado }),
    ...(categoriaId && { categoriaId }),
  };

  const categorias = useQuery({ queryKey: ["categorias"], queryFn: obtenerCategorias, staleTime: Infinity });

  // Los filtros son parte de la clave: cuando cambian, React Query hace la búsqueda nueva solo (sin useEffect)
  const eventos = useInfiniteQuery({
    queryKey: ["eventos", filtros],
    queryFn: ({ pageParam }) => buscarEventos(filtros, pageParam),
    initialPageParam: 1,
    getNextPageParam: paginaSiguiente,
  });

  const limpiarBusqueda = () => {
    setTextoEscrito("");
    setTextoBuscado("");
  };

  return (
    <Pantalla scroll={false}>
      {/* Barra de búsqueda */}
      <View className="mb-3 min-h-11 flex-row items-center gap-2 rounded-xl border border-gray-300 bg-white px-3">
        <Ionicons name="search" size={18} color={COLORES.tintaSuave} />
        <TextInput
          value={textoEscrito}
          onChangeText={setTextoEscrito}
          onSubmitEditing={() => setTextoBuscado(textoEscrito.trim())}
          placeholder="Buscar eventos, artistas, lugares…"
          placeholderTextColor={COLORES.tintaSuave}
          returnKeyType="search"
          accessibilityLabel="Buscar eventos"
          autoCorrect={false}
          className="flex-1 py-2 text-base text-tinta"
        />
        {textoEscrito.length > 0 && (
          <Ionicons
            name="close-circle"
            size={20}
            color={COLORES.tintaSuave}
            onPress={limpiarBusqueda}
            accessibilityRole="button"
            accessibilityLabel="Borrar la búsqueda"
          />
        )}
      </View>

      {/* Categorías: una fila que se desliza hacia los costados.
          flex-grow-0 y flex-shrink-0: que ocupe solo el alto de los chips, sin estirarse ni aplastarse
          (la que crece para ocupar el resto de la pantalla es la lista) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-2 flex-shrink-0 flex-grow-0"
        contentContainerClassName="gap-2"
      >
        <Chip texto="Todas" seleccionado={categoriaId === null} onPress={() => setCategoriaId(null)} />
        {(categorias.data ?? []).map((categoria) => (
          <Chip
            key={categoria.id}
            texto={categoria.nombre}
            seleccionado={categoriaId === categoria.id}
            onPress={() => setCategoriaId(categoria.id)}
          />
        ))}
      </ScrollView>

      {/* Orden */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3 flex-shrink-0 flex-grow-0"
        contentContainerClassName="gap-2"
      >
        {ORDENES.map((opcion) => (
          <Chip key={opcion.id} texto={opcion.texto} seleccionado={ordenId === opcion.id} onPress={() => setOrdenId(opcion.id)} />
        ))}
      </ScrollView>

      <ListaPaginada
        consulta={eventos}
        renderItem={(evento) => (
          <TarjetaEvento evento={evento} onPress={() => navigation.navigate("DetalleEvento", { eventoId: evento.id })} />
        )}
        vacio={{
          icono: "search-outline",
          titulo: "No encontramos eventos",
          mensaje: "Probá con otra búsqueda o con otra categoría.",
        }}
      />
    </Pantalla>
  );
}
