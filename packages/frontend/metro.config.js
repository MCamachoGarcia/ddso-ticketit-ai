// Metro es el empaquetador de React Native (el equivalente de webpack en el TP).
// Desde el SDK 52, Expo lo configura solo para monorepos: no hace falta watchFolders ni nodeModulesPaths.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
