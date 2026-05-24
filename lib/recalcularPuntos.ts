import { supabase } from "@/lib/supabase";
import {
  calcularPuntosBonus,
  calcularPuntosClasificadosGrupo,
  calcularPuntosEliminatoria,
  calcularPuntosGrupo1X2,
} from "@/lib/puntos";

type Partido = {
  id: number;
  local: string;
  visitante: string;
  fase: string | null;
  resultado_local: number | null;
  resultado_visitante: number | null;
  clasificado_real: string | null;
};

type Pronostico = {
  id: number;
  partido_id: number;
  goles_local: number | null;
  goles_visitante: number | null;
  tipo_pronostico: string | null;
  signo_grupo: string | null;
  clasificado_pronosticado: string | null;
};

type ResultadoGrupo = {
  grupo: string;
  clasificado_1: string | null;
  clasificado_2: string | null;
};

type PronosticoGrupo = {
  id: number;
  grupo: string;
  clasificado_1: string | null;
  clasificado_2: string | null;
};

type ResultadoBonus = {
  clave: string;
  valor: string | null;
};

type PronosticoBonus = {
  id: number;
  campeon: string | null;
  finalista_1: string | null;
  finalista_2: string | null;
  bota_oro: string | null;
  mejor_jugador: string | null;
  mejor_portero: string | null;
  seleccion_revelacion: string | null;
  seleccion_decepcion: string | null;
};

function esFaseGrupos(fase: string | null) {
  return fase?.trim().toLowerCase() === "fase de grupos";
}

export async function recalcularPuntos() {
  await recalcularPuntosPartidos();
  await recalcularPuntosGrupos();
  await recalcularPuntosBonus();
}

export async function recalcularPuntosPartidos() {
  const { data: partidos, error: errorPartidos } = await supabase
    .from("partidos")
    .select(
      "id, local, visitante, fase, resultado_local, resultado_visitante, clasificado_real"
    );

  if (errorPartidos) {
    console.error("Error cargando partidos:", errorPartidos.message);
    return;
  }

  const { data: pronosticos, error: errorPronosticos } = await supabase
    .from("pronosticos")
    .select(
      "id, partido_id, goles_local, goles_visitante, tipo_pronostico, signo_grupo, clasificado_pronosticado"
    );

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
      partido.resultado_visitante === null
    ) {
      continue;
    }

    let puntos = 0;

    if (esFaseGrupos(partido.fase)) {
      puntos = calcularPuntosGrupo1X2(
        pronostico.signo_grupo,
        partido.resultado_local,
        partido.resultado_visitante
      );
    } else {
      puntos = calcularPuntosEliminatoria({
        pronosticoLocal: pronostico.goles_local,
        pronosticoVisitante: pronostico.goles_visitante,
        resultadoLocal: partido.resultado_local,
        resultadoVisitante: partido.resultado_visitante,
        local: partido.local,
        visitante: partido.visitante,
        clasificadoPronosticado: pronostico.clasificado_pronosticado,
        clasificadoReal: partido.clasificado_real,
      });
    }

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

export async function recalcularPuntosGrupos() {
  const { data: resultados, error: errorResultados } = await supabase
    .from("resultados_grupos")
    .select("grupo, clasificado_1, clasificado_2");

  if (errorResultados) {
    console.error("Error cargando resultados de grupos:", errorResultados.message);
    return;
  }

  const { data: pronosticos, error: errorPronosticos } = await supabase
    .from("pronosticos_grupos")
    .select("id, grupo, clasificado_1, clasificado_2");

  if (errorPronosticos) {
    console.error("Error cargando pronósticos de grupos:", errorPronosticos.message);
    return;
  }

  for (const pronostico of (pronosticos ?? []) as PronosticoGrupo[]) {
    const resultado = ((resultados ?? []) as ResultadoGrupo[]).find(
      (r) => r.grupo === pronostico.grupo
    );

    if (!resultado || !resultado.clasificado_1 || !resultado.clasificado_2) {
      continue;
    }

    const puntos = calcularPuntosClasificadosGrupo({
      pronosticoClasificado1: pronostico.clasificado_1,
      pronosticoClasificado2: pronostico.clasificado_2,
      resultadoClasificado1: resultado.clasificado_1,
      resultadoClasificado2: resultado.clasificado_2,
    });

    const { error: errorUpdate } = await supabase
      .from("pronosticos_grupos")
      .update({
        puntos_clasificado_1: puntos.puntosClasificado1,
        puntos_clasificado_2: puntos.puntosClasificado2,
        puntos_bonus_dos_acertados: puntos.puntosBonusDosAcertados,
        puntos_bonus_orden: puntos.puntosBonusOrden,
        puntos_total: puntos.puntosTotal,
      })
      .eq("id", pronostico.id);

    if (errorUpdate) {
      console.error(
        `Error actualizando puntos del pronóstico de grupo ${pronostico.id}:`,
        errorUpdate.message
      );
    }
  }
}

export async function recalcularPuntosBonus() {
  const { data: resultadosData, error: errorResultados } = await supabase
    .from("resultados_bonus")
    .select("clave, valor");

  if (errorResultados) {
    console.error("Error cargando resultados bonus:", errorResultados.message);
    return;
  }

  const resultados = ((resultadosData ?? []) as ResultadoBonus[]).reduce<
    Record<string, string | null>
  >((acc, item) => {
    acc[item.clave] = item.valor;
    return acc;
  }, {});

  const { data: pronosticos, error: errorPronosticos } = await supabase
    .from("pronosticos_bonus")
    .select(
      "id, campeon, finalista_1, finalista_2, bota_oro, mejor_jugador, mejor_portero, seleccion_revelacion, seleccion_decepcion"
    );

  if (errorPronosticos) {
    console.error("Error cargando pronósticos bonus:", errorPronosticos.message);
    return;
  }

  for (const pronostico of (pronosticos ?? []) as PronosticoBonus[]) {
    const puntos = calcularPuntosBonus({
      campeonPronosticado: pronostico.campeon,
      finalista1Pronosticado: pronostico.finalista_1,
      finalista2Pronosticado: pronostico.finalista_2,
      botaOroPronosticada: pronostico.bota_oro,
      mejorJugadorPronosticado: pronostico.mejor_jugador,
      mejorPorteroPronosticado: pronostico.mejor_portero,
      revelacionPronosticada: pronostico.seleccion_revelacion,
      decepcionPronosticada: pronostico.seleccion_decepcion,
      resultados,
    });

    const { error: errorUpdate } = await supabase
      .from("pronosticos_bonus")
      .update({
        puntos_campeon: puntos.puntosCampeon,
        puntos_finalistas: puntos.puntosFinalistas,
        puntos_bota_oro: puntos.puntosBotaOro,
        puntos_mejor_jugador: puntos.puntosMejorJugador,
        puntos_mejor_portero: puntos.puntosMejorPortero,
        puntos_revelacion: puntos.puntosRevelacion,
        puntos_decepcion: puntos.puntosDecepcion,
        puntos_total: puntos.puntosTotal,
      })
      .eq("id", pronostico.id);

    if (errorUpdate) {
      console.error(
        `Error actualizando puntos del pronóstico bonus ${pronostico.id}:`,
        errorUpdate.message
      );
    }
  }
}
