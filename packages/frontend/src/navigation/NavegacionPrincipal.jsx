import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSesion } from "../context/SesionContext";
import { EstadoDeCarga } from "../components/Estados/Estados";
import Ingresar from "../screens/Ingresar/Ingresar";
import Registro from "../screens/Registro/Registro";
import { NavegacionComprador } from "./NavegacionComprador";
import { NavegacionOrganizador } from "./NavegacionOrganizador";
import { opcionesDePila } from "./opciones";

const Pila = createNativeStackNavigator();

// Sin sesión: ingresar o crear una cuenta
function NavegacionIngreso() {
  return (
    <Pila.Navigator screenOptions={opcionesDePila}>
      <Pila.Screen name="Ingresar" component={Ingresar} options={{ headerShown: false, title: "Ingresar" }} />
      <Pila.Screen name="Registro" component={Registro} options={{ title: "Crear cuenta" }} />
    </Pila.Navigator>
  );
}

// Equivale a las rutas protegidas del TP: según quién entró, se muestra una navegación u otra.
// Ocultar pantallas es UX; la seguridad real está en el backend (cada ruta valida token, rol y pertenencia).
export function NavegacionPrincipal() {
  const { usuario, restaurando } = useSesion();

  // Al abrir la app se revisa si quedó una sesión guardada: un instante de carga en lugar de mostrar el login de más
  if (restaurando) return <EstadoDeCarga mensaje="Abriendo AI Ticket It…" />;
  if (!usuario) return <NavegacionIngreso />;
  return usuario.rol === "ORGANIZADOR" ? <NavegacionOrganizador /> : <NavegacionComprador />;
}
