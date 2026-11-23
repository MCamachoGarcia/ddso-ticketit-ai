import { Text, View } from "react-native";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { Boton } from "../../components/Boton/Boton";
import { useSesion } from "../../context/SesionContext";
import { API_URL } from "../../services/configuracion";

const NOMBRE_DEL_ROL = { COMPRADOR: "Comprador", ORGANIZADOR: "Organizador" };

export default function Perfil() {
  const { usuario, salir } = useSesion();

  return (
    <Pantalla>
      <View className="items-center gap-1 rounded-2xl bg-white p-6 shadow-sm">
        <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-marca-claro">
          <Text className="text-2xl font-bold text-marca">{usuario.nombre[0]}</Text>
        </View>
        <Text className="text-xl font-semibold text-tinta">
          {usuario.nombre} {usuario.apellido}
        </Text>
        <Text className="text-tinta-suave">{NOMBRE_DEL_ROL[usuario.rol]}</Text>
      </View>

      <Boton variante="secundario" className="mt-6" onPress={salir}>
        Cambiar de usuario
      </Boton>

      {/* Ayuda para probar en el celular: a qué backend se está conectando la app */}
      <Text className="mt-6 text-center text-xs text-tinta-suave">Backend: {API_URL}</Text>
    </Pantalla>
  );
}
