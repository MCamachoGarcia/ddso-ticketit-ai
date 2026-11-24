import { KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORES } from "../../styles/colores";

/**
 * Hoja que sube desde abajo por encima de la pantalla (en inglés, "bottom sheet"): para una tarea corta
 * sin cambiar de pantalla, como comprar o reseñar. Se cierra con la X, tocando el fondo oscuro o con
 * el botón "atrás" de Android.
 *
 * Usa Modal, el componente de React Native para mostrar algo por encima de todo lo demás.
 */
export function HojaInferior({ visible, titulo, onCerrar, children }) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      {/* Si se abre el teclado, la hoja sube para que no tape los campos (en iOS y en Android, que es "de borde a borde") */}
      <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
        {/* El fondo oscuro: tocarlo cierra la hoja */}
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={onCerrar}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />

        <View className="max-h-[85%] rounded-t-3xl bg-fondo" style={{ paddingBottom: bottom }} accessibilityViewIsModal>
          <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
            <Text className="flex-1 text-lg font-semibold text-tinta" accessibilityRole="header">
              {titulo}
            </Text>
            <Pressable
              onPress={onCerrar}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              className="h-11 w-11 items-center justify-center rounded-full active:bg-gray-200"
            >
              <Ionicons name="close" size={24} color={COLORES.tinta} />
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
