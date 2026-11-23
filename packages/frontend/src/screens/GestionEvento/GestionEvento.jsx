import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { Chip } from "../../components/Chip/Chip";
import { Boton } from "../../components/Boton/Boton";
import { TarjetaCompra } from "../../components/TarjetaCompra/TarjetaCompra";
import { ListaPaginada, paginaSiguiente } from "../../components/ListaPaginada/ListaPaginada";
import { obtenerEvento } from "../../services/eventosService";
import { obtenerComprasDelEvento } from "../../services/comprasService";
import { ESTADOS_COMPRA } from "../../utils/estadosCompra";
import { formatearFechaLarga, formatearHora, formatearPuntaje } from "../../utils/formato";
import { Estrellas } from "../../components/Estrellas/Estrellas";
import { obtenerReseniasDeEvento } from "../../services/reseniasService";
import { COLORES } from "../../styles/colores";

// Gestión de un evento (O1, O2): cuántas entradas quedan de cada tipo y las compras, filtrables por estado.
// Desde acá el organizador edita el evento (si no pasó) y entra a cada compra para confirmarla, usarla o reembolsarla.
// Recibe por parámetros { eventoId, nombre } (el nombre, para mostrarlo mientras carga)
export default function GestionEvento({ route, navigation }) {
  const { eventoId } = route.params;
  const [estado, setEstado] = useState(null);

  // El evento (fecha, si ya se realizó): la misma consulta que DetalleEvento, así se comparte la caché
  const evento = useQuery({ queryKey: ["evento", eventoId], queryFn: () => obtenerEvento(eventoId) });

  // Empieza con "compras": al cambiar el estado de una compra en DetalleCompra, esta lista y la disponibilidad se actualizan
  const compras = useInfiniteQuery({
    queryKey: ["compras", "evento", eventoId, { estado }],
    queryFn: ({ pageParam }) => obtenerComprasDelEvento(eventoId, { estado }, pageParam),
    initialPageParam: 1,
    // Cada página trae { evento, disponibilidad, compras }: la paginación está en "compras"
    getNextPageParam: (ultima) => paginaSiguiente(ultima.compras),
    // Al cambiar el filtro se siguen viendo los datos anteriores hasta que llegan los nuevos (sin parpadeo)
    placeholderData: keepPreviousData,
    // ListaPaginada espera páginas con "resultados": se adaptan acá, sin tocar el componente
    select: (data) => ({
      ...data,
      disponibilidad: data.pages[0].disponibilidad,
      pages: data.pages.map((pagina) => pagina.compras),
    }),
  });

  const encabezado = evento.data && (
    <View className="mb-3 gap-4">
      <ResumenDelEvento
        evento={evento.data}
        onEditar={() => navigation.navigate("EditarEvento", { eventoId })}
        onVerResenias={() => navigation.navigate("ReseniasEvento", { eventoId, nombreEvento: evento.data.nombre })}
      />
      {compras.data && <Disponibilidad disponibilidad={compras.data.disponibilidad} />}

      <View className="gap-2">
        <Text className="text-lg font-semibold text-tinta" accessibilityRole="header">
          Compras
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Chip texto="Todas" seleccionado={estado === null} onPress={() => setEstado(null)} />
          {Object.entries(ESTADOS_COMPRA).map(([clave, { texto }]) => (
            <Chip key={clave} texto={texto} seleccionado={estado === clave} onPress={() => setEstado(clave)} />
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <Pantalla scroll={false} cargando={evento.isLoading} error={evento.error} onReintentar={evento.refetch}>
      <ListaPaginada
        consulta={compras}
        encabezado={encabezado}
        renderItem={(compra) => (
          <TarjetaCompra compra={compra} deOrganizador onPress={() => navigation.navigate("DetalleCompra", { compraId: compra.id })} />
        )}
        vacio={
          estado === null
            ? { icono: "receipt-outline", titulo: "Todavía no hay compras", mensaje: "Cuando alguien compre entradas, las vas a ver acá." }
            : { icono: "filter-outline", titulo: "No hay compras en este estado", mensaje: "Probá con otro filtro." }
        }
      />
    </Pantalla>
  );
}

// Un evento realizado ya puede tener reseñas: su puntaje y el acceso a leerlas
function AccesoAResenias({ evento, onPress }) {
  // Solo hace falta el puntaje: se pide una sola reseña. Con la misma clave base que la pantalla de reseñas.
  const { data } = useQuery({
    queryKey: ["resenias", "evento", evento.id, "puntaje"],
    queryFn: () => obtenerReseniasDeEvento(evento.id, 1, 1),
  });
  const sinResenias = !data || data.promedio === null;
  const texto = sinResenias
    ? "Sin reseñas todavía"
    : `${formatearPuntaje(data.promedio)} de 5 · ${data.cantidad} ${data.cantidad === 1 ? "reseña" : "reseñas"}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reseñas del evento: ${texto}. Ver reseñas`}
      className="min-h-11 flex-row items-center gap-2 rounded-xl border border-gray-200 p-3 active:opacity-80"
    >
      <View className="flex-1 flex-row items-center gap-2">
        {sinResenias && <Ionicons name="star-outline" size={16} color={COLORES.tintaSuave} />}
        {!sinResenias && <Estrellas promedio={data.promedio} />}
        <Text className="text-sm text-tinta">{texto}</Text>
      </View>
      <Text className="text-sm font-semibold text-marca">Ver</Text>
      <Ionicons name="chevron-forward" size={16} color={COLORES.marca} />
    </Pressable>
  );
}

function ResumenDelEvento({ evento, onEditar, onVerResenias }) {
  const realizado = new Date(evento.fecha) <= new Date();
  return (
    <View className="gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <View className="gap-1">
        <Text className="text-xs font-semibold uppercase text-marca">{evento.categoria.nombre}</Text>
        <Text className="text-xl font-bold text-tinta" accessibilityRole="header">
          {evento.nombre}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={18} color={COLORES.tintaSuave} />
        <Text className="flex-1 text-base text-tinta">
          {formatearFechaLarga(evento.fecha)} · {formatearHora(evento.fecha)} hs
        </Text>
      </View>
      {/* Un evento que ya pasó no se edita (el backend tampoco lo permite) */}
      {realizado ? (
        <>
          <View className="flex-row items-center gap-2 rounded-xl bg-gray-200 p-3">
            <Ionicons name="time-outline" size={18} color={COLORES.tinta} />
            <Text className="flex-1 text-sm text-tinta">Este evento ya se realizó: no se puede editar.</Text>
          </View>
          <AccesoAResenias evento={evento} onPress={onVerResenias} />
        </>
      ) : (
        <Boton variante="secundario" onPress={onEditar}>
          Editar evento
        </Boton>
      )}
    </View>
  );
}

// Cuántas entradas se vendieron (o están reservadas) de cada tipo, con una barra de progreso
function Disponibilidad({ disponibilidad }) {
  return (
    <View className="gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <Text className="text-lg font-semibold text-tinta" accessibilityRole="header">
        Entradas
      </Text>
      {disponibilidad.map(({ tipoEntrada, cupo, ocupadas, disponibles }) => {
        const porcentaje = cupo === 0 ? 0 : Math.round((ocupadas / cupo) * 100);
        const agotado = disponibles === 0;
        return (
          <View
            key={tipoEntrada.id}
            className="gap-1"
            // Para el lector: una barra de progreso con su valor, y el texto completo
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`${tipoEntrada.nombre}: ${ocupadas} de ${cupo} ocupadas, quedan ${disponibles}`}
            accessibilityValue={{ min: 0, max: cupo, now: ocupadas }}
          >
            <View className="flex-row justify-between gap-2">
              <Text className="flex-1 text-base text-tinta">{tipoEntrada.nombre}</Text>
              <Text className={`text-sm ${agotado ? "font-semibold text-red-700" : "text-tinta-suave"}`}>
                {agotado ? "Agotado" : `Quedan ${disponibles.toLocaleString("es-AR")}`}
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-gray-200">
              <View
                className={`h-full rounded-full ${agotado ? "bg-red-600" : "bg-marca"}`}
                // El ancho va en style porque depende de un dato. Un mínimo visible si hay alguna ocupada (aunque sea < 1 %)
                style={{ width: `${ocupadas > 0 ? Math.max(porcentaje, 2) : 0}%` }}
              />
            </View>
            <Text className="text-xs text-tinta-suave">
              {ocupadas.toLocaleString("es-AR")} de {cupo.toLocaleString("es-AR")} ocupadas
            </Text>
          </View>
        );
      })}
      <Text className="text-xs text-tinta-suave">Cuentan las compras pendientes de pago, confirmadas y utilizadas.</Text>
    </View>
  );
}
