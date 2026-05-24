export type TipoPronostico = "1X2" | "MARCADOR" | "EXACTO" | null;

export function obtenerSignoPartido(
  golesLocal: number,
  golesVisitante: number
): "1" | "X" | "2" {
  if (golesLocal > golesVisitante) return "1";
  if (golesLocal < golesVisitante) return "2";
  return "X";
}

export function normalizarTexto(valor: string | null | undefined) {
  return valor?.trim().toLowerCase() || "";
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
    local,
    visitante,
    clasificadoPronosticado,
    clasificadoReal,
  } = params;

  if (pronosticoLocal === null || pronosticoVisitante === null) return 0;

  if (
    pronosticoLocal === resultadoLocal &&
    pronosticoVisitante === resultadoVisitante
  ) {
    return 5;
  }

  const signoPronosticado = obtenerSignoPartido(
    pronosticoLocal,
    pronosticoVisitante
  );

  const signoReal = obtenerSignoPartido(resultadoLocal, resultadoVisitante);

  let clasificadoCalculado: string | null = null;

  if (signoReal === "1") {
    clasificadoCalculado = local;
  } else if (signoReal === "2") {
    clasificadoCalculado = visitante;
  } else {
    clasificadoCalculado = clasificadoReal;
  }

  let clasificadoPronosticoCalculado: string | null = null;

  if (signoPronosticado === "1") {
    clasificadoPronosticoCalculado = local;
  } else if (signoPronosticado === "2") {
    clasificadoPronosticoCalculado = visitante;
  } else {
    clasificadoPronosticoCalculado = clasificadoPronosticado;
  }

  if (
    clasificadoCalculado &&
    clasificadoPronosticoCalculado &&
    normalizarTexto(clasificadoCalculado) ===
      normalizarTexto(clasificadoPronosticoCalculado)
  ) {
    return 3;
  }

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

export function calcularPuntosBonus(params: {
  campeonPronosticado: string | null;
  finalista1Pronosticado: string | null;
  finalista2Pronosticado: string | null;
  botaOroPronosticada: string | null;
  mejorJugadorPronosticado: string | null;
  mejorPorteroPronosticado: string | null;
  revelacionPronosticada: string | null;
  decepcionPronosticada: string | null;
  resultados: Record<string, string | null>;
}) {
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
  ].map(normalizarTexto);

  const finalistas = [
    resultados.finalista_1,
    resultados.finalista_2,
  ].map(normalizarTexto);

  const top3Goleadores = [
    resultados.bota_oro,
    resultados.goleador_top3_1,
    resultados.goleador_top3_2,
    resultados.goleador_top3_3,
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
    revelacionPron === normalizarTexto(resultados.revelacion_resultado)
  ) {
    puntosRevelacion += 14;

    if (normalizarTexto(resultados.revelacion_llega_cuartos) === "si") {
      puntosRevelacion += 5;
    }
  }

  const puntosDecepcion =
    decepcionPron &&
    decepcionPron === normalizarTexto(resultados.decepcion_resultado)
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
