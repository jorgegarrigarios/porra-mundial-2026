import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { obtenerPartidosMundial2026 } from "@/lib/api/football";
import { recalcularPronosticos } from "@/lib/recalcularPronosticos";
import { actualizarCrucesEliminatorias } from "@/lib/actualizarEliminatorias";

type FixtureApiFootball = {
  fixture?: {
    id?: number;
    date?: string;
    status?: {
      short?: string;
      long?: string;
    };
  };
  league?: {
    round?: string;
  };
  teams?: {
    home?: {
      name?: string;
      winner?: boolean | null;
    };
    away?: {
      name?: string;
      winner?: boolean | null;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
};

type FootballApiResponse = {
  get?: string;
  parameters?: Record<string, unknown>;
  errors?: unknown;
  results?: number;
  response?: FixtureApiFootball[];
};

type PartidoSupabase = {
  id: number;
  local: string | null;
  visitante: string | null;
  fecha_inicio: string | null;
  fase: string | null;
  resultado_local: number | null;
  resultado_visitante: number | null;
  estado: string | null;
  clasificado_real: string | null;
  api_fixture_id: number | null;
};

type ActualizacionPartido = {
  resultado_local?: number | null;
  resultado_visitante?: number | null;
  estado?: string | null;
  clasificado_real?: string | null;
  api_fixture_id?: number | null;
};

type CronLogPayload = {
  origen: string;
  ok: boolean;
  fixtures_encontrados: number;
  mapeados: number;
  actualizados: number;
  ignorados: number;
  pronosticos_actualizados: number;
  errores: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

const ESTADOS_FINALIZADOS = new Set(["FT", "AET", "PEN"]);

const ALIAS_EQUIPOS: Record<string, string> = {
  algeria: "argelia",
  argelia: "argelia",

  argentina: "argentina",

  australia: "australia",

  austria: "austria",

  belgium: "belgica",
  bélgica: "belgica",
  belgica: "belgica",

  "bosnia and herzegovina": "bosnia y herzegovina",
  "bosnia & herzegovina": "bosnia y herzegovina",
  "bosnia herzegovina": "bosnia y herzegovina",
  bosnia: "bosnia y herzegovina",
  "bosnia y herzegovina": "bosnia y herzegovina",

  brazil: "brasil",
  brasil: "brasil",

  "cape verde": "cabo verde",
  "cape verde islands": "cabo verde",
  "cabo verde": "cabo verde",

  canada: "canada",
  canadá: "canada",

  colombia: "colombia",

  croatia: "croacia",
  croacia: "croacia",

  curacao: "curazao",
  curaçao: "curazao",
  curazao: "curazao",

  "czech republic": "chequia",
  czechia: "chequia",
  czech: "chequia",
  chequia: "chequia",

  "congo dr": "rd congo",
  "dr congo": "rd congo",
  congo: "rd congo",
  "rd congo": "rd congo",

  ecuador: "ecuador",

  egypt: "egipto",
  egipto: "egipto",

  england: "inglaterra",
  inglaterra: "inglaterra",

  france: "francia",
  francia: "francia",

  germany: "alemania",
  alemania: "alemania",

  ghana: "ghana",

  haiti: "haiti",
  haití: "haiti",

  iran: "iran",
  irán: "iran",

  iraq: "irak",
  irak: "irak",

  "ivory coast": "costa de marfil",
  ivory: "costa de marfil",
  "costa de marfil": "costa de marfil",

  japan: "japon",
  japón: "japon",
  japon: "japon",

  jordan: "jordania",
  jordania: "jordania",

  mexico: "mexico",
  méxico: "mexico",

  morocco: "marruecos",
  marruecos: "marruecos",

  netherlands: "paises bajos",
  holland: "paises bajos",
  "paises bajos": "paises bajos",
  "países bajos": "paises bajos",

  "new zealand": "nueva zelanda",
  "nueva zelanda": "nueva zelanda",

  norway: "noruega",
  noruega: "noruega",

  panama: "panama",
  panamá: "panama",

  paraguay: "paraguay",

  portugal: "portugal",

  qatar: "catar",
  catar: "catar",

  "saudi arabia": "arabia saudi",
  "arabia saudí": "arabia saudi",
  "arabia saudi": "arabia saudi",

  scotland: "escocia",
  escocia: "escocia",

  senegal: "senegal",

  "south africa": "sudafrica",
  sudafrica: "sudafrica",
  sudáfrica: "sudafrica",

  "south korea": "corea del sur",
  "korea republic": "corea del sur",
  "corea del sur": "corea del sur",

  spain: "espana",
  españa: "espana",
  espana: "espana",

  sweden: "suecia",
  suecia: "suecia",

  switzerland: "suiza",
  suiza: "suiza",

  tunisia: "tunez",
  túnez: "tunez",
  tunez: "tunez",

  turkey: "turquia",
  turkiye: "turquia",
  türkiye: "turquia",
  turquía: "turquia",
  turquia: "turquia",

  uruguay: "uruguay",

  usa: "estados unidos",
  "united states": "estados unidos",
  "estados unidos": "estados unidos",

  uzbekistan: "uzbekistan",
  uzbekistán: "uzbekistan",
};

function crearSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function guardarCronLog(payload: CronLogPayload) {
  try {
    const supabaseAdmin = crearSupabaseAdmin();

    const { error } = await supabaseAdmin.from("cron_logs").insert(payload);

    if (error) {
      console.error("Error guardando cron_logs:", error.message);
    }
  } catch (error) {
    console.error(
      "Error inesperado guardando cron_logs:",
      error instanceof Error ? error.message : error
    );
  }
}

function normalizarTexto(valor: string | null | undefined) {
  const limpio = valor?.trim().toLowerCase() ?? "";

  return limpio
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarEquipo(valor: string | null | undefined) {
  const normalizado = normalizarTexto(valor);
  return ALIAS_EQUIPOS[normalizado] ?? normalizado;
}

function obtenerBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authorization.slice("bearer ".length).trim();
}

function validarCron(request: Request) {
  if (!CRON_SECRET) {
    throw new Error("Falta configurar CRON_SECRET en variables de entorno.");
  }

  const token = obtenerBearerToken(request);

  return token === CRON_SECRET;
}

function mismaFecha(fechaA: string | null, fechaB: string | null | undefined) {
  if (!fechaA || !fechaB) return false;

  const a = new Date(fechaA);
  const b = new Date(fechaB);

  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;

  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

function fixtureFinalizado(fixture: FixtureApiFootball) {
  const estado = fixture.fixture?.status?.short ?? "";
  return ESTADOS_FINALIZADOS.has(estado);
}

function equiposCoinciden(
  equipoA: string | null | undefined,
  equipoB: string | null | undefined
) {
  const normalizadoA = normalizarEquipo(equipoA);
  const normalizadoB = normalizarEquipo(equipoB);

  return Boolean(normalizadoA && normalizadoB && normalizadoA === normalizadoB);
}

type MapeoResultadoFixture = {
  resultadoLocal: number;
  resultadoVisitante: number;
  clasificadoReal: string | null;
  orden: "directo" | "invertido";
};

function crearMapeoResultadoFixture(
  fixture: FixtureApiFootball,
  partido: PartidoSupabase,
  golesHome: number,
  golesAway: number
): MapeoResultadoFixture | null {
  const homeApi = fixture.teams?.home?.name;
  const awayApi = fixture.teams?.away?.name;
  const homeWinner = fixture.teams?.home?.winner;
  const awayWinner = fixture.teams?.away?.winner;

  const homeEsLocal = equiposCoinciden(homeApi, partido.local);
  const awayEsVisitante = equiposCoinciden(awayApi, partido.visitante);

  if (homeEsLocal && awayEsVisitante) {
    return {
      resultadoLocal: golesHome,
      resultadoVisitante: golesAway,
      clasificadoReal:
        homeWinner === true
          ? partido.local
          : awayWinner === true
          ? partido.visitante
          : null,
      orden: "directo",
    };
  }

  const homeEsVisitante = equiposCoinciden(homeApi, partido.visitante);
  const awayEsLocal = equiposCoinciden(awayApi, partido.local);

  if (homeEsVisitante && awayEsLocal) {
    return {
      resultadoLocal: golesAway,
      resultadoVisitante: golesHome,
      clasificadoReal:
        homeWinner === true
          ? partido.visitante
          : awayWinner === true
          ? partido.local
          : null,
      orden: "invertido",
    };
  }

  return null;
}

function buscarPartidoParaFixture(
  fixture: FixtureApiFootball,
  partidos: PartidoSupabase[]
) {
  const fixtureId = fixture.fixture?.id ?? null;

  if (fixtureId) {
    const porId = partidos.find((partido) => partido.api_fixture_id === fixtureId);

    if (porId) return porId;
  }

  const home = normalizarEquipo(fixture.teams?.home?.name);
  const away = normalizarEquipo(fixture.teams?.away?.name);
  const fechaFixture = fixture.fixture?.date ?? null;

  if (!home || !away || !fechaFixture) return null;

  return (
    partidos.find((partido) => {
      const local = normalizarEquipo(partido.local);
      const visitante = normalizarEquipo(partido.visitante);

      return (
        mismaFecha(partido.fecha_inicio, fechaFixture) &&
        local === home &&
        visitante === away
      );
    }) ??
    partidos.find((partido) => {
      const local = normalizarEquipo(partido.local);
      const visitante = normalizarEquipo(partido.visitante);

      return (
        mismaFecha(partido.fecha_inicio, fechaFixture) &&
        local === away &&
        visitante === home
      );
    }) ??
    null
  );
}

function crearActualizacion(
  fixture: FixtureApiFootball,
  partido: PartidoSupabase
): ActualizacionPartido | null {
  const fixtureId = fixture.fixture?.id ?? null;
  const estadoApi = fixture.fixture?.status?.short ?? null;
  const golesLocal = fixture.goals?.home ?? null;
  const golesVisitante = fixture.goals?.away ?? null;
  const finalizado = fixtureFinalizado(fixture);

  const actualizacion: ActualizacionPartido = {};

  if (fixtureId && partido.api_fixture_id !== fixtureId) {
    actualizacion.api_fixture_id = fixtureId;
  }

  if (estadoApi && partido.estado !== estadoApi) {
    actualizacion.estado = estadoApi;
  }

  if (!finalizado) {
    return Object.keys(actualizacion).length > 0 ? actualizacion : null;
  }

  if (golesLocal === null || golesVisitante === null) {
    return Object.keys(actualizacion).length > 0 ? actualizacion : null;
  }

  const mapeoResultado = crearMapeoResultadoFixture(
    fixture,
    partido,
    golesLocal,
    golesVisitante
  );

  if (!mapeoResultado) {
    return Object.keys(actualizacion).length > 0 ? actualizacion : null;
  }

  /*
    Blindaje importante:
    API-FOOTBALL devuelve los goles como home/away, pero en nuestra tabla
    el partido puede estar guardado en el orden local/visitante contrario.

    Por eso antes de guardar el resultado comparamos los nombres reales de la
    API con local/visitante. Si el orden está invertido, también invertimos los
    goles y el clasificado_real para respetar el orden que vieron los usuarios
    al hacer sus pronósticos.
  */
  if (
    partido.resultado_local !== mapeoResultado.resultadoLocal ||
    partido.resultado_visitante !== mapeoResultado.resultadoVisitante
  ) {
    actualizacion.resultado_local = mapeoResultado.resultadoLocal;
    actualizacion.resultado_visitante = mapeoResultado.resultadoVisitante;
  }

  const clasificadoReal = mapeoResultado.clasificadoReal;

  if (clasificadoReal && partido.clasificado_real !== clasificadoReal) {
    actualizacion.clasificado_real = clasificadoReal;
  }

  return Object.keys(actualizacion).length > 0 ? actualizacion : null;
}

function extraerErroresFootballApi(dataApi: FootballApiResponse) {
  const errores = dataApi.errors;

  if (!errores) return "";

  if (Array.isArray(errores) && errores.length === 0) return "";

  if (typeof errores === "object" && Object.keys(errores).length === 0) {
    return "";
  }

  if (typeof errores === "string") return errores;

  return JSON.stringify(errores);
}

async function importarResultadosDesdeApi() {
  const supabaseAdmin = crearSupabaseAdmin();

  const { data: partidosData, error: partidosError } = await supabaseAdmin
    .from("partidos")
    .select(
      "id, local, visitante, fecha_inicio, fase, resultado_local, resultado_visitante, estado, clasificado_real, api_fixture_id"
    )
    .order("fecha_inicio", { ascending: true, nullsFirst: false });

  if (partidosError) {
    throw new Error(`Error cargando partidos: ${partidosError.message}`);
  }

  const partidos = (partidosData ?? []) as PartidoSupabase[];
  const dataApi = (await obtenerPartidosMundial2026()) as FootballApiResponse;

  const erroresFootballApi = extraerErroresFootballApi(dataApi);

  if (erroresFootballApi) {
    return {
      ok: false,
      resumen: {
        fixturesEncontrados: 0,
        mapeados: 0,
        actualizados: 0,
        ignorados: 0,
        pronosticosActualizados: 0,
      },
      errores: [`Football API ha devuelto errores: ${erroresFootballApi}`],
    };
  }

  const fixtures = Array.isArray(dataApi?.response)
    ? (dataApi.response as FixtureApiFootball[])
    : [];

  let fixturesEncontrados = fixtures.length;
  let mapeados = 0;
  let actualizados = 0;
  let ignorados = 0;

  const errores: string[] = [];

  for (const fixture of fixtures) {
    const partido = buscarPartidoParaFixture(fixture, partidos);

    if (!partido) {
      ignorados += 1;
      continue;
    }

    mapeados += 1;

    const actualizacion = crearActualizacion(fixture, partido);

    if (!actualizacion) {
      ignorados += 1;
      continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from("partidos")
      .update(actualizacion)
      .eq("id", partido.id);

    if (updateError) {
      errores.push(
        `${partido.local ?? "Local"} - ${
          partido.visitante ?? "Visitante"
        }: ${updateError.message}`
      );
      continue;
    }

    Object.assign(partido, actualizacion);
    actualizados += 1;
  }

  const recalculo = await recalcularPronosticos();

  if (!recalculo.ok) {
    errores.push(recalculo.error ?? "No se pudieron recalcular los pronósticos.");
  }

  let eliminatorias: {
    ok: boolean;
    actualizados: number;
    horariosActualizados: number;
    tercerosPendientes: number;
    crucesFuturosPendientes: number;
    error: string | null;
  } | null = null;

  try {
    const resultadoEliminatorias = await actualizarCrucesEliminatorias({
      dryRun: false,
      force: false,
    });

    eliminatorias = {
      ok: resultadoEliminatorias.ok,
      actualizados: resultadoEliminatorias.resumen?.actualizados ?? 0,
      horariosActualizados:
        resultadoEliminatorias.resumen?.horariosActualizados ?? 0,
      tercerosPendientes:
        resultadoEliminatorias.resumen?.tercerosPendientes ?? 0,
      crucesFuturosPendientes:
        resultadoEliminatorias.resumen?.crucesFuturosPendientes ?? 0,
      error:
        resultadoEliminatorias.ok
          ? null
          : resultadoEliminatorias.error ??
            resultadoEliminatorias.errores?.join(" | ") ??
            "No se pudieron actualizar las eliminatorias.",
    };

    if (!resultadoEliminatorias.ok) {
      errores.push(`Eliminatorias: ${eliminatorias.error}`);
    }
  } catch (error) {
    const mensajeEliminatorias =
      error instanceof Error
        ? error.message
        : "Error desconocido actualizando eliminatorias.";

    eliminatorias = {
      ok: false,
      actualizados: 0,
      horariosActualizados: 0,
      tercerosPendientes: 0,
      crucesFuturosPendientes: 0,
      error: mensajeEliminatorias,
    };

    errores.push(`Eliminatorias: ${mensajeEliminatorias}`);
  }

  return {
    ok: errores.length === 0,
    resumen: {
      fixturesEncontrados,
      mapeados,
      actualizados,
      ignorados,
      pronosticosActualizados: recalculo.actualizados ?? 0,
      eliminatorias,
    },
    errores,
  };
}

export async function GET(request: Request) {
  const origen = "vercel-cron";
  const ejecutadoEn = new Date().toISOString();

  try {
    if (!validarCron(request)) {
      await guardarCronLog({
        origen,
        ok: false,
        fixtures_encontrados: 0,
        mapeados: 0,
        actualizados: 0,
        ignorados: 0,
        pronosticos_actualizados: 0,
        errores: "No autorizado.",
      });

      return NextResponse.json(
        { ok: false, error: "No autorizado.", origen, ejecutadoEn },
        { status: 401 }
      );
    }

    const resultado = await importarResultadosDesdeApi();

    await guardarCronLog({
      origen,
      ok: resultado.ok,
      fixtures_encontrados: resultado.resumen.fixturesEncontrados,
      mapeados: resultado.resumen.mapeados,
      actualizados: resultado.resumen.actualizados,
      ignorados: resultado.resumen.ignorados,
      pronosticos_actualizados: resultado.resumen.pronosticosActualizados,
      errores:
        resultado.errores && resultado.errores.length > 0
          ? resultado.errores.join(" | ")
          : null,
    });

    return NextResponse.json({
      ...resultado,
      origen,
      ejecutadoEn,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido ejecutando cron de resultados.";

    await guardarCronLog({
      origen,
      ok: false,
      fixtures_encontrados: 0,
      mapeados: 0,
      actualizados: 0,
      ignorados: 0,
      pronosticos_actualizados: 0,
      errores: message,
    });

    return NextResponse.json(
      {
        ok: false,
        error: message,
        origen,
        ejecutadoEn,
      },
      { status: 500 }
    );
  }
}
