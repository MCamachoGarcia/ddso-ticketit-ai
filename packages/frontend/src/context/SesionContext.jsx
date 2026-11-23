import { createContext, useContext, useState } from "react";
import { usarUsuario } from "../services/api";
import { queryClient } from "../services/queryClient";

// Quién está usando la app. Decide qué navegación se muestra (comprador u organizador).
const SesionContext = createContext(null);

// PROVISORIO hasta el login (decisión 23): los usuarios del seed del backend, para elegir con quién entrar
export const USUARIOS_DEMO = [
  { id: "1", nombre: "Ana", apellido: "Paz", rol: "ORGANIZADOR" },
  { id: "2", nombre: "Productora", apellido: "Sur", rol: "ORGANIZADOR" },
  { id: "3", nombre: "Leo", apellido: "Ruiz", rol: "COMPRADOR" },
  { id: "4", nombre: "Sofía", apellido: "Gómez", rol: "COMPRADOR" },
];

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);

  const ingresar = (usuarioElegido) => {
    usarUsuario(usuarioElegido.id);
    setUsuario(usuarioElegido);
  };

  const salir = () => {
    usarUsuario(null);
    // Se borra la caché: los datos del usuario anterior no se tienen que ver con el siguiente
    queryClient.clear();
    setUsuario(null);
  };

  return <SesionContext.Provider value={{ usuario, ingresar, salir }}>{children}</SesionContext.Provider>;
}

export const useSesion = () => useContext(SesionContext);
