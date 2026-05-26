import { createClient } from "@supabase/supabase-js";
import {
  calcularPuntosEliminatoria,
  calcularPuntosGrupo1X2,
} from "@/lib/puntos";

type PartidoRow = {
  id: number;
  local: string | null;
  visitante: string | null;
  fase: string | null;
  resultado_local: number | null;
  resultado_visitante: number | null;
  clasificado_real: string | null;
};

type PronosticoRow = {
  id: number;
  partido_id: number;
  goles_local: number | null;
  goles_visitante: number | null;
  puntos: number | null;
  tipo_pronostico: string | null;
  signo_grupo: string | null;
  clasificado_pronosticado: string | null;
};

type ResultadoRecalculoPronosticos = {
  ok: boolean;
  actualizados?: number;
  ignorados?: number;
  error?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function crearSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en variables de entorno"
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function esFaseGrupos(fase: string | null) {
  return fase?.trim().toLowerCase() === "fase de grupos";
}

function tieneResultado(partido: PartidoRow) {
  return (
    partido.resultado_local !== null &&
    partido.resultado_visitante !== null &&
    Number.isFinite(partido.resultado_local) &&
    Number.isFinite(partido.resultado_visitante)
  );
}

function calcularPuntosPronostico(partido: PartidoRow, pronostico: PronosticoRow) {
  if (!tieneResultado(partido)) {
    return null;
  }

  const resultadoLocal = partido.resultado_local as number;
  const resultadoVisitante = partido.resultado_visitante as number;

  if (esFaseGrupos(partido.fase)) {
    return calcularPuntosGrupo1X2(
      pronostico.signo_grupo,
      resultadoLocal,
      resultadoVisitante
    );
  }

  return calcularPuntosEliminatoria({
    pronosticoLocal: pronostico.goles_local,
    pronosticoVisitante: pronostico.goles_visitante,
    resultadoLocal,
    resultadoVisitante,
    local: partido.local ?? "",
    visitante: partido.visitante ?? "",
    clasificadoPronosticado: pronostico.clasificado_pronosticado,
    clasificadoReal: partido.clasificado_real,
  });
}

export async function recalcularPronosticos(): Promise<ResultadoRecalculoPronosticos> {
  try {
    const supabase = crearSupabaseAdmin();

    const [
      { data: partidosData, error: partidosError },
      { data: pronosticosData, error: pronosticosError },
    ] = await Promise.all([
      supabase
        .from("partidos")
        .select(
          "id, local, visitante, fase, resultado_local, resultado_visitante, clasificado_real"
        ),
      supabase
        .from("pronosticos")
        .select(
          "id, partido_id, goles_local, goles_visitante, puntos, tipo_pronostico, signo_grupo, clasificado_pronosticado"
        ),
    ]);

    if (partidosError) {
      return {
        ok: false,
        error: `Error cargando partidos: ${partidosError.message}`,
      };
    }

    if (pronosticosError) {
      return {
        ok: false,
        error: `Error cargando pronósticos: ${pronosticosError.message}`,
      };
    }

    const partidos = (partidosData ?? []) as PartidoRow[];
    const pronosticos = (pronosticosData ?? []) as PronosticoRow[];

    const partidosPorId = new Map<number, PartidoRow>(
      partidos.map((partido) => [partido.id, partido])
    );

    let actualizados = 0;
    let ignorados = 0;

    for (const pronostico of pronosticos) {
      const partido = partidosPorId.get(pronostico.partido_id);

      if (!partido) {
        ignorados += 1;
        continue;
      }

      const puntosCalculados = calcularPuntosPronostico(partido, pronostico);

      if (puntosCalculados === null) {
        ignorados += 1;
        continue;
      }

      if (pronostico.puntos === puntosCalculados) {
        ignorados += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("pronosticos")
        .update({ puntos: puntosCalculados })
        .eq("id", pronostico.id);

      if (updateError) {
        return {
          ok: false,
          actualizados,
          ignorados,
          error: `Error actualizando pronóstico ${pronostico.id}: ${updateError.message}`,
        };
      }

      actualizados += 1;
    }

    return {
      ok: true,
      actualizados,
      ignorados,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido recalculando pronósticos",
    };
  }
}
