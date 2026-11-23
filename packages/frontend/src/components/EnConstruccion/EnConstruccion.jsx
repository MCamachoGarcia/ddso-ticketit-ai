import { Pantalla } from "../Pantalla/Pantalla";
import { Vacio } from "../Estados/Estados";

// Lugar provisorio para las pantallas que todavía no están hechas: así la navegación ya se puede recorrer
export function EnConstruccion({ descripcion }) {
  return (
    <Pantalla>
      <Vacio icono="construct-outline" titulo="Próximamente" mensaje={descripcion} />
    </Pantalla>
  );
}
