import { supabase } from "@/lib/supabase";
import { calcularPuntos } from "@/lib/puntos";

type Partido = {
  id: number;
  resultado_local: number | null;
  resultado_visitante: number | null;
};

type Pronostico = {
  id: number;
  partido_id: number;
  goles_local: number | null;
  goles_visitante: number | null;
};

export async function recalcularPuntos() {
  const { data: partidos, error: errorPartidos } = await supabase
    .from("partidos")
    .select("id, resultado_local, resultado_visitante");

  if (errorPartidos) {
    console.error("Error cargando partidos:", errorPartidos.message);
    return;
  }

  const { data: pronosticos, error: errorPronosticos } = await supabase
    .from("pronosticos")
    .select("id, partido_id, goles_local, goles_visitante");

  if (errorPronosticos) {
    console.error("Error cargando pronósticos:", errorPronosticos.message);
    return;
  }

  for (const pronostico of (pronosticos ?? []) as Pronostico[]) {
    const partido = ((partidos ?? []) as Partido[]).find(
      (p) => p.id === pronostico.partido_id
    );

    if (
      !partido ||
      partido.resultado_local === null ||
      partido.resultado_visitante === null ||
      pronostico.goles_local === null ||
      pronostico.goles_visitante === null
    ) {
      continue;
    }

    const puntos = calcularPuntos(
      pronostico.goles_local,
      pronostico.goles_visitante,
      partido.resultado_local,
      partido.resultado_visitante
    );

    const { error: errorUpdate } = await supabase
      .from("pronosticos")
      .update({ puntos })
      .eq("id", pronostico.id);

    if (errorUpdate) {
      console.error(
        `Error actualizando puntos del pronóstico ${pronostico.id}:`,
        errorUpdate.message
      );
    }
  }
}