import { useState } from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Campo } from "../Campo/Campo";
import { COLORES } from "../../styles/colores";

// Campo de contraseña con el botón del ojo para mostrarla u ocultarla (ayuda a no equivocarse al escribir en el celular)
export function CampoContrasenia({ etiqueta = "Contraseña", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <Campo
      etiqueta={etiqueta}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      accesorio={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="h-11 w-11 items-center justify-center active:opacity-70"
        >
          <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={COLORES.tintaSuave} />
        </Pressable>
      }
      {...props}
    />
  );
}
