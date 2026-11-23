import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { iconoDePestania } from "./iconoDePestania";
import { TITULOS_COMPARTIDOS, opcionesDePila, useOpcionesDePestanias } from "./opciones";
import Explorar from "../screens/Explorar/Explorar";
import MisCompras from "../screens/MisCompras/MisCompras";
import Favoritos from "../screens/Favoritos/Favoritos";
import Perfil from "../screens/Perfil/Perfil";
import DetalleEvento from "../screens/DetalleEvento/DetalleEvento";
import DetalleCompra from "../screens/DetalleCompra/DetalleCompra";
import Chat from "../screens/Chat/Chat";
import ReseniasOrganizador from "../screens/ReseniasOrganizador/ReseniasOrganizador";

const Pestanias = createBottomTabNavigator();
const Pila = createNativeStackNavigator();

// Las pestañas de abajo del comprador
function PestaniasComprador() {
  return (
    <Pestanias.Navigator screenOptions={useOpcionesDePestanias()}>
      <Pestanias.Screen name="Explorar" component={Explorar} options={{ tabBarIcon: iconoDePestania("search") }} />
      <Pestanias.Screen
        name="MisCompras"
        component={MisCompras}
        options={{ title: "Mis compras", tabBarIcon: iconoDePestania("ticket") }}
      />
      <Pestanias.Screen name="Favoritos" component={Favoritos} options={{ tabBarIcon: iconoDePestania("heart") }} />
      <Pestanias.Screen name="Perfil" component={Perfil} options={{ tabBarIcon: iconoDePestania("person") }} />
    </Pestanias.Navigator>
  );
}

// La pila: las pestañas abajo de todo y, encima, las pantallas que se abren al tocar algo (con "atrás")
export function NavegacionComprador() {
  return (
    <Pila.Navigator screenOptions={opcionesDePila}>
      <Pila.Screen name="Inicio" component={PestaniasComprador} options={{ headerShown: false }} />
      <Pila.Screen name="DetalleEvento" component={DetalleEvento} options={{ title: "Evento" }} />
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
