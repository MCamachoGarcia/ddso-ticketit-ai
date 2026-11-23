import { createContext, useContext, useEffect, useState } from "react";
import { alResponderNoAutenticado, usarToken } from "../services/api";
import * as authService from "../services/authService";
import { borrarToken, guardarToken, leerToken } from "../services/tokenGuardado";
import { queryClient } from "../services/queryClient";

// Quién está usando la app (decisión 42). Decide qué navegación se muestra: ingreso, comprador u organizador.
const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Mientras se revisa si quedó una sesión guardada, no se muestra ni el login ni la app
  const [restaurando, setRestaurando] = useState(true);
  // Por qué se cerró la sesión sin que el usuario saliera (por ejemplo, venció el token): lo muestra el login
  const [aviso, setAviso] = useState(null);

  const empezar = async ({ token, usuario: datos }) => {
    usarToken(token);
    await guardarToken(token);
    setAviso(null);
    setUsuario(datos);
  };

  const cerrar = async () => {
    usarToken(null);
    await borrarToken();
    // Se borra la caché: los datos del usuario anterior no se tienen que ver con el siguiente
    queryClient.clear();
    setUsuario(null);
  };

  // Al abrir la app: si quedó un token guardado, se pregunta al backend si sigue valiendo (GET /auth/me).
  // Es un efecto de verdad (sincronizar con algo de afuera de React), por eso va en useEffect.
  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const token = await leerToken();
        if (!token) return;
        usarToken(token);
        const datos = await authService.quienSoy();
        if (vigente) setUsuario(datos);
      } catch {
        // Venció o no vale más: se descarta y se pide ingresar de nuevo
        usarToken(null);
        await borrarToken();
      } finally {
        if (vigente) setRestaurando(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, []);

  // Si en medio del uso el backend responde 401 (por ejemplo, pasaron las 2 horas), se vuelve al ingreso con un aviso
  useEffect(() => {
    alResponderNoAutenticado((mensaje) => {
      setAviso(mensaje ?? "Tu sesión terminó. Volvé a ingresar.");
      cerrar();
    });
  }, []);

  const valor = {
    usuario,
    restaurando,
    aviso,
    ingresar: async (credenciales) => empezar(await authService.ingresar(credenciales)),
    registrarse: async (datos) => empezar(await authService.registrarse(datos)),
    salir: async () => {
      setAviso(null);
      await cerrar();
    },
  };

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export const useSesion = () => useContext(SesionContext);
