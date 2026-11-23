import { Text, View } from "react-native";
import { Estrellas } from "../Estrellas/Estrellas";
import { TEXTO_PUNTAJE } from "../SelectorEstrellas/SelectorEstrellas";

const FECHA = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" });

// Una reseña: quién, cuándo, el puntaje y el comentario.
// mostrarEvento: en las reseñas de un organizador hay que decir de qué evento es; en las de un evento, no.
export function TarjetaResenia({ resenia, mostrarEvento = false, titulo }) {
  const { comprador, puntuacion, detalle, fecha, evento } = resenia;
  const quien = titulo ?? `${comprador.nombre} ${comprador.apellido}`;
  // Sin el punto final del comentario, para que el lector no lea ".." al sumarle la fecha
  const comentario = detalle.replace(/[.\s]+$/, "");

  return (
    <View
      className="gap-2 rounded-2xl bg-white p-4 shadow-sm"
      // El lector lee la reseña completa en una frase
      accessible
      accessibilityLabel={`${quien}, ${puntuacion} de 5, ${TEXTO_PUNTAJE[puntuacion]}${
        mostrarEvento ? `, sobre ${evento.nombre}` : ""
      }. ${comentario}. ${FECHA.format(new Date(fecha))}`}
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-tinta">{quien}</Text>
        <Text className="text-xs text-tinta-suave">{FECHA.format(new Date(fecha))}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Estrellas promedio={puntuacion} tamanio={16} />
        <Text className="text-sm text-tinta-suave">{TEXTO_PUNTAJE[puntuacion]}</Text>
      </View>
      {mostrarEvento && <Text className="text-xs font-semibold uppercase text-marca">{evento.nombre}</Text>}
      <Text className="text-base leading-6 text-tinta">{detalle}</Text>
    </View>
  );
}
