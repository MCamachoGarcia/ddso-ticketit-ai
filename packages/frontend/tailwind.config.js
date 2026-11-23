/** @type {import('tailwindcss').Config} */
module.exports = {
  // Todos los archivos donde se usan clases de Tailwind (className="..."). Si falta uno, sus estilos no se generan.
  content: ["./App.js", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Colores de la marca, tomados del logo de AI Ticket It. Se usan como bg-marca, text-marca-oscuro, etc.
      colors: {
        marca: {
          DEFAULT: "#5FD13A",
          claro: "#E9F9E3",
          oscuro: "#3E9A22",
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
