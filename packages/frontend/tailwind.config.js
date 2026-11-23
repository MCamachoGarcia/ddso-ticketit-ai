/** @type {import('tailwindcss').Config} */
module.exports = {
  // Todos los archivos donde se usan clases de Tailwind (className="..."). Si falta uno, sus estilos no se generan.
  content: ["./App.js", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Colores de la marca. Se usan como bg-marca, text-marca, bg-marca-claro, etc.
      // Contraste mínimo 4.5:1 para todo texto (WCAG AA, ver docs/accesibilidad.md):
      // - marca: verde accesible para botones y textos (blanco encima: 5.36:1; sobre fondo o marca-claro: 4.9:1 o más)
      // - vivo: el verde del logo. Muy claro para llevar texto (blanco encima: 1.97:1), así que solo
      //   se usa para el logo y para detalles sin texto
      colors: {
        marca: {
          DEFAULT: "#2F7A19",
          vivo: "#5FD13A",
          claro: "#E9F9E3",
        },
        tinta: {
          DEFAULT: "#111827",
          suave: "#6B7280",
        },
        fondo: "#F7F8FA",
      },
    },
  },
  plugins: [],
};
