import { useState } from "react";
import { View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { Chip } from "../../components/Chip/Chip";
import { Boton } from "../../components/Boton/Boton";
import { TarjetaEvento } from "../../components/TarjetaEvento/TarjetaEvento";
import { ListaPaginada, paginaSiguiente } from "../../components/ListaPaginada/ListaPaginada";
import { obtenerMisEventos } from "../../services/eventosService";

// Las dos vistas: los que vienen (el más cercano primero) y los que ya pasaron (el más reciente primero)
const VISTAS = [
  { id: "proximos", texto: "Próximos" },
  { id: "realizados", texto: "Realizados" },
];

// Mis eventos (O1): los eventos del organizador, separados en próximos y realizados.
// Al tocar uno se abre su gestión (compras, disponibilidad, edición).
export default function MisEventos({ navigation }) {
  const [cuando, setCuando] = useState("proximos");

  // La clave empieza con "eventos": al crear o editar un evento, invalidar ["eventos"] actualiza esta lista y Explorar
  const eventos = useInfiniteQuery({
    queryKey: ["eventos", "mios", cuando],
    queryFn: ({ pageParam }) => obtenerMisEventos(cuando, pageParam),
    initialPageParam: 1,
    getNextPageParam: paginaSiguiente,
  });

  const vacio =
    cuando === "proximos"
      ? {
          icono: "calendar-outline",
          titulo: "No tenés eventos próximos",
          mensaje: "Creá un evento para empezar a vender entradas.",
          children: (
            <Boton className="mt-3" onPress={() => navigation.navigate("CrearEvento")}>
              Crear evento
            </Boton>
          ),
        }
      : {
          icono: "time-outline",
          titulo: "Todavía no se realizó ningún evento",
          mensaje: "Cuando pase la fecha de un evento, lo vas a ver acá con sus reseñas.",
        };

  return (
    <Pantalla scroll={false}>
      {/* Dos opciones excluyentes: con los mismos chips de Explorar, que el lector anuncia como seleccionados */}
      <View className="mb-3 flex-row gap-2">
        {VISTAS.map((vista) => (
          <Chip key={vista.id} texto={vista.texto} seleccionado={cuando === vista.id} onPress={() => setCuando(vista.id)} />
        ))}
      </View>

      <ListaPaginada
        consulta={eventos}
        renderItem={(evento) => (
          <TarjetaEvento
            evento={evento}
            deOrganizador
            onPress={() => navigation.navigate("GestionEvento", { eventoId: evento.id, nombre: evento.nombre })}
          />
        )}
        vacio={vacio}
      />
    </Pantalla>
  );
}
