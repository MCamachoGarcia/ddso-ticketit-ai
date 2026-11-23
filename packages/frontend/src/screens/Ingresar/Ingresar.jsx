import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { USUARIOS_DEMO, useSesion } from "../../context/SesionContext";
import { COLORES } from "../../styles/colores";

const GRUPOS = [
  { rol: "COMPRADOR", titulo: "Como comprador", icono: "ticket-outline" },
  { rol: "ORGANIZADOR", titulo: "Como organizador", icono: "calendar-outline" },
];

// PROVISORIO hasta el login (decisión 23): se elige con qué usuario del seed entrar.
// Con el login real, esta pantalla pasa a tener email y contraseña.
export default function Ingresar() {
  const { ingresar } = useSesion();

  return (
    <Pantalla sinEncabezado>
      {/* El logo usa el verde vivo de la marca: WCAG exceptúa a los logos del contraste.
          Para el lector de pantalla es un solo título con el nombre completo. */}
      <View
        className="items-center gap-2 pb-8 pt-10"
        accessible
        accessibilityRole="header"
        accessibilityLabel="AI Ticket It, entradas a un click"
      >
        <View className="rounded-2xl bg-marca-vivo px-5 py-3">
          <Text className="text-3xl font-extrabold text-white">AI</Text>
        </View>
        <Text className="text-3xl font-extrabold text-tinta">
          Ticket <Text className="text-marca-vivo">It</Text>
        </Text>
        <Text className="tracking-widest text-tinta-suave">ENTRADAS A UN CLICK</Text>
      </View>

      {GRUPOS.map((grupo) => (
        <View key={grupo.rol} className="mb-6 gap-3">
          <Text className="text-sm font-semibold uppercase text-tinta-suave">{grupo.titulo}</Text>
          {USUARIOS_DEMO.filter((usuario) => usuario.rol === grupo.rol).map((usuario) => (
            <Pressable
              key={usuario.id}
              onPress={() => ingresar(usuario)}
              accessibilityRole="button"
              accessibilityLabel={`Ingresar como ${usuario.nombre} ${usuario.apellido}, ${grupo.titulo.toLowerCase().replace("como ", "")}`}
              className="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm active:opacity-80"
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-marca-claro">
                <Ionicons name={grupo.icono} size={22} color={COLORES.marca} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-tinta">
                  {usuario.nombre} {usuario.apellido}
                </Text>
                <Text className="text-sm text-tinta-suave">Usuario de prueba #{usuario.id}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORES.tintaSuave} />
            </Pressable>
          ))}
        </View>
      ))}

      <Text className="text-center text-xs text-tinta-suave">
        Versión de prueba: el ingreso con email y contraseña llega con el login.
      </Text>
    </Pantalla>
  );
}
