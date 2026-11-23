import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { BadgeEstado } from "../../components/BadgeEstado/BadgeEstado";
import { Boton } from "../../components/Boton/Boton";
import { HojaConfirmacion } from "../../components/HojaConfirmacion/HojaConfirmacion";
import { useSesion } from "../../context/SesionContext";
import { cambiarEstadoCompra, obtenerCompra } from "../../services/comprasService";
import { mensajeError } from "../../services/errores";
import { ESTADOS_COMPRA } from "../../utils/estadosCompra";
import {
  formatearDiasParaElEvento,
  formatearFechaCorta,
  formatearFechaLarga,
  formatearHora,
  formatearPrecio,
} from "../../utils/formato";
import { COLORES } from "../../styles/colores";
import { accionesDisponibles } from "./acciones";
import { HojaResenia } from "./HojaResenia";
import { TarjetaResenia } from "../../components/TarjetaResenia/TarjetaResenia";
import { obtenerReseniasDeEvento } from "../../services/reseniasService";

// Detalle de una compra (C5, O2): la comparten el comprador y el organizador del evento.
// Muestra el estado, el resumen, el chat, el historial y las acciones que le tocan a cada uno.
// Recibe el id por los parámetros de la navegación: navigation.navigate("DetalleCompra", { compraId })
export default function DetalleCompra({ route, navigation }) {
  const { compraId } = route.params;
  const { usuario } = useSesion();
  const queryClient = useQueryClient();
  // La acción que se está por confirmar (null si no hay ninguna hoja abierta)
  const [accionElegida, setAccionElegida] = useState(null);

  const clave = ["compras", "detalle", compraId];
  const { data: compra, isLoading, error, refetch } = useQuery({ queryKey: clave, queryFn: () => obtenerCompra(compraId) });

  const cambio = useMutation({
    mutationFn: (accion) => cambiarEstadoCompra(compraId, accion),
    onSuccess: (compraActualizada) => {
      // La respuesta ya es la compra nueva: se guarda directo en la caché, sin volver a pedirla
      queryClient.setQueryData(clave, compraActualizada);
      // Las listas de compras (Mis compras, las compras del evento) cambiaron
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      AccessibilityInfo.announceForAccessibility(`Listo. La compra quedó ${ESTADOS_COMPRA[compraActualizada.estado].texto.toLowerCase()}.`);
      setAccionElegida(null);
    },
    // Si el backend la rechaza, probablemente la compra cambió mientras se miraba (por ejemplo, la otra parte la
    // canceló): se vuelve a pedir para que la pantalla muestre su estado real. El motivo queda en la hoja.
    onError: () => queryClient.invalidateQueries({ queryKey: ["compras"] }),
  });

  const acciones = compra ? accionesDisponibles(compra, usuario.rol) : [];

  // Reseñar (C5): el comprador, cuando ya usó las entradas. No hay un endpoint de "mi reseña": se buscan las
  // reseñas del evento (son pocas; se piden hasta 50, el máximo) y se mira si alguna es suya.
  const [reseniando, setReseniando] = useState(false);
  const puedeReseniar = usuario.rol === "COMPRADOR" && compra?.estado === "UTILIZADA";
  const reseniasDelEvento = useQuery({
    queryKey: ["resenias", "evento", compra?.evento.id, "todas"],
    queryFn: () => obtenerReseniasDeEvento(compra.evento.id, 1, 50),
    enabled: puedeReseniar,
  });
  const miResenia = reseniasDelEvento.data?.resenias.resultados.find((resenia) => resenia.comprador.id === usuario.id);
  const mostrarReseniar = puedeReseniar && reseniasDelEvento.isSuccess && !miResenia;

  const elegir = (accion) => {
    cambio.reset(); // que no quede el error de un intento anterior
    setAccionElegida(accion);
  };

  return (
    <Pantalla
      cargando={isLoading}
      error={error}
      onReintentar={refetch}
      pie={
        (acciones.length > 0 || mostrarReseniar) && (
          <View className="gap-2">
            {acciones.map((accion) => (
              <Boton key={accion.accion} variante={accion.variante} onPress={() => elegir(accion)}>
                {accion.texto}
              </Boton>
            ))}
            {mostrarReseniar && <Boton onPress={() => setReseniando(true)}>Reseñar el evento</Boton>}
          </View>
        )
      }
    >
      {compra && (
        <>
          <ContenidoDeLaCompra compra={compra} rol={usuario.rol} navigation={navigation} miResenia={miResenia} />
          {puedeReseniar && <HojaResenia evento={compra.evento} visible={reseniando} onCerrar={() => setReseniando(false)} />}
          <HojaConfirmacion
            visible={accionElegida !== null}
            titulo={accionElegida ? `¿${accionElegida.texto}?` : ""}
            mensaje={accionElegida?.confirmacion(compra)}
            textoConfirmar={accionElegida ? `Sí, ${accionElegida.texto.toLowerCase()}` : ""}
            variante={accionElegida?.variante}
            cargando={cambio.isPending}
            error={cambio.error ? mensajeError(cambio.error) : null}
            onConfirmar={() => cambio.mutate(accionElegida.accion)}
            onCerrar={() => setAccionElegida(null)}
          />
        </>
      )}
    </Pantalla>
  );
}

// Qué significa el estado para quien mira la compra
const EXPLICACION = {
  COMPRADOR: {
    PENDIENTE_DE_PAGO: "Tus entradas están reservadas. El organizador confirma la compra cuando recibe el pago.",
    CONFIRMADA: "Pago confirmado: tus entradas están listas para el evento.",
    UTILIZADA: "Ya usaste estas entradas.",
    CANCELADA: "La compra se canceló y las entradas se liberaron.",
    REEMBOLSADA: "El organizador te devolvió el dinero.",
  },
  ORGANIZADOR: {
    PENDIENTE_DE_PAGO: "Cuando recibas el pago, confirmalo para que las entradas queden firmes.",
    CONFIRMADA: "Pago recibido. Desde que empieza el evento podés marcar las entradas como utilizadas.",
    UTILIZADA: "Las entradas ya se usaron en el evento.",
    CANCELADA: "El comprador canceló la compra y las entradas se liberaron.",
    REEMBOLSADA: "Le devolviste el dinero al comprador.",
  },
};

function ContenidoDeLaCompra({ compra, rol, navigation, miResenia }) {
  const { evento, tipoEntrada, cantidad, precioUnitario, total, estado, comprador, historial } = compra;
  const faltan = formatearDiasParaElEvento(compra.diasParaElEvento);
  const esComprador = rol === "COMPRADOR";
  // En el chat se habla con la otra parte de la compra
  const textoChat = esComprador ? "Chat con el organizador" : `Chat con ${comprador.nombre} ${comprador.apellido}`;
  // El más reciente arriba
  const cambios = [...historial].reverse();

  return (
    <View className="gap-4">
      {/* Evento y estado */}
      <View className="gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-xl font-bold text-tinta" accessibilityRole="header">
            {evento.nombre}
          </Text>
          <BadgeEstado estado={estado} />
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="calendar-outline" size={18} color={COLORES.tintaSuave} />
          <Text className="flex-1 text-base text-tinta">
            {formatearFechaLarga(evento.fecha)} · {formatearHora(evento.fecha)} hs
          </Text>
        </View>
        {faltan && (
          <View className="flex-row items-center gap-2">
            <Ionicons name="hourglass-outline" size={18} color={COLORES.marca} />
            <Text className="text-base font-semibold text-marca">{faltan}</Text>
          </View>
        )}
        <Text className="text-sm leading-5 text-tinta-suave">{EXPLICACION[rol][estado]}</Text>
        {/* El comprador puede volver al evento (el organizador lo gestiona desde Mis eventos) */}
        {esComprador && (
          <Pressable
            onPress={() => navigation.navigate("DetalleEvento", { eventoId: evento.id })}
            accessibilityRole="link"
            className="min-h-11 flex-row items-center gap-1 self-start active:opacity-70"
          >
            <Text className="text-sm font-semibold text-marca">Ver el evento</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORES.marca} />
          </Pressable>
        )}
      </View>

      {/* Resumen de la compra */}
      <View className="gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="text-lg font-semibold text-tinta" accessibilityRole="header">
          Resumen
        </Text>
        {!esComprador && <Fila etiqueta="Comprador" valor={`${comprador.nombre} ${comprador.apellido}`} />}
        <Fila etiqueta="Entrada" valor={tipoEntrada.nombre} />
        <Fila etiqueta="Cantidad" valor={String(cantidad)} />
        <Fila etiqueta="Precio por entrada" valor={formatearPrecio(precioUnitario)} />
        <View className="mt-1 flex-row items-center justify-between border-t border-gray-100 pt-3">
          <Text className="text-base text-tinta-suave">Total</Text>
          <Text className="text-xl font-bold text-tinta">{formatearPrecio(total)}</Text>
        </View>
      </View>

      {/* Si ya reseñó el evento, su reseña (en lugar del botón "Reseñar") */}
      {miResenia && (
        <View className="gap-2">
          <Text className="text-lg font-semibold text-tinta" accessibilityRole="header">
            Tu reseña
          </Text>
          <TarjetaResenia resenia={miResenia} />
        </View>
      )}

      {/* Chat con la otra parte: se puede escribir en cualquier estado */}
      <Pressable
        onPress={() => navigation.navigate("Chat", { compraId: compra.id, titulo: evento.nombre })}
        accessibilityRole="button"
        accessibilityLabel={textoChat}
        className="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm active:opacity-80"
      >
        <View className="h-11 w-11 items-center justify-center rounded-full bg-marca-claro">
          <Ionicons name="chatbubbles-outline" size={22} color={COLORES.marca} />
        </View>
        <Text className="flex-1 text-base font-semibold text-tinta">{textoChat}</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORES.tintaSuave} />
      </Pressable>

      {/* Historial: cada cambio de estado, quién lo hizo y cuándo */}
      <View className="gap-1 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="mb-2 text-lg font-semibold text-tinta" accessibilityRole="header">
          Historial
        </Text>
        {cambios.map((cambio, indice) => {
          const { texto, icono, color } = ESTADOS_COMPRA[cambio.estado];
          const actual = indice === 0;
          return (
            <View
              key={`${cambio.estado}-${cambio.fechaHora}`}
              className="flex-row gap-3"
              // El lector lee cada paso en una frase
              accessible
              accessibilityLabel={`${texto}, ${formatearFechaCorta(cambio.fechaHora)} hs, por ${cambio.quien.nombre} ${
                cambio.quien.apellido
              }`}
            >
              {/* Ícono y la línea que lo une con el paso anterior */}
              <View className="items-center">
                <Ionicons name={icono} size={22} color={actual ? color : COLORES.tintaSuave} />
                {indice < cambios.length - 1 && <View className="my-1 w-0.5 flex-1 bg-gray-200" />}
              </View>
              <View className="flex-1 pb-3">
                <Text className={`text-base text-tinta ${actual ? "font-semibold" : ""}`}>{texto}</Text>
                <Text className="text-sm text-tinta-suave">
                  {formatearFechaCorta(cambio.fechaHora)} · {cambio.quien.nombre} {cambio.quien.apellido}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Fila({ etiqueta, valor }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-base text-tinta-suave">{etiqueta}</Text>
      <Text className="flex-1 text-right text-base text-tinta">{valor}</Text>
    </View>
  );
}
