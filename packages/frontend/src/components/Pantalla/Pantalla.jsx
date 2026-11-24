import { useContext } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { HeaderHeightContext } from "@react-navigation/elements";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { EstadoDeCarga, MensajeDeError } from "../Estados/Estados";

/**
 * Layout general de todas las pantallas: el equivalente del layout del TP.
 * Recibe el contenido como children y se encarga de lo que se repite en todas:
 * - el fondo y los márgenes;
 * - el scroll (en las pantallas con listas se desactiva, porque la lista ya scrollea);
 * - los estados: mientras `cargando`, muestra el indicador; si hay `error`, el mensaje con "Reintentar".
 *
 * sinEncabezado: para pantallas sin la barra de título de la navegación (por ejemplo, Ingresar).
 * Deja libre la zona de la cámara y la barra de estado del celular (el "área segura").
 *
 * pie: algo fijo abajo de todo que no scrollea (por ejemplo, el botón "Comprar entradas").
 * Respeta el área segura de abajo (la barra de gestos del iPhone).
 */
export function Pantalla({ children, cargando = false, error = null, onReintentar, scroll = true, sinEncabezado = false, pie }) {
  const { bottom } = useSafeAreaInsets();
  // Cuánto ocupa la barra de título de la navegación (0 si no hay): el teclado se mide desde arriba de la pantalla
  const altoDelEncabezado = useContext(HeaderHeightContext) ?? 0;

  let contenido = children;
  if (cargando) contenido = <EstadoDeCarga />;
  else if (error) contenido = <MensajeDeError error={error} onReintentar={onReintentar} />;

  const cuerpo = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName="flex-grow p-4"
      keyboardShouldPersistTaps="handled"
      // iOS: al abrirse el teclado deja lugar abajo, para poder llegar a los últimos campos de un formulario
      automaticallyAdjustKeyboardInsets
    >
      {contenido}
    </ScrollView>
  ) : (
    <View className="flex-1 p-4">{contenido}</View>
  );

  // El pie solo se muestra cuando la pantalla tiene sus datos (no mientras carga ni con error)
  const conPie = pie && !cargando && !error && (
    <View className="border-t border-gray-200 bg-white px-4 pt-3" style={{ paddingBottom: 12 + bottom }}>
      {pie}
    </View>
  );

  const pantalla = sinEncabezado ? (
    <SafeAreaView className="flex-1 bg-fondo" edges={["top"]}>
      {cuerpo}
      {conPie}
    </SafeAreaView>
  ) : (
    <View className="flex-1 bg-fondo">
      {cuerpo}
      {conPie}
    </View>
  );

  // Android dibuja la app "de borde a borde" (Expo SDK 54+): el sistema ya no achica la pantalla cuando aparece
  // el teclado, así que se deja lugar a mano para que no tape los campos ni el pie. En iOS ya lo hace el ScrollView.
  if (Platform.OS !== "android") return pantalla;
  return (
    <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={altoDelEncabezado} className="flex-1 bg-fondo">
      {pantalla}
    </KeyboardAvoidingView>
  );
}
