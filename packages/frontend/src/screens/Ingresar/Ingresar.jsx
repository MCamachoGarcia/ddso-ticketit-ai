import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { Logo } from "../../components/Logo/Logo";
import { Campo } from "../../components/Campo/Campo";
import { CampoContrasenia } from "../../components/CampoContrasenia/CampoContrasenia";
import { Boton } from "../../components/Boton/Boton";
import { Aviso } from "../../components/Aviso/Aviso";
import { Chip } from "../../components/Chip/Chip";
import { useSesion } from "../../context/SesionContext";
import { mensajeError } from "../../services/errores";

const EMAIL_VALIDO = /^\S+@\S+\.\S+$/;

// Usuarios del seed, para probar rápido cada rol (todos con la contraseña demo1234). Completan el formulario, no ingresan solos.
const USUARIOS_DE_PRUEBA = [
  { nombre: "Leo (comprador)", email: "leo.comprador@demo.com" },
  { nombre: "Ana (organizadora)", email: "ana.organizadora@demo.com" },
];
const CONTRASENIA_DE_PRUEBA = "demo1234";

// Pantalla de inicio sin sesión (decisión 42): email y contraseña. El token queda guardado y la app recuerda la sesión.
export default function Ingresar({ navigation }) {
  const { ingresar, aviso } = useSesion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState({});

  const ingreso = useMutation({ mutationFn: () => ingresar({ email: email.trim(), password }) });

  const enviar = () => {
    const encontrados = {};
    if (!EMAIL_VALIDO.test(email.trim())) encontrados.email = "Escribí un email válido";
    if (!password) encontrados.password = "Escribí tu contraseña";
    setErrores(encontrados);
    if (Object.keys(encontrados).length === 0) ingreso.mutate();
  };

  const completarDePrueba = (usuario) => {
    setEmail(usuario.email);
    setPassword(CONTRASENIA_DE_PRUEBA);
    setErrores({});
    ingreso.reset();
  };

  return (
    <Pantalla sinEncabezado>
      <Logo />

      <View className="gap-4">
        {/* Por qué volvió al ingreso sin haber salido (por ejemplo, venció la sesión) */}
        {!ingreso.error && <Aviso texto={aviso} tipo="info" />}

        <Campo
          etiqueta="Email"
          valor={email}
          onCambiar={(v) => {
            setEmail(v);
            setErrores(({ email: _, ...resto }) => resto);
          }}
          error={errores.email}
          placeholder="nombre@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        <CampoContrasenia
          valor={password}
          onCambiar={(v) => {
            setPassword(v);
            setErrores(({ password: _, ...resto }) => resto);
          }}
          error={errores.password}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={enviar}
        />

        {/* El 401 del backend: siempre "Email o contraseña incorrectos", sin decir cuál de los dos */}
        <Aviso texto={ingreso.error && mensajeError(ingreso.error)} />

        <Boton onPress={enviar} cargando={ingreso.isPending}>
          Ingresar
        </Boton>

        <View className="flex-row flex-wrap items-center justify-center gap-1">
          <Text className="text-base text-tinta-suave">¿No tenés cuenta?</Text>
          <Pressable
            onPress={() => navigation.navigate("Registro")}
            accessibilityRole="link"
            className="min-h-11 justify-center px-1 active:opacity-70"
          >
            <Text className="text-base font-semibold text-marca">Crear cuenta</Text>
          </Pressable>
        </View>
      </View>

      {/* Ayuda para la demo: los usuarios del seed */}
      <View className="mt-6 gap-2 rounded-2xl border border-dashed border-gray-300 p-4">
        <Text className="text-sm font-semibold text-tinta">Usuarios de prueba</Text>
        <Text className="text-xs text-tinta-suave">Completan el formulario. Contraseña: {CONTRASENIA_DE_PRUEBA}</Text>
        <View className="flex-row flex-wrap gap-2">
          {USUARIOS_DE_PRUEBA.map((usuario) => (
            <Chip key={usuario.email} texto={usuario.nombre} onPress={() => completarDePrueba(usuario)} />
          ))}
        </View>
      </View>
    </Pantalla>
  );
}
