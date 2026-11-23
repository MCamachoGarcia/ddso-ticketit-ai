import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { iconoDePestania } from "./iconoDePestania";
import { TITULOS_COMPARTIDOS, opcionesDePestanias, opcionesDePila } from "./opciones";
import MisEventos from "../screens/MisEventos/MisEventos";
import FormularioEvento from "../screens/FormularioEvento/FormularioEvento";
import Perfil from "../screens/Perfil/Perfil";
import GestionEvento from "../screens/GestionEvento/GestionEvento";
import DetalleCompra from "../screens/DetalleCompra/DetalleCompra";
import Chat from "../screens/Chat/Chat";
import ReseniasOrganizador from "../screens/ReseniasOrganizador/ReseniasOrganizador";

const Pestanias = createBottomTabNavigator();
const Pila = createNativeStackNavigator();

// Las pestañas de abajo del organizador
function PestaniasOrganizador() {
  return (
    <Pestanias.Navigator screenOptions={opcionesDePestanias}>
      <Pestanias.Screen
        name="MisEventos"
        component={MisEventos}
        options={{ title: "Mis eventos", tabBarIcon: iconoDePestania("calendar") }}
      />
      <Pestanias.Screen
        name="CrearEvento"
        component={FormularioEvento}
        options={{ title: "Crear evento", tabBarIcon: iconoDePestania("add-circle") }}
      />
      <Pestanias.Screen name="Perfil" component={Perfil} options={{ tabBarIcon: iconoDePestania("person") }} />
    </Pestanias.Navigator>
  );
}

export function NavegacionOrganizador() {
  return (
    <Pila.Navigator screenOptions={opcionesDePila}>
      <Pila.Screen name="Inicio" component={PestaniasOrganizador} options={{ headerShown: false }} />
      <Pila.Screen name="GestionEvento" component={GestionEvento} options={{ title: "Gestión del evento" }} />
      {/* El mismo formulario que "Crear evento", con los datos del evento a editar */}
      <Pila.Screen name="EditarEvento" component={FormularioEvento} options={{ title: "Editar evento" }} />
      <Pila.Screen name="DetalleCompra" component={DetalleCompra} options={{ title: TITULOS_COMPARTIDOS.DetalleCompra }} />
      <Pila.Screen name="Chat" component={Chat} options={{ title: TITULOS_COMPARTIDOS.Chat }} />
      <Pila.Screen
        name="ReseniasOrganizador"
        component={ReseniasOrganizador}
        options={{ title: TITULOS_COMPARTIDOS.ReseniasOrganizador }}
      />
    </Pila.Navigator>
  );
}
