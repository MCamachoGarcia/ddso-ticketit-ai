import { ScrollView, View } from "react-native";
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

  let contenido = children;
  if (cargando) contenido = <EstadoDeCarga />;
  else if (error) contenido = <MensajeDeError error={error} onReintentar={onReintentar} />;

  const cuerpo = scroll ? (
    <ScrollView className="flex-1" contentContainerClassName="flex-grow p-4" keyboardShouldPersistTaps="handled">
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

  return sinEncabezado ? (
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
}
