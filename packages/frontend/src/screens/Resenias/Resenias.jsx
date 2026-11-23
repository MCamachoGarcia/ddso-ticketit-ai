import { Text, View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { Estrellas } from "../../components/Estrellas/Estrellas";
import { TarjetaResenia } from "../../components/TarjetaResenia/TarjetaResenia";
import { ListaPaginada, paginaSiguiente } from "../../components/ListaPaginada/ListaPaginada";
import { obtenerReseniasDeEvento, obtenerReseniasDeOrganizador } from "../../services/reseniasService";
import { formatearPuntaje } from "../../utils/formato";

/**
 * Reseñas con su puntaje promedio, las más recientes primero. Una sola pantalla para dos casos:
 * - de un organizador (C6), desde el detalle de un evento: { organizadorId, nombreOrganizador }.
 *   Cada reseña dice de qué evento es.
 * - de un evento (O1), desde la gestión de un evento realizado: { eventoId, nombreEvento }.
 */
export default function Resenias({ route }) {
  const { organizadorId, nombreOrganizador, eventoId, nombreEvento } = route.params;
  const deOrganizador = Boolean(organizadorId);

  const resenias = useInfiniteQuery({
    queryKey: deOrganizador ? ["resenias", "organizador", organizadorId] : ["resenias", "evento", eventoId],
    queryFn: ({ pageParam }) =>
      deOrganizador ? obtenerReseniasDeOrganizador(organizadorId, pageParam) : obtenerReseniasDeEvento(eventoId, pageParam),
    initialPageParam: 1,
    // Cada página trae { promedio, cantidad, resenias }: la paginación está en "resenias"
    getNextPageParam: (ultima) => paginaSiguiente(ultima.resenias),
    // Se adapta a lo que espera ListaPaginada (páginas con "resultados") y se guarda el puntaje de la primera
    select: (data) => ({
      ...data,
      puntaje: { promedio: data.pages[0].promedio, cantidad: data.pages[0].cantidad },
      pages: data.pages.map((pagina) => pagina.resenias),
    }),
  });

  const encabezado = (
    <Resumen titulo={deOrganizador ? nombreOrganizador : nombreEvento} puntaje={resenias.data?.puntaje} deOrganizador={deOrganizador} />
  );

  return (
    <Pantalla scroll={false}>
      <ListaPaginada
        consulta={resenias}
        encabezado={encabezado}
        renderItem={(resenia) => <TarjetaResenia resenia={resenia} mostrarEvento={deOrganizador} />}
        vacio={{
          icono: "chatbubble-ellipses-outline",
          titulo: "Todavía no hay reseñas",
          mensaje: deOrganizador
            ? "Las reseñas aparecen cuando los compradores van a sus eventos y cuentan qué les pareció."
            : "Las reseñas las escriben los compradores que usaron sus entradas.",
        }}
      />
    </Pantalla>
  );
}

// Arriba de todo: de quién son las reseñas y el promedio grande
function Resumen({ titulo, puntaje, deOrganizador }) {
  const tienePuntaje = puntaje && puntaje.promedio !== null;
  return (
    <View className="mb-3 items-center gap-1 rounded-2xl bg-white p-5 shadow-sm">
      <Text className="text-xs font-semibold uppercase text-tinta-suave">{deOrganizador ? "Organizador" : "Evento"}</Text>
      <Text className="text-center text-xl font-bold text-tinta" accessibilityRole="header">
        {titulo}
      </Text>
      {tienePuntaje ? (
        <View
          className="items-center gap-1"
          accessible
          accessibilityLabel={`Puntaje promedio ${formatearPuntaje(puntaje.promedio)} de 5, en ${puntaje.cantidad} ${
            puntaje.cantidad === 1 ? "reseña" : "reseñas"
          }`}
        >
          <Text className="text-4xl font-bold text-tinta">{formatearPuntaje(puntaje.promedio)}</Text>
          <Estrellas promedio={puntaje.promedio} tamanio={22} />
          <Text className="text-sm text-tinta-suave">
            {puntaje.cantidad} {puntaje.cantidad === 1 ? "reseña" : "reseñas"}
          </Text>
        </View>
      ) : (
        puntaje && <Text className="text-sm italic text-tinta-suave">Sin reseñas todavía</Text>
      )}
    </View>
  );
}
