import { useSesion } from "../context/SesionContext";
import Ingresar from "../screens/Ingresar/Ingresar";
import { NavegacionComprador } from "./NavegacionComprador";
import { NavegacionOrganizador } from "./NavegacionOrganizador";

// Equivale a las rutas protegidas del TP: según quién entró, se muestra una navegación u otra.
// Sin usuario, solo existe la pantalla de ingreso. (Ocultar pantallas es UX; la seguridad real está en el backend.)
export function NavegacionPrincipal() {
  const { usuario } = useSesion();

  if (!usuario) return <Ingresar />;
  return usuario.rol === "ORGANIZADOR" ? <NavegacionOrganizador /> : <NavegacionComprador />;
}
