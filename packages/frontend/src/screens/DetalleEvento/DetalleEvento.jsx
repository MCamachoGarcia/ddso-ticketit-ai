import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { Estrellas } from "../../components/Estrellas/Estrellas";
import { BotonFavorito } from "../../components/BotonFavorito/BotonFavorito";
import { obtenerEvento } from "../../services/eventosService";
import { formatearFechaLarga, formatearHora, formatearPrecio, formatearPuntaje } from "../../utils/formato";
import { COLORES } from "../../styles/colores";

// Detalle de un evento: toda su información, los tipos de entrada y la reputación del organizador.
// Recibe el id por los parámetros de la navegación: navigation.navigate("DetalleEvento", { eventoId })
export default function DetalleEvento({ route, navigation }) {
  const { eventoId } = route.params;

  const { data: evento, isLoading, error, refetch } = useQuery({
    queryKey: ["evento", eventoId],
    queryFn: () => obtenerEvento(eventoId),
  });

  return (
    <Pantalla cargando={isLoading} error={error} onReintentar={refetch}>
      {evento && <ContenidoDelEvento evento={evento} navigation={navigation} />}
    </Pantalla>
  );
}

function ContenidoDelEvento({ evento, navigation }) {
  const { nombre, descripcion, categoria, fecha, multimedia, organizador, tiposEntrada } = evento;
  const puntaje = organizador.puntaje ?? { promedio: null, cantidad: 0 };
  // Se puede llegar a un evento que ya pasó (por ejemplo, desde una compra): se avisa
  const yaSeRealizo = new Date(fecha) <= new Date();

  const verResenias = () =>
    navigation.navigate("ReseniasOrganizador", {
      organizadorId: organizador.id,
      nombreOrganizador: `${organizador.nombre} ${organizador.apellido}`,
    });

  return (
    <View className="gap-4">
      {/* Imágenes del evento, si tiene (se deslizan hacia los costados) */}
      {multimedia.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {multimedia.map((url) => (
            <Image
              key={url}
              source={{ uri: url }}
              className="h-44 w-72 rounded-2xl bg-marca-claro"
              accessibilityLabel={`Imagen de ${nombre}`}
            />
          ))}
        </ScrollView>
      )}

      {/* Encabezado: categoría, nombre y cuándo es */}
      <View className="gap-2">
        <Text className="text-xs font-semibold uppercase text-marca">{categoria.nombre}</Text>
        {/* El corazón va al lado del nombre: así queda claro que marca ESTE evento */}
        <View className="flex-row items-start gap-2">
          <Text className="flex-1 text-2xl font-bold text-tinta" accessibilityRole="header">
            {nombre}
          </Text>
          <BotonFavorito eventoId={evento.id} />
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="calendar-outline" size={18} color={COLORES.tintaSuave} />
          <Text className="flex-1 text-base text-tinta">
            {formatearFechaLarga(fecha)} · {formatearHora(fecha)} hs
          </Text>
        </View>
      </View>

      {yaSeRealizo && (
        <View className="flex-row items-center gap-2 rounded-xl bg-gray-200 p-3">
          <Ionicons name="time-outline" size={18} color={COLORES.tinta} />
          <Text className="flex-1 text-sm text-tinta">Este evento ya se realizó.</Text>
        </View>
      )}

      <Text className="text-base leading-6 text-tinta">{descripcion}</Text>

      {/* Organizador y su reputación (C6): se puede ver antes de comprar */}
      <Pressable
        onPress={verResenias}
        accessibilityRole="button"
        accessibilityLabel={`Organiza ${organizador.nombre} ${organizador.apellido}. ${
          puntaje.promedio === null
            ? "Sin reseñas todavía"
            : `Puntaje ${formatearPuntaje(puntaje.promedio)} de 5 en ${puntaje.cantidad} ${
                puntaje.cantidad === 1 ? "reseña" : "reseñas"
              }`
        }. Ver reseñas`}
        className="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm active:opacity-80"
      >
        <View className="h-11 w-11 items-center justify-center rounded-full bg-marca-claro">
          <Text className="text-lg font-bold text-marca">{organizador.nombre[0]}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-tinta-suave">Organiza</Text>
          <Text className="text-base font-semibold text-tinta">
            {organizador.nombre} {organizador.apellido}
          </Text>
          {puntaje.promedio === null ? (
            <Text className="text-xs italic text-tinta-suave">Sin reseñas todavía</Text>
          ) : (
            <View className="flex-row items-center gap-1">
              <Estrellas promedio={puntaje.promedio} />
              <Text className="text-xs text-tinta-suave">
                {formatearPuntaje(puntaje.promedio)} ({puntaje.cantidad})
              </Text>
            </View>
          )}
        </View>
        <Text className="text-sm font-semibold text-marca">Ver reseñas</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORES.marca} />
      </Pressable>

      {/* Tipos de entrada con su precio */}
      <View className="gap-2">
        <Text className="text-lg font-semibold text-tinta" accessibilityRole="header">
          Entradas
        </Text>
        {tiposEntrada.map((tipo) => (
          <View key={tipo.id} className="flex-row items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <View className="flex-1">
              <Text className="text-base font-semibold text-tinta">{tipo.nombre}</Text>
              {tipo.descripcion ? <Text className="text-sm text-tinta-suave">{tipo.descripcion}</Text> : null}
            </View>
            <Text className="text-base font-bold text-tinta">{formatearPrecio(tipo.precio)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
