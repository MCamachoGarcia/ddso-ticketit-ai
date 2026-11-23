import { ActivityIndicator, FlatList, View } from "react-native";
import { EstadoDeCarga, MensajeDeError, Vacio } from "../Estados/Estados";
import { COLORES } from "../../styles/colores";

/**
 * Lista que carga más al llegar al final ("scroll infinito"), para cualquier listado paginado del backend.
 * Recibe el resultado de un useInfiniteQuery de React Query y se encarga de:
 * - juntar las páginas en una sola lista;
 * - pedir la página siguiente al acercarse al final;
 * - los estados: cargando la primera vez, error con "Reintentar", lista vacía y "cargando más" al pie;
 * - deslizar hacia abajo para actualizar (pull to refresh).
 *
 * Usa FlatList y no ScrollView + map: FlatList solo dibuja lo que se ve, así una lista larga no traba el celular.
 */
// encabezado (opcional): algo que va arriba de la lista y scrollea con ella (por ejemplo, un resumen y filtros).
// Se muestra también mientras la lista carga o si falla, para que la pantalla no quede vacía.
export function ListaPaginada({ consulta, renderItem, vacio, encabezado = null }) {
  const { data, isLoading, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = consulta;

  if (isLoading || (error && !data)) {
    return (
      <View className="flex-1">
        {encabezado}
        {isLoading ? <EstadoDeCarga /> : <MensajeDeError error={error} onReintentar={refetch} />}
      </View>
    );
  }

  const items = data.pages.flatMap((pagina) => pagina.resultados);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => renderItem(item)}
      contentContainerClassName="flex-grow gap-3 pb-4"
      onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
      // Pide la página siguiente cuando falta la mitad de la pantalla para llegar al final
      onEndReachedThreshold={0.5}
      refreshing={isRefetching && !isFetchingNextPage}
      onRefresh={refetch}
      ListHeaderComponent={encabezado}
      ListEmptyComponent={<Vacio {...vacio} />}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4">
            <ActivityIndicator color={COLORES.marca} />
          </View>
        ) : null
      }
    />
  );
}

// Para pasarle a useInfiniteQuery: con la respuesta paginada del backend, cuál es la página siguiente (o ninguna)
export const paginaSiguiente = (ultima) => (ultima.page < ultima.totalPages ? ultima.page + 1 : undefined);
