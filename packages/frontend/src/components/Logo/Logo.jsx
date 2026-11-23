import { Text, View } from "react-native";

// El logo usa el verde vivo de la marca: WCAG exceptúa a los logos del contraste.
// Para el lector de pantalla es un solo título con el nombre completo.
export function Logo() {
  return (
    <View className="items-center gap-2 pb-6 pt-8" accessible accessibilityRole="header" accessibilityLabel="AI Ticket It, entradas a un click">
      <View className="rounded-2xl bg-marca-vivo px-5 py-3">
        <Text className="text-3xl font-extrabold text-white">AI</Text>
      </View>
      <Text className="text-3xl font-extrabold text-tinta">
        Ticket <Text className="text-marca-vivo">It</Text>
      </Text>
      <Text className="tracking-widest text-tinta-suave">ENTRADAS A UN CLICK</Text>
    </View>
  );
}
