import { supabase } from "@/lib/supabase";

export type TipoPronostico = "1X2" | "MARCADOR" | "EXACTO" | null;

type ResultadoPuntosBonus = {
  puntosCampeon: number;
  puntosFinalistas: number;
  puntosBotaOro: number;
  puntosMejorJugador: number;
  puntosMejorPortero: number;
  puntosRevelacion: number;
  puntosDecepcion: number;
  puntosTotal: number;
};

type CalcularPuntosBonusParams = {
  campeonPronosticado: string | null;
  finalista1Pronosticado: string | null;
  finalista2Pronosticado: string | null;
  botaOroPronosticada: string | null;
  mejorJugadorPronosticado: string | null;
  mejorPorteroPronosticado: string | null;
  revelacionPronosticada: string | null;
  decepcionPronosticada: string | null;
  resultados: Record<string, string | null>;
};

type ResultadoRecalculoBonus = {
  ok: boolean;
  actualizados?: number;
  error?: string;
};

type FilaGenerica = Record<string, unknown>;

export function obtenerSignoPartido(
  golesLocal: number,
  golesVisitante: number
): "1" | "X" | "2" {
  if (golesLocal > golesVisitante) return "1";
  if (golesLocal < golesVisitante) return "2";
  return "X";
}

export function normalizarTexto(valor: string | null | undefined) {
  return (valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function obtenerTexto(
  fila: FilaGenerica,
  claves: string[]
): string | null {
  for (const clave of claves) {
    const valor = fila[clave];

    if (typeof valor === "string" && valor.trim()) {
      return valor;
    }
  }

  return null;
}

function crearMapaResultados(
  filas: Array<{ clave: string; valor: string | null }>
) {
  return filas.reduce<Record<string, string | null>>((acc, fila) => {
    acc[fila.clave] = fila.valor;
    return acc;
  }, {});
}

export function calcularPuntosGrupo1X2(
  signoPronosticado: string | null,
  resultadoLocal: number,
  resultadoVisitante: number
) {
  if (!signoPronosticado) return 0;

  const signoReal = obtenerSignoPartido(resultadoLocal, resultadoVisitante);

  return signoPronosticado === signoReal ? 3 : 0;
}

export function calcularPuntosEliminatoria(params: {
  pronosticoLocal: number | null;
  pronosticoVisitante: number | null;
  resultadoLocal: number;
  resultadoVisitante: number;
  local: string;
  visitante: string;
  clasificadoPronosticado: string | null;
  clasificadoReal: string | null;
}) {
  const {
    pronosticoLocal,
    pronosticoVisitante,
    resultadoLocal,
    resultadoVisitante,
    clasificadoPronosticado,
    clasificadoReal,
  } = params;

  if (pronosticoLocal === null || pronosticoVisitante === null) return 0;

  const signoPronosticado = obtenerSignoPartido(
    pronosticoLocal,
    pronosticoVisitante
  );

  const signoReal = obtenerSignoPartido(resultadoLocal, resultadoVisitante);

  const resultadoExacto =
    pronosticoLocal === resultadoLocal &&
    pronosticoVisitante === resultadoVisitante;

  const diferenciaPronosticada = pronosticoLocal - pronosticoVisitante;
  const diferenciaReal = resultadoLocal - resultadoVisitante;
  const diferenciaCorrecta = diferenciaPronosticada === diferenciaReal;

  /*
    Regla especial de eliminatorias con empate real:
    - El marcador del partido y el clasificado son dos partes del pronóstico.
    - Acertar el marcador exacto sin acertar el clasificado no puede ser pleno.
    - Acertar el empate y el clasificado sin marcador exacto equivale al acierto de signo.
    - Acertar empate pero fallar clasificado conserva solo un acierto parcial.
  */
  if (signoReal === "X") {
    const clasificadoCorrecto =
      Boolean(clasificadoPronosticado) &&
      Boolean(clasificadoReal) &&
      normalizarTexto(clasificadoPronosticado) === normalizarTexto(clasificadoReal);

    if (resultadoExacto && clasificadoCorrecto) return 5;
    if (resultadoExacto) return 3;
    if (signoPronosticado === "X" && clasificadoCorrecto) return 3;
    if (signoPronosticado === "X" && diferenciaCorrecta) return 1;

    return 0;
  }

  if (resultadoExacto) return 5;

  if (signoPronosticado === signoReal) return 3;

  if (diferenciaCorrecta) return 1;

  return 0;
}
export function calcularPuntosClasificadosGrupo(params: {
  pronosticoClasificado1: string | null;
  pronosticoClasificado2: string | null;
  resultadoClasificado1: string | null;
  resultadoClasificado2: string | null;
}) {
  const {
    pronosticoClasificado1,
    pronosticoClasificado2,
    resultadoClasificado1,
    resultadoClasificado2,
  } = params;

  if (
    !pronosticoClasificado1 ||
    !pronosticoClasificado2 ||
    !resultadoClasificado1 ||
    !resultadoClasificado2
  ) {
    return {
      puntosClasificado1: 0,
      puntosClasificado2: 0,
      puntosBonusDosAcertados: 0,
      puntosBonusOrden: 0,
      puntosTotal: 0,
    };
  }

  const pronostico1 = normalizarTexto(pronosticoClasificado1);
  const pronostico2 = normalizarTexto(pronosticoClasificado2);
  const resultado1 = normalizarTexto(resultadoClasificado1);
  const resultado2 = normalizarTexto(resultadoClasificado2);

  const reales = [resultado1, resultado2];

  const aciertaClasificado1 = reales.includes(pronostico1);
  const aciertaClasificado2 = reales.includes(pronostico2);

  const puntosClasificado1 = aciertaClasificado1 ? 2 : 0;
  const puntosClasificado2 = aciertaClasificado2 ? 2 : 0;

  const aciertaLosDos =
    aciertaClasificado1 &&
    aciertaClasificado2 &&
    new Set([pronostico1, pronostico2]).size === 2;

  const puntosBonusDosAcertados = aciertaLosDos ? 1 : 0;

  const aciertaOrden = pronostico1 === resultado1 && pronostico2 === resultado2;

  const puntosBonusOrden = aciertaLosDos && aciertaOrden ? 1 : 0;

  const puntosTotal =
    puntosClasificado1 +
    puntosClasificado2 +
    puntosBonusDosAcertados +
    puntosBonusOrden;

  return {
    puntosClasificado1,
    puntosClasificado2,
    puntosBonusDosAcertados,
    puntosBonusOrden,
    puntosTotal,
  };
}

function calcularPuntosBonusInterno(
  params: CalcularPuntosBonusParams
): ResultadoPuntosBonus {
  const {
    campeonPronosticado,
    finalista1Pronosticado,
    finalista2Pronosticado,
    botaOroPronosticada,
    mejorJugadorPronosticado,
    mejorPorteroPronosticado,
    revelacionPronosticada,
    decepcionPronosticada,
    resultados,
  } = params;

  const campeon = normalizarTexto(resultados.campeon);
  const subcampeon = normalizarTexto(resultados.subcampeon);

  const semifinalistas = [
    resultados.semifinalista_1,
    resultados.semifinalista_2,
    resultados.semifinalista_3,
    resultados.semifinalista_4,
  ]
    .map(normalizarTexto)
    .filter(Boolean);

  const finalistas = [
    resultados.finalista_1,
    resultados.finalista_2,
  ]
    .map(normalizarTexto)
    .filter(Boolean);

  const top3Goleadores = [
    resultados.bota_oro,
    resultados.top_goleador_1,
    resultados.top_goleador_2,
    resultados.top_goleador_3,
  ]
    .map(normalizarTexto)
    .filter(Boolean);

  const campeonPron = normalizarTexto(campeonPronosticado);
  const finalista1Pron = normalizarTexto(finalista1Pronosticado);
  const finalista2Pron = normalizarTexto(finalista2Pronosticado);
  const botaOroPron = normalizarTexto(botaOroPronosticada);
  const mejorJugadorPron = normalizarTexto(mejorJugadorPronosticado);
  const mejorPorteroPron = normalizarTexto(mejorPorteroPronosticado);
  const revelacionPron = normalizarTexto(revelacionPronosticada);
  const decepcionPron = normalizarTexto(decepcionPronosticada);

  let puntosCampeon = 0;

  if (campeonPron && campeonPron === campeon) {
    puntosCampeon = 20;
  } else if (campeonPron && campeonPron === subcampeon) {
    puntosCampeon = 8;
  } else if (campeonPron && semifinalistas.includes(campeonPron)) {
    puntosCampeon = 4;
  }

  const finalistasPronosticados = [finalista1Pron, finalista2Pron].filter(Boolean);

  const finalistasAcertados = finalistasPronosticados.filter((finalista) =>
    finalistas.includes(finalista)
  );

  const puntosBaseFinalistas = finalistasAcertados.length * 7;

  const aciertaAmbosFinalistas =
    finalistasAcertados.length === 2 &&
    new Set(finalistasPronosticados).size === 2;

  const puntosFinalistas = puntosBaseFinalistas + (aciertaAmbosFinalistas ? 4 : 0);

  let puntosBotaOro = 0;

  if (botaOroPron && botaOroPron === normalizarTexto(resultados.bota_oro)) {
    puntosBotaOro = 14;
  } else if (botaOroPron && top3Goleadores.includes(botaOroPron)) {
    puntosBotaOro = 5;
  }

  const puntosMejorJugador =
    mejorJugadorPron &&
    mejorJugadorPron === normalizarTexto(resultados.mejor_jugador)
      ? 10
      : 0;

  const puntosMejorPortero =
    mejorPorteroPron &&
    mejorPorteroPron === normalizarTexto(resultados.mejor_portero)
      ? 8
      : 0;

  let puntosRevelacion = 0;

  if (
    revelacionPron &&
    revelacionPron === normalizarTexto(resultados.seleccion_revelacion)
  ) {
    puntosRevelacion += 14;

    if (
      revelacionPron === normalizarTexto(resultados.revelacion_llega_cuartos)
    ) {
      puntosRevelacion += 5;
    }
  }

  const puntosDecepcion =
    decepcionPron &&
    decepcionPron === normalizarTexto(resultados.seleccion_decepcion)
      ? 14
      : 0;

  const puntosTotal =
    puntosCampeon +
    puntosFinalistas +
    puntosBotaOro +
    puntosMejorJugador +
    puntosMejorPortero +
    puntosRevelacion +
    puntosDecepcion;

  return {
    puntosCampeon,
    puntosFinalistas,
    puntosBotaOro,
    puntosMejorJugador,
    puntosMejorPortero,
    puntosRevelacion,
    puntosDecepcion,
    puntosTotal,
  };
}

export function calcularPuntosBonus(
  params: CalcularPuntosBonusParams
): ResultadoPuntosBonus;
export function calcularPuntosBonus(): Promise<ResultadoRecalculoBonus>;
export function calcularPuntosBonus(
  params?: CalcularPuntosBonusParams
): ResultadoPuntosBonus | Promise<ResultadoRecalculoBonus> {
  if (!params) {
    return recalcularPuntosBonus();
  }

  return calcularPuntosBonusInterno(params);
}

export async function recalcularPuntosBonus(): Promise<ResultadoRecalculoBonus> {
  const { data: resultadosData, error: resultadosError } = await supabase
    .from("resultados_bonus")
    .select("clave, valor");

  if (resultadosError) {
    return {
      ok: false,
      error: `Error cargando resultados_bonus: ${resultadosError.message}`,
    };
  }

  const resultados = crearMapaResultados(resultadosData ?? []);

  const { data: pronosticos, error: pronosticosError } = await supabase
    .from("pronosticos_bonus")
    .select("*");

  if (pronosticosError) {
    return {
      ok: false,
      error: `Error cargando pronosticos_bonus: ${pronosticosError.message}`,
    };
  }

  let actualizados = 0;

  for (const pronostico of pronosticos ?? []) {
    const fila = pronostico as FilaGenerica;

    const puntos = calcularPuntosBonusInterno({
      campeonPronosticado: obtenerTexto(fila, [
        "campeon",
        "campeon_pronosticado",
        "pronostico_campeon",
      ]),
      finalista1Pronosticado: obtenerTexto(fila, [
        "finalista_1",
        "finalista1",
        "finalista_1_pronosticado",
        "pronostico_finalista_1",
      ]),
      finalista2Pronosticado: obtenerTexto(fila, [
        "finalista_2",
        "finalista2",
        "finalista_2_pronosticado",
        "pronostico_finalista_2",
      ]),
      botaOroPronosticada: obtenerTexto(fila, [
        "bota_oro",
        "bota_oro_pronosticada",
        "pronostico_bota_oro",
      ]),
      mejorJugadorPronosticado: obtenerTexto(fila, [
        "mejor_jugador",
        "mejor_jugador_pronosticado",
        "pronostico_mejor_jugador",
      ]),
      mejorPorteroPronosticado: obtenerTexto(fila, [
        "mejor_portero",
        "mejor_portero_pronosticado",
        "pronostico_mejor_portero",
      ]),
      revelacionPronosticada: obtenerTexto(fila, [
        "seleccion_revelacion",
        "revelacion",
        "revelacion_pronosticada",
        "pronostico_revelacion",
      ]),
      decepcionPronosticada: obtenerTexto(fila, [
        "seleccion_decepcion",
        "decepcion",
        "decepcion_pronosticada",
        "pronostico_decepcion",
      ]),
      resultados,
    });

    const actualizacion: Record<string, number> = {};

    const columnasPosibles: Record<string, number> = {
      puntos_campeon: puntos.puntosCampeon,
      puntos_finalistas: puntos.puntosFinalistas,
      puntos_bota_oro: puntos.puntosBotaOro,
      puntos_mejor_jugador: puntos.puntosMejorJugador,
      puntos_mejor_portero: puntos.puntosMejorPortero,
      puntos_revelacion: puntos.puntosRevelacion,
      puntos_decepcion: puntos.puntosDecepcion,
      puntos_total: puntos.puntosTotal,
      puntos_total_bonus: puntos.puntosTotal,
      puntos_bonus: puntos.puntosTotal,
    };

    for (const [columna, valor] of Object.entries(columnasPosibles)) {
      if (columna in fila) {
        actualizacion[columna] = valor;
      }
    }

    if (Object.keys(actualizacion).length === 0) {
      continue;
    }

    const id = fila.id;

    if (typeof id !== "number" && typeof id !== "string") {
      continue;
    }

    const { error: updateError } = await supabase
      .from("pronosticos_bonus")
      .update(actualizacion)
      .eq("id", id);

    if (updateError) {
      return {
        ok: false,
        error: `Error actualizando pronostico_bonus ${id}: ${updateError.message}`,
      };
    }

    actualizados += 1;
  }

  return {
    ok: true,
    actualizados,
  };
}

export function calcularPuntos(
  pronosticoLocal: number,
  pronosticoVisitante: number,
  resultadoLocal: number,
  resultadoVisitante: number
) {
  if (
    pronosticoLocal === resultadoLocal &&
    pronosticoVisitante === resultadoVisitante
  ) {
    return 5;
  }

  const pronosticoDif = pronosticoLocal - pronosticoVisitante;
  const resultadoDif = resultadoLocal - resultadoVisitante;

  if (
    (pronosticoDif > 0 && resultadoDif > 0) ||
    (pronosticoDif < 0 && resultadoDif < 0) ||
    (pronosticoDif === 0 && resultadoDif === 0)
  ) {
    return 3;
  }

  if (pronosticoDif === resultadoDif) {
    return 1;
  }

  return 0;
}
