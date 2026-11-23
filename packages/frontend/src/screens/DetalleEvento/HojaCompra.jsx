import { useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HojaInferior } from "../../components/HojaInferior/HojaInferior";
import { SelectorCantidad } from "../../components/SelectorCantidad/SelectorCantidad";
import { Boton } from "../../components/Boton/Boton";
import { comprar } from "../../services/comprasService";
import { mensajeError } from "../../services/errores";
import { formatearPrecio } from "../../utils/formato";
import { COLORES } from "../../styles/colores";

/**
 * Comprar entradas (C7): elegir un tipo de entrada y la cantidad, ver el total y confirmar.
 * El cupo lo controla el backend (el comprador no ve cuántas quedan, decisión 25): si no alcanza,
 * el motivo se muestra acá mismo ("No hay cupo para 3 entrada(s) VIP: quedan 2").
 */
export function HojaCompra({ evento, visible, onCerrar, onComprado }) {
  const queryClient = useQueryClient();
  const [tipoId, setTipoId] = useState(evento.tiposEntrada[0]?.id);
  const [cantidad, setCantidad] = useState(1);

  const tipo = evento.tiposEntrada.find((t) => t.id === tipoId);
  const total = tipo ? tipo.precio * cantidad : 0;

  const compra = useMutation({
    mutationFn: () => comprar({ eventoId: evento.id, tipoEntradaId: tipoId, cantidad }),
    onSuccess: (compraCreada) => {
      // "Mis compras" cambió: se actualiza sola la próxima vez que se vea
      queryClient.invalidateQueries({ queryKey: ["compras"] });
      AccessibilityInfo.announceForAccessibility("Compra realizada. Queda pendiente de pago.");
      onComprado(compraCreada);
    },
  });

  // Al cambiar el tipo o la cantidad, el error anterior ya no aplica
  const elegirTipo = (id) => {
    setTipoId(id);
    compra.reset();
  };
  const cambiarCantidad = (nueva) => {
    setCantidad(nueva);
    compra.reset();
  };

  return (
    <HojaInferior visible={visible} titulo="Comprar entradas" onCerrar={onCerrar}>
      <Text className="text-base font-semibold text-tinta">{evento.nombre}</Text>

      {/* Tipo de entrada: una sola opción elegida, como un grupo de botones de radio */}
      <View className="gap-2" accessibilityRole="radiogroup" accessibilityLabel="Tipo de entrada">
        {evento.tiposEntrada.map((opcion) => {
          const elegida = opcion.id === tipoId;
          return (
            <Pressable
              key={opcion.id}
              onPress={() => elegirTipo(opcion.id)}
              accessibilityRole="radio"
              // aria-checked y no accessibilityState: el "checked" de accessibilityState no llega a la web
              aria-checked={elegida}
              accessibilityLabel={`${opcion.nombre}, ${formatearPrecio(opcion.precio)}`}
              className={`flex-row items-center gap-3 rounded-2xl border-2 bg-white p-4 active:opacity-80 ${
                elegida ? "border-marca" : "border-transparent"
              }`}
            >
              <Ionicons name={elegida ? "radio-button-on" : "radio-button-off"} size={22} color={elegida ? COLORES.marca : COLORES.tintaSuave} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-tinta">{opcion.nombre}</Text>
                {opcion.descripcion ? <Text className="text-sm text-tinta-suave">{opcion.descripcion}</Text> : null}
              </View>
              <Text className="text-base font-bold text-tinta">{formatearPrecio(opcion.precio)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-tinta">Cantidad</Text>
        <SelectorCantidad valor={cantidad} onCambiar={cambiarCantidad} etiqueta="Cantidad de entradas" />
      </View>

      <View className="flex-row items-center justify-between border-t border-gray-200 pt-4">
        <Text className="text-base text-tinta-suave">Total</Text>
        <Text className="text-2xl font-bold text-tinta" accessibilityLabel={`Total ${formatearPrecio(total)}`}>
          {formatearPrecio(total)}
        </Text>
      </View>

      {/* Si el backend rechaza la compra (sin cupo, evento pasado…): el motivo, con ícono y texto, no solo color */}
      {compra.error && (
        <View className="flex-row items-start gap-2 rounded-xl bg-red-50 p-3" accessibilityLiveRegion="polite" accessibilityRole="alert">
          <Ionicons name="alert-circle" size={20} color="#B91C1C" />
          <Text className="flex-1 text-sm text-red-800">{mensajeError(compra.error)}</Text>
        </View>
      )}

      <Boton onPress={() => compra.mutate()} cargando={compra.isPending} deshabilitado={!tipo}>
        {`Comprar · ${formatearPrecio(total)}`}
      </Boton>

      <Text className="text-center text-xs text-tinta-suave">
        La compra queda pendiente de pago hasta que el organizador la confirme.
      </Text>
    </HojaInferior>
  );
}
