import { Text, View } from "react-native";
import { formatearHora } from "../../utils/formato";

const DIA = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" });

const mismoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// "Hoy", "Ayer" o "vie, 20 nov"
const nombreDelDia = (iso) => {
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  if (mismoDia(iso, hoy)) return "Hoy";
  if (mismoDia(iso, ayer)) return "Ayer";
  return DIA.format(new Date(iso));
};

/**
 * Un mensaje del chat. Los propios van a la derecha en verde; los de la otra persona, a la izquierda en blanco,
 * con su nombre (y "Organiza el evento" si es quien organiza). Cuando cambia el día, arriba va un separador ("Hoy", "Ayer"…).
 * anterior: el mensaje enviado justo antes, para saber si hace falta el separador.
 */
export function BurbujaMensaje({ mensaje, mio, anterior }) {
  const { usuario, enviado } = mensaje;
  const nuevoDia = !anterior || !mismoDia(anterior.enviado, enviado);
  const esOrganizador = usuario.rol === "ORGANIZADOR";
  const autor = mio ? "Vos" : `${usuario.nombre} ${usuario.apellido}${esOrganizador ? ", organiza el evento" : ""}`;
  // En medio de la frase va en minúscula: "Ana Paz, hoy a las 22:10"
  const dia = nombreDelDia(enviado);
  const diaEnLaFrase = dia === "Hoy" || dia === "Ayer" ? dia.toLowerCase() : dia;

  return (
    <View>
      {nuevoDia && (
        <View className="my-3 items-center">
          <Text className="rounded-full bg-gray-200 px-3 py-1 text-xs text-tinta">{dia}</Text>
        </View>
      )}
      <View
        className={`mb-2 max-w-[80%] rounded-2xl px-3 py-2 ${mio ? "self-end rounded-br-sm bg-marca" : "self-start rounded-bl-sm bg-white shadow-sm"}`}
        // El lector lee quién, cuándo y qué, en una frase
        accessible
        accessibilityLabel={`${autor}, ${diaEnLaFrase} a las ${formatearHora(enviado)}: ${mensaje.mensaje}`}
      >
        {!mio && (
          <Text className="text-xs font-semibold text-marca">
            {usuario.nombre} {usuario.apellido}
            {esOrganizador ? " · Organiza el evento" : ""}
          </Text>
        )}
        <Text className={`text-base ${mio ? "text-white" : "text-tinta"}`}>{mensaje.mensaje}</Text>
        <Text className={`mt-0.5 self-end text-xs ${mio ? "text-white" : "text-tinta-suave"}`}>{formatearHora(enviado)}</Text>
      </View>
    </View>
  );
}
