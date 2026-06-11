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
  signo_grupo: string | number | null;
  clasificado_pronosticado: string | null;
};

type ResultadoRecalculoPronosticos = {
  ok: boolean;
  actualizados?: number;
  ignorados?: number;
  procesados?: number;
  partidosConResultado?: number;
  error?: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAGE_SIZE = 1000;

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
    Number.isFinite(Number(partido.resultado_local)) &&
    Number.isFinite(Number(partido.resultado_visitante))
  );
}

function normalizarSignoGrupo(signo: string | number | null) {
  const valor = String(signo ?? "")
    .trim()
    .toUpperCase();

  if (valor === "1" || valor === "LOCAL" || valor === "L" || valor === "HOME") {
    return "1";
  }

  if (
    valor === "X" ||
    valor === "EMPATE" ||
    valor === "DRAW" ||
    valor === "E"
  ) {
    return "X";
  }

  if (
    valor === "2" ||
    valor === "VISITANTE" ||
    valor === "V" ||
    valor === "AWAY"
  ) {
    return "2";
  }

  return null;
}

function normalizarNumero(valor: number | null) {
  if (valor === null || valor === undefined) return null;

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : null;
}

function calcularPuntosPronostico(partido: PartidoRow, pronostico: PronosticoRow) {
  if (!tieneResultado(partido)) {
    return null;
  }

  const resultadoLocal = normalizarNumero(partido.resultado_local);
  const resultadoVisitante = normalizarNumero(partido.resultado_visitante);

  if (resultadoLocal === null || resultadoVisitante === null) {
    return null;
  }

  if (esFaseGrupos(partido.fase)) {
    const signoNormalizado = normalizarSignoGrupo(pronostico.signo_grupo);

    return calcularPuntosGrupo1X2(
      signoNormalizado,
      resultadoLocal,
      resultadoVisitante
    );
  }

  return calcularPuntosEliminatoria({
    pronosticoLocal: normalizarNumero(pronostico.goles_local),
    pronosticoVisitante: normalizarNumero(pronostico.goles_visitante),
    resultadoLocal,
    resultadoVisitante,
    local: partido.local ?? "",
    visitante: partido.visitante ?? "",
    clasificadoPronosticado: pronostico.clasificado_pronosticado,
    clasificadoReal: partido.clasificado_real,
  });
}

async function cargarTodosLosPronosticos(
  supabase: ReturnType<typeof crearSupabaseAdmin>
) {
  let desde = 0;
  let todos: PronosticoRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("pronosticos")
      .select(
        "id, partido_id, goles_local, goles_visitante, puntos, tipo_pronostico, signo_grupo, clasificado_pronosticado"
      )
      .order("id", { ascending: true })
      .range(desde, desde + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Error cargando pronósticos: ${error.message}`);
    }

    const bloque = (data ?? []) as PronosticoRow[];
    todos = [...todos, ...bloque];

    if (bloque.length < PAGE_SIZE) {
      break;
    }

    desde += PAGE_SIZE;
  }

  return todos;
}

async function actualizarPronosticoConReintento(
  supabase: ReturnType<typeof crearSupabaseAdmin>,
  pronosticoId: number,
  puntos: number
) {
  const { error } = await supabase
    .from("pronosticos")
    .update({ puntos })
    .eq("id", pronosticoId);

  if (error) {
    throw new Error(
      `Error actualizando pronóstico ${pronosticoId}: ${error.message}`
    );
  }
}

export async function recalcularPronosticos(): Promise<ResultadoRecalculoPronosticos> {
  try {
    const supabase = crearSupabaseAdmin();

    const { data: partidosData, error: partidosError } = await supabase
      .from("partidos")
      .select(
        "id, local, visitante, fase, resultado_local, resultado_visitante, clasificado_real"
      );

    if (partidosError) {
      return {
        ok: false,
        error: `Error cargando partidos: ${partidosError.message}`,
      };
    }

    const partidos = (partidosData ?? []) as PartidoRow[];

    const partidosPorId = new Map<number, PartidoRow>(
      partidos.map((partido) => [partido.id, partido])
    );

    const partidosConResultado = partidos.filter(tieneResultado).length;
    const pronosticos = await cargarTodosLosPronosticos(supabase);

    let actualizados = 0;
    let ignorados = 0;
    let procesados = 0;

    for (const pronostico of pronosticos) {
      procesados += 1;

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

      const puntosActuales = normalizarNumero(pronostico.puntos);

      if (puntosActuales === puntosCalculados) {
        ignorados += 1;
        continue;
      }

      await actualizarPronosticoConReintento(
        supabase,
        pronostico.id,
        puntosCalculados
      );

      actualizados += 1;
    }

    return {
      ok: true,
      actualizados,
      ignorados,
      procesados,
      partidosConResultado,
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
