import { useState } from "react";
import { ScrollView } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { Chip } from "../../components/Chip/Chip";
import { TarjetaCompra } from "../../components/TarjetaCompra/TarjetaCompra";
import { ListaPaginada, paginaSiguiente } from "../../components/ListaPaginada/ListaPaginada";
import { obtenerMisCompras } from "../../services/comprasService";
import { ESTADOS_COMPRA } from "../../utils/estadosCompra";

// Mis compras (C4): las compras del comprador, las más recientes primero, con su estado y cuánto falta.
// Se pueden filtrar por estado con los chips de arriba.
export default function MisCompras({ navigation }) {
  const [estado, setEstado] = useState(null);

  // La clave empieza con "compras": cuando HojaCompra invalida ["compras"], esta lista se vuelve a pedir
  const compras = useInfiniteQuery({
    queryKey: ["compras", "mias", { estado }],
    queryFn: ({ pageParam }) => obtenerMisCompras({ estado }, pageParam),
    initialPageParam: 1,
    getNextPageParam: paginaSiguiente,
  });

  return (
    <Pantalla scroll={false}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3 flex-shrink-0 flex-grow-0"
        contentContainerClassName="gap-2"
      >
        <Chip texto="Todas" seleccionado={estado === null} onPress={() => setEstado(null)} />
        {Object.entries(ESTADOS_COMPRA).map(([clave, { texto }]) => (
          <Chip key={clave} texto={texto} seleccionado={estado === clave} onPress={() => setEstado(clave)} />
        ))}
      </ScrollView>

      <ListaPaginada
        consulta={compras}
        renderItem={(compra) => (
          <TarjetaCompra compra={compra} onPress={() => navigation.navigate("DetalleCompra", { compraId: compra.id })} />
        )}
        vacio={
          estado === null
            ? {
                icono: "ticket-outline",
                titulo: "Todavía no compraste entradas",
                mensaje: "Buscá un evento en Explorar y comprá tus entradas.",
              }
            : {
                icono: "filter-outline",
                titulo: "No hay compras en este estado",
                mensaje: "Probá con otro filtro.",
              }
        }
      />
    </Pantalla>
  );
}
