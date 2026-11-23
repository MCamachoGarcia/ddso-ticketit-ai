import { useState } from "react";
import { AccessibilityInfo, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pantalla } from "../../components/Pantalla/Pantalla";
import { Campo } from "../../components/Campo/Campo";
import { Chip } from "../../components/Chip/Chip";
import { Boton } from "../../components/Boton/Boton";
import { crearEvento, editarEvento, obtenerCategorias, obtenerEvento } from "../../services/eventosService";
import { normalizarError } from "../../services/errores";
import { enmascararFecha, enmascararHora } from "../../utils/fechaFormulario";
import { aDatosDelBackend, erroresDelBackend, formularioInicial, tipoEntradaVacio, validarFormulario } from "./datosDelFormulario";

/**
 * Crear un evento (O4, pestaña "Crear evento") o editarlo (O5, desde Gestión del evento con { eventoId }).
 * Es la misma pantalla: si llega un eventoId, primero carga el evento y arranca con sus datos.
 */
export default function FormularioEvento({ route, navigation }) {
  const eventoId = route.params?.eventoId;
  // Al crear, después de guardar el formulario vuelve a empezar vacío: cambiar la key lo arma de nuevo
  const [vuelta, setVuelta] = useState(0);

  const evento = useQuery({
    queryKey: ["evento", eventoId],
    queryFn: () => obtenerEvento(eventoId),
    enabled: Boolean(eventoId), // al crear no hay nada que cargar
  });

  const alGuardar = (guardado) => {
    if (eventoId) {
      navigation.goBack();
    } else {
      setVuelta((v) => v + 1);
      navigation.navigate("GestionEvento", { eventoId: guardado.id, nombre: guardado.nombre });
    }
  };

  // El formulario se dibuja recién con los datos listos: así su estado inicial ya es el del evento (sin useEffect)
  return (
    <Pantalla cargando={Boolean(eventoId) && evento.isLoading} error={evento.error} onReintentar={evento.refetch}>
      {(!eventoId || evento.data) && (
        <Formulario key={vuelta} evento={evento.data} onGuardado={alGuardar} />
      )}
    </Pantalla>
  );
}

function Formulario({ evento, onGuardado }) {
  const queryClient = useQueryClient();
  const editando = Boolean(evento);
  const [formulario, setFormulario] = useState(() => formularioInicial(evento));
  const [errores, setErrores] = useState({});

  const categorias = useQuery({ queryKey: ["categorias"], queryFn: obtenerCategorias, staleTime: Infinity });

  const guardar = useMutation({
    mutationFn: (datos) => (editando ? editarEvento(evento.id, datos) : crearEvento(datos)),
    onSuccess: (guardado) => {
      // Cambió un evento: Explorar, Mis eventos, su detalle y la disponibilidad de su gestión
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["evento", guardado.id] });
      queryClient.invalidateQueries({ queryKey: ["compras", "evento", guardado.id] });
      AccessibilityInfo.announceForAccessibility(editando ? "Cambios guardados" : "Evento creado");
      onGuardado(guardado);
    },
    onError: (error) => setErrores(erroresDelBackend(normalizarError(error).detalles)),
  });

  // Cambia un campo y borra su error: el usuario ya lo está corrigiendo
  const cambiar = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    setErrores(({ [campo]: _, ...resto }) => resto);
  };

  const cambiarTipo = (indice, campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      tiposEntrada: actual.tiposEntrada.map((tipo, i) => (i === indice ? { ...tipo, [campo]: valor } : tipo)),
    }));
    setErrores(({ [`tiposEntrada.${indice}.${campo}`]: _, ...resto }) => resto);
  };

  const agregarTipo = () =>
    setFormulario((actual) => ({ ...actual, tiposEntrada: [...actual.tiposEntrada, tipoEntradaVacio()] }));

  // Solo se quitan los tipos nuevos: los que ya existen pueden tener ventas (decisión 24).
  // Los errores de los tipos se borran porque sus posiciones cambian.
  const quitarTipo = (indice) => {
    setFormulario((actual) => ({ ...actual, tiposEntrada: actual.tiposEntrada.filter((_, i) => i !== indice) }));
    setErrores((actuales) => Object.fromEntries(Object.entries(actuales).filter(([campo]) => !campo.startsWith("tiposEntrada"))));
  };

  const enviar = () => {
    const encontrados = validarFormulario(formulario);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      AccessibilityInfo.announceForAccessibility("Revisá los datos marcados en el formulario");
      return;
    }
    guardar.mutate(aDatosDelBackend(formulario));
  };

  const hayErrores = Object.keys(errores).length > 0;
  // Un rechazo del backend que no es de un campo (por ejemplo, "El cupo de VIP no puede ser menor a las
  // 19 entradas ya vendidas"): se muestra su mensaje. Si es de campos, cada error ya está en su campo.
  const rechazo = guardar.error ? normalizarError(guardar.error) : null;
  const errorGeneral = rechazo && rechazo.detalles.length === 0 ? rechazo.mensaje : null;

  return (
    <View className="gap-5 pb-4">
      <Seccion titulo="Datos del evento">
        <Campo etiqueta="Nombre" valor={formulario.nombre} onCambiar={(v) => cambiar("nombre", v)} error={errores.nombre} maxLength={100} />
        <Campo
          etiqueta="Descripción"
          valor={formulario.descripcion}
          onCambiar={(v) => cambiar("descripcion", v)}
          error={errores.descripcion}
          multiline
        />

        {/* Categoría: una sola opción entre pocas, con los chips de Explorar */}
        <View className="gap-1">
          <Text className="text-sm font-semibold text-tinta">Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {(categorias.data ?? []).map((categoria) => (
              <Chip
                key={categoria.id}
                texto={categoria.nombre}
                seleccionado={formulario.categoriaId === categoria.id}
                onPress={() => cambiar("categoriaId", categoria.id)}
              />
            ))}
          </ScrollView>
          {errores.categoriaId && <MensajeError texto={errores.categoriaId} />}
        </View>

        {/* Fecha y hora como texto (decisión 40): las barras y los dos puntos se ponen solos */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Campo
              etiqueta="Fecha"
              valor={formulario.fecha}
              onCambiar={(v) => cambiar("fecha", enmascararFecha(v))}
              error={errores.fecha}
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
          <View className="w-28">
            <Campo
              etiqueta="Hora"
              valor={formulario.hora}
              onCambiar={(v) => cambiar("hora", enmascararHora(v))}
              error={errores.hora}
              placeholder="HH:MM"
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
        </View>

        <Campo
          etiqueta="Imágenes"
          opcional
          valor={formulario.multimedia}
          onCambiar={(v) => cambiar("multimedia", v)}
          error={errores.multimedia}
          ayuda="Una dirección (URL) por línea"
          placeholder="https://…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          multiline
        />
      </Seccion>

      <Seccion titulo="Tipos de entrada">
        {formulario.tiposEntrada.map((tipo, indice) => (
          <TipoDeEntrada
            key={tipo.clave}
            tipo={tipo}
            numero={indice + 1}
            errores={errores}
            indice={indice}
            onCambiar={(campo, valor) => cambiarTipo(indice, campo, valor)}
            // Se puede quitar si es nuevo y no es el único
            onQuitar={!tipo.id && formulario.tiposEntrada.length > 1 ? () => quitarTipo(indice) : null}
          />
        ))}
        <Boton variante="secundario" onPress={agregarTipo}>
          + Agregar tipo de entrada
        </Boton>
        {editando && (
          <Text className="text-xs text-tinta-suave">
            Los tipos de entrada que ya existen no se pueden quitar, y su cupo no puede quedar por debajo de las entradas vendidas.
          </Text>
        )}
      </Seccion>

      {(hayErrores || errorGeneral) && (
        <View className="flex-row items-start gap-2 rounded-xl bg-red-50 p-3" accessibilityLiveRegion="polite" accessibilityRole="alert">
          <Ionicons name="alert-circle" size={20} color="#B91C1C" />
          <Text className="flex-1 text-sm text-red-800">{errorGeneral ?? "Revisá los datos marcados en rojo."}</Text>
        </View>
      )}

      <Boton onPress={enviar} cargando={guardar.isPending}>
        {editando ? "Guardar cambios" : "Crear evento"}
      </Boton>
    </View>
  );
}

function TipoDeEntrada({ tipo, numero, indice, errores, onCambiar, onQuitar }) {
  const error = (campo) => errores[`tiposEntrada.${indice}.${campo}`];
  return (
    <View className="gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-tinta">
          {tipo.nombre.trim() || `Tipo de entrada ${numero}`}
        </Text>
        {onQuitar && (
          <Pressable
            onPress={onQuitar}
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${tipo.nombre.trim() || `el tipo de entrada ${numero}`}`}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-gray-100"
          >
            <Ionicons name="trash-outline" size={20} color="#B91C1C" />
          </Pressable>
        )}
      </View>
      <Campo etiqueta="Nombre" valor={tipo.nombre} onCambiar={(v) => onCambiar("nombre", v)} error={error("nombre")} placeholder="Ej.: Campo, Platea, VIP" />
      <Campo etiqueta="Descripción" opcional valor={tipo.descripcion} onCambiar={(v) => onCambiar("descripcion", v)} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Campo
            etiqueta="Precio ($)"
            valor={tipo.precio}
            onCambiar={(v) => onCambiar("precio", v)}
            error={error("precio")}
            keyboardType="decimal-pad"
            placeholder="Ej.: 12.500"
          />
        </View>
        <View className="flex-1">
          <Campo
            etiqueta="Cupo"
            valor={tipo.cupo}
            onCambiar={(v) => onCambiar("cupo", v.replace(/\D/g, ""))}
            error={error("cupo")}
            keyboardType="number-pad"
            placeholder="100"
          />
        </View>
      </View>
    </View>
  );
}

function Seccion({ titulo, children }) {
  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-tinta" accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function MensajeError({ texto }) {
  return (
    <View className="flex-row items-start gap-1">
      <Ionicons name="alert-circle" size={16} color="#B91C1C" />
      <Text className="flex-1 text-sm text-red-700">{texto}</Text>
    </View>
  );
}
