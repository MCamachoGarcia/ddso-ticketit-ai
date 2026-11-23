import { useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HojaInferior } from "../../components/HojaInferior/HojaInferior";
import { SelectorEstrellas } from "../../components/SelectorEstrellas/SelectorEstrellas";
import { Campo } from "../../components/Campo/Campo";
import { Boton } from "../../components/Boton/Boton";
import { reseniar } from "../../services/reseniasService";
import { mensajeError } from "../../services/errores";

const MAXIMO = 1000; // el mismo límite que el backend

/**
 * Reseñar un evento (C5): puntaje de 1 a 5 y un comentario, los dos obligatorios.
 * Se abre desde una compra UTILIZADA. Que haya usado una entrada y que no lo haya reseñado antes
 * lo valida el backend; si rechaza, el motivo se muestra acá.
 */
export function HojaResenia({ evento, visible, onCerrar }) {
  const queryClient = useQueryClient();
  const [puntuacion, setPuntuacion] = useState(0);
  const [detalle, setDetalle] = useState("");
  const [intentoEnviar, setIntentoEnviar] = useState(false);

  const enviar = useMutation({
    mutationFn: () => reseniar(evento.id, { puntuacion, detalle: detalle.trim() }),
    onSuccess: () => {
      // Cambian las reseñas y el puntaje del organizador, que se ve en las tarjetas y en el detalle de cada evento
      queryClient.invalidateQueries({ queryKey: ["resenias"] });
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["evento"] });
      AccessibilityInfo.announceForAccessibility("¡Gracias! Tu reseña se publicó.");
      onCerrar();
    },
  });

  // Los errores de la app se muestran recién al intentar enviar, no mientras se escribe
  const faltaPuntaje = intentoEnviar && puntuacion === 0;
  const faltaComentario = intentoEnviar && detalle.trim() === "";

  const publicar = () => {
    setIntentoEnviar(true);
    if (puntuacion === 0 || detalle.trim() === "") return;
    enviar.mutate();
  };

  return (
    <HojaInferior visible={visible} titulo="Reseñar el evento" onCerrar={onCerrar}>
      <Text className="text-base font-semibold text-tinta">{evento.nombre}</Text>

      <View className="gap-1">
        <SelectorEstrellas
          valor={puntuacion}
          onCambiar={(valor) => {
            setPuntuacion(valor);
            enviar.reset();
          }}
        />
        {faltaPuntaje && <Text className="text-center text-sm text-red-700">Elegí un puntaje</Text>}
      </View>

      <Campo
        etiqueta="Comentario"
        valor={detalle}
        onCambiar={(texto) => {
          setDetalle(texto);
          enviar.reset();
        }}
        error={faltaComentario ? "El comentario es obligatorio" : undefined}
        ayuda={`¿Qué te pareció? Ayuda a otros a elegir. ${detalle.length}/${MAXIMO}`}
        placeholder="Contá cómo fue el evento y la organización"
        maxLength={MAXIMO}
        multiline
      />

      {enviar.error && (
        <View className="flex-row items-start gap-2 rounded-xl bg-red-50 p-3" accessibilityLiveRegion="polite" accessibilityRole="alert">
          <Ionicons name="alert-circle" size={20} color="#B91C1C" />
          <Text className="flex-1 text-sm text-red-800">{mensajeError(enviar.error)}</Text>
        </View>
      )}

      <Boton onPress={publicar} cargando={enviar.isPending}>
        Publicar reseña
      </Boton>
      <Text className="text-center text-xs text-tinta-suave">
        Tu reseña es pública y suma al puntaje del organizador. Se puede reseñar una vez por evento.
      </Text>
    </HojaInferior>
  );
}
