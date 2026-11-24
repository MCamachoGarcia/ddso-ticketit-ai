import { useLayoutEffect, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, FlatList, KeyboardAvoidingView, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EstadoDeCarga, MensajeDeError, Vacio } from "../../components/Estados/Estados";
import { Aviso } from "../../components/Aviso/Aviso";
import { useSesion } from "../../context/SesionContext";
import { useChatEnVivo } from "../../hooks/useChatEnVivo";
import { enviarMensaje, obtenerMensajes } from "../../services/mensajesService";
import { obtenerCompra } from "../../services/comprasService";
import { mensajeError } from "../../services/errores";
import { COLORES } from "../../styles/colores";
import { BurbujaMensaje } from "./BurbujaMensaje";

const MAXIMO = 1000; // el mismo límite que el backend

// Agrega un mensaje a la página más reciente, salvo que ya esté (el propio llega por el POST y también por el WebSocket)
const agregarMensaje = (data, mensaje) => {
  if (!data || data.pages.some((pagina) => pagina.mensajes.some((m) => m.id === mensaje.id))) return data;
  const [masReciente, ...anteriores] = data.pages;
  return { ...data, pages: [{ ...masReciente, mensajes: [...masReciente.mensajes, mensaje] }, ...anteriores] };
};

/**
 * Chat de una compra (C3, O3): el comprador y el organizador del evento, en cualquier estado de la compra.
 * - El historial se pide por REST, de a 30, y al subir se cargan los anteriores.
 * - Los mensajes nuevos llegan en tiempo real por WebSocket (useChatEnVivo).
 * - Se envía por REST (POST); el WebSocket lo reparte a quienes tienen el chat abierto.
 * Recibe { compraId, titulo } (el nombre del evento, para el encabezado).
 */
export default function Chat({ route, navigation }) {
  const { compraId, titulo } = route.params;
  const { usuario } = useSesion();
  const queryClient = useQueryClient();
  const altoDelEncabezado = useHeaderHeight();
  const { bottom } = useSafeAreaInsets();
  const [texto, setTexto] = useState("");
  const clave = ["mensajes", compraId];

  // El nombre del evento en el encabezado, en lugar de "Chat"
  useLayoutEffect(() => {
    if (titulo) navigation.setOptions({ title: titulo });
  }, [navigation, titulo]);

  // La compra (para saber con quién se habla). Suele estar en caché: se viene desde su detalle.
  const compra = useQuery({ queryKey: ["compras", "detalle", compraId], queryFn: () => obtenerCompra(compraId) });

  const mensajes = useInfiniteQuery({
    queryKey: clave,
    queryFn: ({ pageParam }) => obtenerMensajes(compraId, { antes: pageParam }),
    initialPageParam: undefined,
    // La "página siguiente" son los mensajes anteriores al más viejo que ya se tiene
    getNextPageParam: (ultima) => (ultima.hayAnteriores ? ultima.mensajes[0].enviado : undefined),
  });

  const estado = useChatEnVivo(compraId, {
    alRecibir: (mensaje) => {
      queryClient.setQueryData(clave, (data) => agregarMensaje(data, mensaje));
      if (mensaje.usuario.id !== usuario.id) {
        AccessibilityInfo.announceForAccessibility(`Nuevo mensaje de ${mensaje.usuario.nombre}: ${mensaje.mensaje}`);
      }
    },
    // Si se cortó la conexión, pudieron llegar mensajes mientras tanto: se vuelve a pedir el historial
    alReconectar: () => queryClient.invalidateQueries({ queryKey: clave }),
  });

  const envio = useMutation({
    mutationFn: (contenido) => enviarMensaje(compraId, contenido),
    onSuccess: (mensaje) => {
      queryClient.setQueryData(clave, (data) => agregarMensaje(data, mensaje));
      setTexto("");
    },
  });

  const enviar = () => {
    const contenido = texto.trim();
    if (contenido && !envio.isPending) envio.mutate(contenido);
  };

  // La lista va "invertida": el más nuevo abajo, y al llegar arriba se cargan los anteriores.
  // FlatList inverted dibuja el primer elemento abajo, así que se le pasan del más nuevo al más viejo.
  const delMasNuevo = mensajes.data ? [...mensajes.data.pages].reverse().flatMap((p) => p.mensajes).reverse() : [];

  const conQuien =
    usuario.rol === "COMPRADOR"
      ? "Con el organizador del evento"
      : compra.data
        ? `Con ${compra.data.comprador.nombre} ${compra.data.comprador.apellido}`
        : "";

  let contenido;
  if (mensajes.isLoading) contenido = <EstadoDeCarga mensaje="Cargando mensajes…" />;
  else if (mensajes.error && !mensajes.data) contenido = <MensajeDeError error={mensajes.error} onReintentar={mensajes.refetch} />;
  else if (delMasNuevo.length === 0)
    contenido = (
      <Vacio
        icono="chatbubbles-outline"
        titulo="Todavía no hay mensajes"
        mensaje={
          usuario.rol === "COMPRADOR"
            ? "Escribile al organizador si tenés alguna consulta sobre tu compra."
            : "Escribile al comprador si necesitás coordinar algo de su compra."
        }
      />
    );
  else
    contenido = (
      <FlatList
        inverted
        data={delMasNuevo}
        keyExtractor={(mensaje) => mensaje.id}
        renderItem={({ item, index }) => (
          <BurbujaMensaje mensaje={item} mio={item.usuario.id === usuario.id} anterior={delMasNuevo[index + 1]} />
        )}
        contentContainerClassName="px-4 py-3"
        onEndReached={() => mensajes.hasNextPage && !mensajes.isFetchingNextPage && mensajes.fetchNextPage()}
        onEndReachedThreshold={0.3}
        // En una lista invertida, el "pie" queda arriba de todo: ahí va el indicador de los anteriores
        ListFooterComponent={
          mensajes.isFetchingNextPage ? (
            <View className="py-3">
              <ActivityIndicator color={COLORES.marca} />
            </View>
          ) : null
        }
        keyboardShouldPersistTaps="handled"
      />
    );

  return (
    // El teclado empuja la barra de escribir hacia arriba, en iOS y en Android: desde el SDK 54 Expo dibuja
    // Android "de borde a borde" y el sistema ya no achica la pantalla solo cuando aparece el teclado
    <KeyboardAvoidingView
      className="flex-1 bg-fondo"
      behavior="padding"
      keyboardVerticalOffset={altoDelEncabezado}
    >
      <BarraDeEstado estado={estado} conQuien={conQuien} />
      <View className="flex-1">{contenido}</View>

      <View className="gap-2 border-t border-gray-200 bg-white px-3 pt-2" style={{ paddingBottom: 8 + bottom }}>
        <Aviso texto={envio.error && mensajeError(envio.error)} />
        <View className="flex-row items-end gap-2">
          <TextInput
            value={texto}
            onChangeText={(valor) => {
              setTexto(valor);
              envio.reset();
            }}
            placeholder="Escribí un mensaje"
            placeholderTextColor={COLORES.tintaSuave}
            accessibilityLabel="Mensaje"
            multiline
            maxLength={MAXIMO}
            className="max-h-32 min-h-11 flex-1 rounded-2xl border border-gray-300 bg-fondo px-4 py-2 text-base text-tinta"
          />
          <Pressable
            onPress={enviar}
            disabled={!texto.trim() || envio.isPending}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            accessibilityState={{ disabled: !texto.trim() || envio.isPending, busy: envio.isPending }}
            className={`h-11 w-11 items-center justify-center rounded-full bg-marca active:opacity-80 ${
              !texto.trim() ? "opacity-40" : ""
            }`}
          >
            {envio.isPending ? <ActivityIndicator color={COLORES.blanco} /> : <Ionicons name="send" size={20} color={COLORES.blanco} />}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const ESTADOS_DE_CONEXION = {
  conectando: { texto: "Conectando…", color: "bg-amber-500" },
  "en-vivo": { texto: "En vivo", color: "bg-green-600" },
  "sin-conexion": { texto: "Sin conexión: reintentando", color: "bg-red-600" },
};

// Con quién se habla y si los mensajes nuevos llegan en tiempo real (punto de color + texto, no solo color)
function BarraDeEstado({ estado, conQuien }) {
  const { texto, color } = ESTADOS_DE_CONEXION[estado];
  return (
    <View className="flex-row items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-2">
      <Text className="flex-1 text-sm text-tinta" numberOfLines={1}>
        {conQuien}
      </Text>
      <View className="flex-row items-center gap-1" accessible accessibilityLabel={`Estado del chat: ${texto}`} accessibilityLiveRegion="polite">
        <View className={`h-2 w-2 rounded-full ${color}`} />
        <Text className="text-xs text-tinta-suave">{texto}</Text>
      </View>
    </View>
  );
}

