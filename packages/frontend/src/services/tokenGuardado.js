import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Dónde queda guardado el token entre una apertura de la app y la siguiente (decisión 42).
// - Celular: SecureStore, cifrado por el sistema (Keychain en iPhone, Keystore en Android).
//   En React Native no hay localStorage ni cookies.
// - Web: SecureStore no existe, así que se usa localStorage (el riesgo es XSS; ver docs de la clase 10).
// Se guarda solo el token, nunca la contraseña.

const CLAVE = "aiticketit.token";

const enLaWeb = Platform.OS === "web";

export const leerToken = async () => (enLaWeb ? localStorage.getItem(CLAVE) : SecureStore.getItemAsync(CLAVE));

export const guardarToken = async (token) =>
  enLaWeb ? localStorage.setItem(CLAVE, token) : SecureStore.setItemAsync(CLAVE, token);

export const borrarToken = async () => (enLaWeb ? localStorage.removeItem(CLAVE) : SecureStore.deleteItemAsync(CLAVE));
