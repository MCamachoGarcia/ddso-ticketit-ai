import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env"), quiet: true });

import { app } from "./src/app.js";
import { cargarSeed } from "./src/scripts/seed.js";
import { chatWebSocket } from "./src/websocket/ChatWebSocket.js";

import { secretoJwt } from "./src/config/autenticacion.js";

const PORT = process.env.PORT || 8000;

// Sin el secreto del JWT no se puede iniciar sesión: mejor avisarlo al arrancar que en el primer login
secretoJwt();

// La persistencia es en memoria: cada vez que arranca el servidor se cargan los datos de ejemplo
await cargarSeed();

// 0.0.0.0 permite que el celular (en la misma red WiFi) llegue al backend usando la IP de la PC
const servidor = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend escuchando en el puerto ${PORT} (WebSocket del chat en /ws)`);
});

// El chat en tiempo real comparte el puerto con la API
chatWebSocket.iniciar(servidor);
