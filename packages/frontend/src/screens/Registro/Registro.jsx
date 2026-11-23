import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { Campo } from "../../components/Campo/Campo";
import { CampoContrasenia } from "../../components/CampoContrasenia/CampoContrasenia";
import { Boton } from "../../components/Boton/Boton";
import { Aviso } from "../../components/Aviso/Aviso";
import { useSesion } from "../../context/SesionContext";
import { normalizarError } from "../../services/errores";
import { COLORES } from "../../styles/colores";

const EMAIL_VALIDO = /^\S+@\S+\.\S+$/;

// El rol se elige una vez, al crear la cuenta (decisión 14), con palabras de quien usa la app
const ROLES = [
  { rol: "COMPRADOR", titulo: "Quiero comprar entradas", detalle: "Buscá eventos, comprá y seguí tus compras.", icono: "ticket-outline" },
  { rol: "ORGANIZADOR", titulo: "Quiero organizar eventos", detalle: "Publicá eventos y gestioná sus ventas.", icono: "calendar-outline" },
];

// Crear cuenta (decisión 42). Al terminar, ya queda con la sesión iniciada.
export default function Registro() {
  const { registrarse } = useSesion();
  const [datos, setDatos] = useState({ nombre: "", apellido: "", email: "", password: "", rol: null });
  const [errores, setErrores] = useState({});

  const registro = useMutation({
    mutationFn: () => registrarse({ ...datos, email: datos.email.trim(), nombre: datos.nombre.trim(), apellido: datos.apellido.trim() }),
    // Un 400 trae los errores por campo ("password: ..."): se muestran debajo de cada uno
    onError: (error) => {
      const { detalles } = normalizarError(error);
      setErrores(Object.fromEntries(detalles.filter((d) => d.campo).map(({ campo, mensaje }) => [campo, mensaje])));
    },
  });

  const cambiar = (campo, valor) => {
    setDatos((actual) => ({ ...actual, [campo]: valor }));
    setErrores(({ [campo]: _, ...resto }) => resto);
  };

  const enviar = () => {
    const encontrados = {};
    if (!datos.nombre.trim()) encontrados.nombre = "El nombre es obligatorio";
    if (!datos.apellido.trim()) encontrados.apellido = "El apellido es obligatorio";
    if (!EMAIL_VALIDO.test(datos.email.trim())) encontrados.email = "Escribí un email válido";
    if (datos.password.length < 8) encontrados.password = "La contraseña debe tener al menos 8 caracteres";
    if (!datos.rol) encontrados.rol = "Elegí cómo vas a usar la app";
    setErrores(encontrados);
    if (Object.keys(encontrados).length === 0) registro.mutate();
  };

  // Un rechazo que no es de un campo (por ejemplo, "Ya existe una cuenta con ese email")
  const rechazo = registro.error ? normalizarError(registro.error) : null;

  return (
    <Pantalla>
      <View className="gap-4 pb-4">
        <View className="gap-2" accessibilityRole="radiogroup" accessibilityLabel="Cómo vas a usar la app">
          <Text className="text-sm font-semibold text-tinta">¿Cómo vas a usar la app?</Text>
          {ROLES.map((opcion) => {
            const elegido = datos.rol === opcion.rol;
            return (
              <Pressable
                key={opcion.rol}
                onPress={() => cambiar("rol", opcion.rol)}
                accessibilityRole="radio"
                aria-checked={elegido}
                accessibilityLabel={`${opcion.titulo}. ${opcion.detalle}`}
                className={`flex-row items-center gap-3 rounded-2xl border-2 bg-white p-4 active:opacity-80 ${
                  elegido ? "border-marca" : "border-transparent"
                }`}
              >
                <View className="h-11 w-11 items-center justify-center rounded-full bg-marca-claro">
                  <Ionicons name={opcion.icono} size={22} color={COLORES.marca} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-tinta">{opcion.titulo}</Text>
                  <Text className="text-sm text-tinta-suave">{opcion.detalle}</Text>
                </View>
                <Ionicons
                  name={elegido ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={elegido ? COLORES.marca : COLORES.tintaSuave}
                />
              </Pressable>
            );
          })}
          {errores.rol && <Aviso texto={errores.rol} />}
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Campo etiqueta="Nombre" valor={datos.nombre} onCambiar={(v) => cambiar("nombre", v)} error={errores.nombre} autoComplete="given-name" />
          </View>
          <View className="flex-1">
            <Campo
              etiqueta="Apellido"
              valor={datos.apellido}
              onCambiar={(v) => cambiar("apellido", v)}
              error={errores.apellido}
              autoComplete="family-name"
            />
          </View>
        </View>
        <Campo
          etiqueta="Email"
          valor={datos.email}
          onCambiar={(v) => cambiar("email", v)}
          error={errores.email}
          placeholder="nombre@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        <CampoContrasenia
          valor={datos.password}
          onCambiar={(v) => cambiar("password", v)}
          error={errores.password}
          ayuda="Al menos 8 caracteres"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <Aviso texto={rechazo && rechazo.detalles.length === 0 ? rechazo.mensaje : null} />

        <Boton onPress={enviar} cargando={registro.isPending}>
          Crear cuenta
        </Boton>
      </View>
    </Pantalla>
  );
}
