import Constants from "expo-constants";
import { Platform } from "react-native";

const PUERTO_BACKEND = 8000;

// ¿Dónde está el backend?
// 1. Si se define EXPO_PUBLIC_API_URL (en un .env del frontend), se usa esa.
// 2. En el celular (Expo Go), el backend corre en la misma PC que sirve la app: se toma la IP de esa PC
//    de hostUri (por ejemplo "192.168.0.10:8081") y se cambia el puerto. Así no hay que escribir la IP a mano.
// 3. En el navegador de la PC, localhost.
function urlDelBackend() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, "");

  const hostUri = Constants.expoConfig?.hostUri;
  if (Platform.OS !== "web" && hostUri) {
    const ipDeLaPc = hostUri.split(":")[0];
    return `http://${ipDeLaPc}:${PUERTO_BACKEND}`;
  }

  return `http://localhost:${PUERTO_BACKEND}`;
}

export const API_URL = urlDelBackend();

// El WebSocket del chat está en el mismo servidor, en /ws
export const WS_URL = `${API_URL.replace(/^http/, "ws")}/ws`;
