import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { footballFetch, obtenerPartidosMundial2026 } from "@/lib/api/football";

type StandingItem = {
  rank?: number;
  group?: string;
  team?: {
    id?: number;
    name?: string;
  };
  all?: {
    played?: number;
  };
};

type FootballStandingsResponse = {
  errors?: unknown;
  response?: Array<{
    league?: {
      standings?: StandingItem[][];
    };
  }>;
};

type FixtureApiFootball = {
  fixture?: {
    id?: number;
    date?: string;
    venue?: {
      name?: string | null;
      city?: string | null;
    };
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
};

type FootballFixturesResponse = {
  errors?: unknown;
  response?: FixtureApiFootball[];
};

type PartidoSupabase = {
  id: number;
  local: string | null;
  visitante: string | null;
  local_code: string | null;
  visitante_code: string | null;
  fecha_inicio: string | null;
  estadio: string | null;
  ciudad: string | null;
  fase: string | null;
  grupo: string | null;
  resultado_local: number | null;
  resultado_visitante: number | null;
  estado: string | null;
  clasificado_real: string | null;
  api_fixture_id: number | null;
};

type GrupoCerrado = {
  grupo: string;
  letra: string;
  primero: string;
  segundo: string;
  tercero: string | null;
};

type ReferenciaCruce = {
  fifaMatchNumber: number;
  fecha_inicio: string;
  fase: string;
  localRef: string;
  visitanteRef: string;
};

type ActualizacionPartido = {
  local?: string | null;
  visitante?: string | null;
  local_code?: string | null;
  visitante_code?: string | null;
  fecha_inicio?: string | null;
  estadio?: string | null;
  ciudad?: string | null;
  api_fixture_id?: number | null;
};

type OrigenCambio = "fixtures" | "standings" | "bracket";

type CambioPrevisto = {
  partidoId: number;
  campo: "local" | "visitante";
  anterior: string | null;
  nuevo: string;
  origen: OrigenCambio;
  codigo?: string | null;
};

type CambioHorarioPrevisto = {
  partidoId: number;
  anterior: string | null;
  nuevo: string;
  origen: "fixtures" | "calendario_oficial";
  apiFixtureId?: number | null;
  estadioAnterior?: string | null;
  estadioNuevo?: string | null;
  ciudadAnterior?: string | null;
  ciudadNueva?: string | null;
};

type ResolucionReferencia = {
  valor: string;
  origen: OrigenCambio;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const NOMBRES_EQUIPOS_ES: Record<string, string> = {
  Algeria: "Argelia",
  Argentina: "Argentina",
  Australia: "Australia",
  Austria: "Austria",
  Belgium: "Bélgica",
  "Bosnia & Herzegovina": "Bosnia y Herzegovina",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  Brazil: "Brasil",
  "Cape Verde": "Cabo Verde",
  "Cape Verde Islands": "Cabo Verde",
  Canada: "Canadá",
  Colombia: "Colombia",
  "Congo DR": "RD Congo",
  "DR Congo": "RD Congo",
  Croatia: "Croacia",
  Curacao: "Curazao",
  "Curaçao": "Curazao",
  "Czech Republic": "Chequia",
  Czechia: "Chequia",
  Ecuador: "Ecuador",
  Egypt: "Egipto",
  England: "Inglaterra",
  France: "Francia",
  Germany: "Alemania",
  Ghana: "Ghana",
  Haiti: "Haití",
  Iran: "Irán",
  Iraq: "Irak",
  Ivory: "Costa de Marfil",
  "Ivory Coast": "Costa de Marfil",
  Japan: "Japón",
  Jordan: "Jordania",
  Mexico: "México",
  Morocco: "Marruecos",
  Netherlands: "Países Bajos",
  "New Zealand": "Nueva Zelanda",
  Norway: "Noruega",
  Panama: "Panamá",
  Paraguay: "Paraguay",
  Portugal: "Portugal",
  Qatar: "Catar",
  "Saudi Arabia": "Arabia Saudí",
  Scotland: "Escocia",
  Senegal: "Senegal",
  "South Africa": "Sudáfrica",
  "South Korea": "Corea del Sur",
  Spain: "España",
  Sweden: "Suecia",
  Switzerland: "Suiza",
  Tunisia: "Túnez",
  Turkey: "Turquía",
  Turkiye: "Turquía",
  Türkiye: "Turquía",
  Uruguay: "Uruguay",
  USA: "Estados Unidos",
  "United States": "Estados Unidos",
  Uzbekistan: "Uzbekistán",
};

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
  "congo dr": "rd congo",
  "dr congo": "rd congo",
  congo: "rd congo",
  "rd congo": "rd congo",
  croatia: "croacia",
  croacia: "croacia",
  curacao: "curazao",
  curaçao: "curazao",
  curazao: "curazao",
  "czech republic": "chequia",
  czechia: "chequia",
  chequia: "chequia",
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
  ivory: "costa de marfil",
  "ivory coast": "costa de marfil",
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
  "países bajos": "paises bajos",
  "paises bajos": "paises bajos",
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

/*
  Referencias oficiales de eliminatorias en UTC.

  IMPORTANTE:
  - Los IDs 105-136 son los IDs actuales de tu tabla partidos.
  - La ruta usa API-FOOTBALL como prioridad cuando ya devuelve equipos reales.
  - Estas referencias son red de seguridad para corregir horarios y placeholders
    de octavos, cuartos, semifinales, tercer puesto y final.
  - No toca pronósticos, puntos, ranking, ligas, usuarios ni RLS.
*/
const REFERENCIAS_CRUCES_ELIMINATORIAS: Record<number, ReferenciaCruce> = {
  105: { fifaMatchNumber: 73, fecha_inicio: "2026-06-28T19:00:00.000Z", fase: "Dieciseisavos", localRef: "2A", visitanteRef: "2B" },
  106: { fifaMatchNumber: 76, fecha_inicio: "2026-06-29T17:00:00.000Z", fase: "Dieciseisavos", localRef: "1C", visitanteRef: "2F" },
  107: { fifaMatchNumber: 74, fecha_inicio: "2026-06-29T20:30:00.000Z", fase: "Dieciseisavos", localRef: "1E", visitanteRef: "3A/B/C/D/F" },
  108: { fifaMatchNumber: 75, fecha_inicio: "2026-06-30T01:00:00.000Z", fase: "Dieciseisavos", localRef: "1F", visitanteRef: "2C" },
  109: { fifaMatchNumber: 77, fecha_inicio: "2026-06-30T21:00:00.000Z", fase: "Dieciseisavos", localRef: "1I", visitanteRef: "3C/D/F/G/H" },
  110: { fifaMatchNumber: 78, fecha_inicio: "2026-06-30T17:00:00.000Z", fase: "Dieciseisavos", localRef: "2E", visitanteRef: "2I" },
  111: { fifaMatchNumber: 79, fecha_inicio: "2026-07-01T01:00:00.000Z", fase: "Dieciseisavos", localRef: "1A", visitanteRef: "3C/E/F/H/I" },
  112: { fifaMatchNumber: 80, fecha_inicio: "2026-07-01T16:00:00.000Z", fase: "Dieciseisavos", localRef: "1L", visitanteRef: "3E/H/I/J/K" },
  113: { fifaMatchNumber: 81, fecha_inicio: "2026-07-02T00:00:00.000Z", fase: "Dieciseisavos", localRef: "1D", visitanteRef: "3B/E/F/I/J" },
  114: { fifaMatchNumber: 82, fecha_inicio: "2026-07-01T20:00:00.000Z", fase: "Dieciseisavos", localRef: "1G", visitanteRef: "3A/E/H/I/J" },
  115: { fifaMatchNumber: 83, fecha_inicio: "2026-07-02T23:00:00.000Z", fase: "Dieciseisavos", localRef: "2K", visitanteRef: "2L" },
  116: { fifaMatchNumber: 84, fecha_inicio: "2026-07-02T19:00:00.000Z", fase: "Dieciseisavos", localRef: "1H", visitanteRef: "2J" },
  117: { fifaMatchNumber: 85, fecha_inicio: "2026-07-03T03:00:00.000Z", fase: "Dieciseisavos", localRef: "1B", visitanteRef: "3E/F/G/I/J" },
  118: { fifaMatchNumber: 86, fecha_inicio: "2026-07-03T22:00:00.000Z", fase: "Dieciseisavos", localRef: "1J", visitanteRef: "2H" },
  119: { fifaMatchNumber: 87, fecha_inicio: "2026-07-04T01:30:00.000Z", fase: "Dieciseisavos", localRef: "1K", visitanteRef: "3D/E/I/J/L" },
  120: { fifaMatchNumber: 88, fecha_inicio: "2026-07-03T18:00:00.000Z", fase: "Dieciseisavos", localRef: "2D", visitanteRef: "2G" },

  121: { fifaMatchNumber: 89, fecha_inicio: "2026-07-04T17:00:00.000Z", fase: "Octavos", localRef: "Ganador 105", visitanteRef: "Ganador 108" },
  122: { fifaMatchNumber: 90, fecha_inicio: "2026-07-04T21:00:00.000Z", fase: "Octavos", localRef: "Ganador 107", visitanteRef: "Ganador 109" },
  123: { fifaMatchNumber: 91, fecha_inicio: "2026-07-05T20:00:00.000Z", fase: "Octavos", localRef: "Ganador 106", visitanteRef: "Ganador 110" },
  124: { fifaMatchNumber: 92, fecha_inicio: "2026-07-06T00:00:00.000Z", fase: "Octavos", localRef: "Ganador 111", visitanteRef: "Ganador 112" },
  126: { fifaMatchNumber: 93, fecha_inicio: "2026-07-06T19:00:00.000Z", fase: "Octavos", localRef: "Ganador 115", visitanteRef: "Ganador 116" },
  125: { fifaMatchNumber: 94, fecha_inicio: "2026-07-07T00:00:00.000Z", fase: "Octavos", localRef: "Ganador 113", visitanteRef: "Ganador 114" },
  127: { fifaMatchNumber: 95, fecha_inicio: "2026-07-07T16:00:00.000Z", fase: "Octavos", localRef: "Ganador 118", visitanteRef: "Ganador 120" },
  128: { fifaMatchNumber: 96, fecha_inicio: "2026-07-07T20:00:00.000Z", fase: "Octavos", localRef: "Ganador 117", visitanteRef: "Ganador 119" },

  129: { fifaMatchNumber: 97, fecha_inicio: "2026-07-09T20:00:00.000Z", fase: "Cuartos", localRef: "Ganador 121", visitanteRef: "Ganador 122" },
  131: { fifaMatchNumber: 98, fecha_inicio: "2026-07-10T19:00:00.000Z", fase: "Cuartos", localRef: "Ganador 126", visitanteRef: "Ganador 125" },
  130: { fifaMatchNumber: 99, fecha_inicio: "2026-07-11T21:00:00.000Z", fase: "Cuartos", localRef: "Ganador 123", visitanteRef: "Ganador 124" },
  132: { fifaMatchNumber: 100, fecha_inicio: "2026-07-12T01:00:00.000Z", fase: "Cuartos", localRef: "Ganador 127", visitanteRef: "Ganador 128" },

  133: { fifaMatchNumber: 101, fecha_inicio: "2026-07-14T19:00:00.000Z", fase: "Semifinales", localRef: "Ganador 129", visitanteRef: "Ganador 131" },
  134: { fifaMatchNumber: 102, fecha_inicio: "2026-07-15T19:00:00.000Z", fase: "Semifinales", localRef: "Ganador 130", visitanteRef: "Ganador 132" },
  135: { fifaMatchNumber: 103, fecha_inicio: "2026-07-18T21:00:00.000Z", fase: "Tercer puesto", localRef: "Perdedor 133", visitanteRef: "Perdedor 134" },
  136: { fifaMatchNumber: 104, fecha_inicio: "2026-07-19T19:00:00.000Z", fase: "Final", localRef: "Ganador 133", visitanteRef: "Ganador 134" },
};

const FASES_ELIMINATORIAS = new Set([
  "dieciseisavos",
  "octavos",
  "cuartos",
  "semifinales",
  "tercer puesto",
  "final",
]);

function crearSupabaseConUsuario(accessToken: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Faltan variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function crearSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en variables de entorno");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function obtenerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authorization.slice("bearer ".length).trim();
}

async function comprobarAdmin(accessToken: string) {
  const supabaseUsuario = crearSupabaseConUsuario(accessToken);

  const {
    data: { user },
    error: userError,
  } = await supabaseUsuario.auth.getUser();

  if (userError || !user) {
    return false;
  }

  const { data, error } = await supabaseUsuario
    .from("participantes")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.role === "admin";
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

function traducirEquipo(nombreApi: string | undefined) {
  if (!nombreApi) return "";

  return NOMBRES_EQUIPOS_ES[nombreApi] ?? nombreApi;
}

function extraerErroresFootballApi(dataApi: { errors?: unknown }) {
  const errores = dataApi.errors;

  if (!errores) return "";
  if (Array.isArray(errores) && errores.length === 0) return "";

  if (typeof errores === "object" && Object.keys(errores).length === 0) {
    return "";
  }

  if (typeof errores === "string") return errores;

  return JSON.stringify(errores);
}

function extraerLetraGrupo(nombreApi: string | undefined) {
  const match = nombreApi?.match(/^Group\s+([A-L])$/i);

  return match?.[1]?.toUpperCase() ?? null;
}

function grupoCerrado(grupo: StandingItem[]) {
  if (!Array.isArray(grupo) || grupo.length < 4) return false;

  return grupo.every((equipo) => (equipo.all?.played ?? 0) >= 3);
}

function extraerGruposCerrados(dataApi: FootballStandingsResponse) {
  const standings = dataApi.response?.[0]?.league?.standings;

  if (!Array.isArray(standings)) return [];

  return standings
    .map((grupoApi) => {
      const letra = extraerLetraGrupo(grupoApi?.[0]?.group);

      if (!letra || !grupoCerrado(grupoApi)) return null;

      const ordenados = [...grupoApi].sort(
        (a, b) => (a.rank ?? 999) - (b.rank ?? 999)
      );

      const primero = traducirEquipo(ordenados[0]?.team?.name);
      const segundo = traducirEquipo(ordenados[1]?.team?.name);
      const tercero = traducirEquipo(ordenados[2]?.team?.name) || null;

      if (!primero || !segundo) return null;

      return {
        grupo: `Grupo ${letra}`,
        letra,
        primero,
        segundo,
        tercero,
      } satisfies GrupoCerrado;
    })
    .filter((grupo): grupo is GrupoCerrado => grupo !== null)
    .sort((a, b) => a.letra.localeCompare(b.letra, "es"));
}

function crearMapaCodigos(partidos: PartidoSupabase[]) {
  const mapa = new Map<string, string>();

  partidos.forEach((partido) => {
    if (partido.local && partido.local_code && !esPlaceholderEquipo(partido.local)) {
      mapa.set(normalizarEquipo(partido.local), partido.local_code);
    }

    if (
      partido.visitante &&
      partido.visitante_code &&
      !esPlaceholderEquipo(partido.visitante)
    ) {
      mapa.set(normalizarEquipo(partido.visitante), partido.visitante_code);
    }
  });

  return mapa;
}

function obtenerCodigoEquipo(nombre: string, codigos: Map<string, string>) {
  return codigos.get(normalizarEquipo(nombre)) ?? null;
}

function esFaseEliminatoria(partido: PartidoSupabase) {
  return FASES_ELIMINATORIAS.has(partido.fase?.trim().toLowerCase() ?? "");
}

function esFaseDieciseisavos(partido: PartidoSupabase) {
  return partido.fase?.trim().toLowerCase() === "dieciseisavos";
}

function esPlaceholderDirecto(valor: string | null | undefined) {
  const limpio = valor?.trim() ?? "";

  return /^[12][A-L]$/i.test(limpio);
}

function extraerPlaceholderDirecto(valor: string | null | undefined) {
  const limpio = valor?.trim().toUpperCase() ?? "";
  const match = limpio.match(/^([12])([A-L])$/);

  if (!match) return null;

  return {
    posicion: Number(match[1]),
    grupo: match[2],
  };
}

function esPlaceholderTercero(valor: string | null | undefined) {
  const limpio = valor?.trim() ?? "";

  return /^3[A-L](\/[A-L])+$/i.test(limpio);
}

function extraerReferenciaGanadorPerdedor(valor: string | null | undefined) {
  const limpio = valor?.trim() ?? "";
  const match = limpio.match(/^(Ganador|Perdedor)\s+(\d+)$/i);

  if (!match) return null;

  return {
    tipo: match[1].toLowerCase() === "ganador" ? "ganador" : "perdedor",
    partidoId: Number(match[2]),
  } as const;
}

function esReferenciaGanadorPerdedor(valor: string | null | undefined) {
  return extraerReferenciaGanadorPerdedor(valor) !== null;
}

function esPlaceholderEquipo(valor: string | null | undefined) {
  const limpio = valor?.trim() ?? "";
  const normalizado = limpio.toLowerCase();

  return (
    !limpio ||
    esPlaceholderDirecto(limpio) ||
    esPlaceholderTercero(limpio) ||
    esReferenciaGanadorPerdedor(limpio) ||
    normalizado.startsWith("ganador ") ||
    normalizado.startsWith("perdedor ") ||
    normalizado.includes("winner group") ||
    normalizado.includes("runner-up group") ||
    normalizado.includes("winner of") ||
    normalizado.includes("loser of") ||
    normalizado.includes("3rd") ||
    normalizado.includes("third") ||
    normalizado.includes("tbd")
  );
}

function nombreFixtureReal(nombre: string | undefined) {
  if (!nombre?.trim()) return false;

  return !esPlaceholderEquipo(nombre);
}

function normalizarFechaIso(fecha: string | null | undefined) {
  if (!fecha) return null;

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function claveFecha(fecha: string | null | undefined) {
  const iso = normalizarFechaIso(fecha);

  if (!iso) return null;

  return iso.slice(0, 16);
}

function fixtureEsEliminatoria(fixture: FixtureApiFootball) {
  const round = fixture.league?.round?.toLowerCase() ?? "";

  return (
    round.includes("round of 32") ||
    round.includes("round of 16") ||
    round.includes("quarter") ||
    round.includes("semi") ||
    round.includes("final") ||
    round.includes("3rd") ||
    round.includes("third")
  );
}

function crearFixturesPorFecha(fixtures: FixtureApiFootball[]) {
  const mapa = new Map<string, FixtureApiFootball>();

  fixtures
    .filter(fixtureEsEliminatoria)
    .forEach((fixture) => {
      const clave = claveFecha(fixture.fixture?.date);

      if (!clave) return;

      mapa.set(clave, fixture);
    });

  return mapa;
}

function fixtureTieneEquiposReales(fixture: FixtureApiFootball) {
  return (
    nombreFixtureReal(fixture.teams?.home?.name) &&
    nombreFixtureReal(fixture.teams?.away?.name)
  );
}

function buscarFixtureParaPartido(
  partido: PartidoSupabase,
  fixturesPorFecha: Map<string, FixtureApiFootball>
) {
  if (partido.api_fixture_id) {
    const porApiFixtureId = [...fixturesPorFecha.values()].find(
      (fixture) => fixture.fixture?.id === partido.api_fixture_id
    );

    if (porApiFixtureId) return porApiFixtureId;
  }

  const referencia = REFERENCIAS_CRUCES_ELIMINATORIAS[partido.id];
  const claveReferencia = claveFecha(referencia?.fecha_inicio);
  const claveActual = claveFecha(partido.fecha_inicio);

  return (
    (claveReferencia ? fixturesPorFecha.get(claveReferencia) : undefined) ??
    (claveActual ? fixturesPorFecha.get(claveActual) : undefined)
  );
}

function crearActualizacionHorarioOficial(
  partido: PartidoSupabase,
  fixture: FixtureApiFootball | undefined,
  cambiosHorarios: CambioHorarioPrevisto[]
) {
  const referencia = REFERENCIAS_CRUCES_ELIMINATORIAS[partido.id];

  if (!referencia && !fixture?.fixture?.date) return {};

  const actualizacion: ActualizacionPartido = {};
  const fechaFixture = normalizarFechaIso(fixture?.fixture?.date);
  const fechaObjetivo = fechaFixture ?? referencia?.fecha_inicio ?? null;

  if (!fechaObjetivo) return actualizacion;

  const fechaActual = normalizarFechaIso(partido.fecha_inicio);

  if (fechaActual !== fechaObjetivo) {
    actualizacion.fecha_inicio = fechaObjetivo;
  }

  const apiFixtureId = fixture?.fixture?.id ?? null;

  if (apiFixtureId && partido.api_fixture_id !== apiFixtureId) {
    actualizacion.api_fixture_id = apiFixtureId;
  }

  const estadioApi = fixture?.fixture?.venue?.name?.trim() || null;
  const ciudadApi = fixture?.fixture?.venue?.city?.trim() || null;

  if (estadioApi && partido.estadio !== estadioApi) {
    actualizacion.estadio = estadioApi;
  }

  if (ciudadApi && partido.ciudad !== ciudadApi) {
    actualizacion.ciudad = ciudadApi;
  }

  if (
    actualizacion.fecha_inicio ||
    actualizacion.api_fixture_id ||
    actualizacion.estadio ||
    actualizacion.ciudad
  ) {
    cambiosHorarios.push({
      partidoId: partido.id,
      anterior: partido.fecha_inicio,
      nuevo: fechaObjetivo,
      origen: fechaFixture ? "fixtures" : "calendario_oficial",
      apiFixtureId,
      estadioAnterior: partido.estadio,
      estadioNuevo: actualizacion.estadio ?? partido.estadio,
      ciudadAnterior: partido.ciudad,
      ciudadNueva: actualizacion.ciudad ?? partido.ciudad,
    });
  }

  return actualizacion;
}

function aplicarCambioCampo(
  actualizacion: ActualizacionPartido,
  cambios: CambioPrevisto[],
  partido: PartidoSupabase,
  campo: "local" | "visitante",
  nuevo: string,
  origen: OrigenCambio,
  codigos: Map<string, string>,
  force: boolean
) {
  const campoCodigo = campo === "local" ? "local_code" : "visitante_code";
  const anterior = partido[campo];
  const actualEsPlaceholder = esPlaceholderEquipo(anterior);

  if (!force && !actualEsPlaceholder) return;
  if (normalizarEquipo(anterior) === normalizarEquipo(nuevo)) return;

  const codigo = esPlaceholderEquipo(nuevo) ? null : obtenerCodigoEquipo(nuevo, codigos);

  actualizacion[campo] = nuevo;
  actualizacion[campoCodigo] = codigo;

  cambios.push({
    partidoId: partido.id,
    campo,
    anterior,
    nuevo,
    origen,
    codigo,
  });
}

function crearActualizacionDesdeFixture(
  partido: PartidoSupabase,
  fixture: FixtureApiFootball | undefined,
  codigos: Map<string, string>,
  force: boolean,
  cambios: CambioPrevisto[]
) {
  const homeApi = fixture?.teams?.home?.name;
  const awayApi = fixture?.teams?.away?.name;

  if (!nombreFixtureReal(homeApi) || !nombreFixtureReal(awayApi)) return {};

  const actualizacion: ActualizacionPartido = {};
  const local = traducirEquipo(homeApi);
  const visitante = traducirEquipo(awayApi);

  aplicarCambioCampo(
    actualizacion,
    cambios,
    partido,
    "local",
    local,
    "fixtures",
    codigos,
    force
  );
  aplicarCambioCampo(
    actualizacion,
    cambios,
    partido,
    "visitante",
    visitante,
    "fixtures",
    codigos,
    force
  );

  return actualizacion;
}

function resolverDirectoGrupo(
  valor: string,
  grupos: Map<string, GrupoCerrado>
): ResolucionReferencia | null {
  const placeholder = extraerPlaceholderDirecto(valor);

  if (!placeholder) return null;

  const grupo = grupos.get(placeholder.grupo);

  if (!grupo) return null;

  return {
    valor: placeholder.posicion === 1 ? grupo.primero : grupo.segundo,
    origen: "standings",
  };
}

function obtenerClasificadoDesdeFixture(
  partido: PartidoSupabase,
  fixturesPorFecha: Map<string, FixtureApiFootball>
) {
  const fixture = buscarFixtureParaPartido(partido, fixturesPorFecha);

  if (!fixtureTieneEquiposReales(fixture ?? {})) return null;

  if (fixture?.teams?.home?.winner === true && partido.local && !esPlaceholderEquipo(partido.local)) {
    return partido.local;
  }

  if (
    fixture?.teams?.away?.winner === true &&
    partido.visitante &&
    !esPlaceholderEquipo(partido.visitante)
  ) {
    return partido.visitante;
  }

  return null;
}

function obtenerClasificadoRealPartido(
  partido: PartidoSupabase,
  fixturesPorFecha: Map<string, FixtureApiFootball>
) {
  if (partido.clasificado_real && !esPlaceholderEquipo(partido.clasificado_real)) {
    return partido.clasificado_real;
  }

  return obtenerClasificadoDesdeFixture(partido, fixturesPorFecha);
}

function obtenerPerdedorRealPartido(
  partido: PartidoSupabase,
  fixturesPorFecha: Map<string, FixtureApiFootball>
) {
  const clasificado = obtenerClasificadoRealPartido(partido, fixturesPorFecha);

  if (!clasificado) return null;

  const localReal = partido.local && !esPlaceholderEquipo(partido.local);
  const visitanteReal = partido.visitante && !esPlaceholderEquipo(partido.visitante);

  if (!localReal || !visitanteReal) return null;

  if (normalizarEquipo(clasificado) === normalizarEquipo(partido.local)) {
    return partido.visitante;
  }

  if (normalizarEquipo(clasificado) === normalizarEquipo(partido.visitante)) {
    return partido.local;
  }

  return null;
}

function resolverGanadorPerdedor(
  valor: string,
  partidosPorId: Map<number, PartidoSupabase>,
  fixturesPorFecha: Map<string, FixtureApiFootball>
): ResolucionReferencia | null {
  const referencia = extraerReferenciaGanadorPerdedor(valor);

  if (!referencia) return null;

  const partidoReferencia = partidosPorId.get(referencia.partidoId);

  if (!partidoReferencia) return null;

  const resuelto =
    referencia.tipo === "ganador"
      ? obtenerClasificadoRealPartido(partidoReferencia, fixturesPorFecha)
      : obtenerPerdedorRealPartido(partidoReferencia, fixturesPorFecha);

  if (!resuelto) return null;

  return {
    valor: resuelto,
    origen: "bracket",
  };
}

function resolverReferenciaCruce(
  valor: string,
  grupos: Map<string, GrupoCerrado>,
  partidosPorId: Map<number, PartidoSupabase>,
  fixturesPorFecha: Map<string, FixtureApiFootball>
): ResolucionReferencia {
  const directo = resolverDirectoGrupo(valor, grupos);

  if (directo) return directo;

  const ganadorPerdedor = resolverGanadorPerdedor(valor, partidosPorId, fixturesPorFecha);

  if (ganadorPerdedor) return ganadorPerdedor;

  return {
    valor,
    origen: "bracket",
  };
}

function crearActualizacionDesdeReferenciaOficial(
  partido: PartidoSupabase,
  referencia: ReferenciaCruce | undefined,
  grupos: Map<string, GrupoCerrado>,
  partidosPorId: Map<number, PartidoSupabase>,
  fixturesPorFecha: Map<string, FixtureApiFootball>,
  codigos: Map<string, string>,
  force: boolean,
  cambios: CambioPrevisto[]
) {
  if (!referencia) return {};

  const actualizacion: ActualizacionPartido = {};

  const localResuelto = resolverReferenciaCruce(
    referencia.localRef,
    grupos,
    partidosPorId,
    fixturesPorFecha
  );
  const visitanteResuelto = resolverReferenciaCruce(
    referencia.visitanteRef,
    grupos,
    partidosPorId,
    fixturesPorFecha
  );

  aplicarCambioCampo(
    actualizacion,
    cambios,
    partido,
    "local",
    localResuelto.valor,
    localResuelto.origen,
    codigos,
    force
  );
  aplicarCambioCampo(
    actualizacion,
    cambios,
    partido,
    "visitante",
    visitanteResuelto.valor,
    visitanteResuelto.origen,
    codigos,
    force
  );

  return actualizacion;
}

function unirActualizaciones(...actualizaciones: ActualizacionPartido[]) {
  return actualizaciones.reduce<ActualizacionPartido>(
    (acc, actualizacion) => ({ ...acc, ...actualizacion }),
    {}
  );
}

function contarCampos(actualizacion: ActualizacionPartido) {
  return Object.keys(actualizacion).length;
}

function ordenarEliminatorias(a: PartidoSupabase, b: PartidoSupabase) {
  const matchA = REFERENCIAS_CRUCES_ELIMINATORIAS[a.id]?.fifaMatchNumber ?? a.id;
  const matchB = REFERENCIAS_CRUCES_ELIMINATORIAS[b.id]?.fifaMatchNumber ?? b.id;

  return matchA - matchB;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    mensaje:
      "Ruta actualizar-cruces-eliminatorias operativa. Usa POST desde admin para actualizar equipos y horarios de todas las eliminatorias.",
  });
}

export async function POST(request: Request) {
  try {
    const token = obtenerToken(request);

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "No autorizado. Falta token de sesión." },
        { status: 401 }
      );
    }

    const esAdmin = await comprobarAdmin(token);

    if (!esAdmin) {
      return NextResponse.json(
        { ok: false, error: "No autorizado. Solo administradores." },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean;
      force?: boolean;
    };

    const dryRun = body.dryRun === true;
    const force = body.force === true;
    const supabaseAdmin = crearSupabaseAdmin();

    const { data: partidosData, error: partidosError } = await supabaseAdmin
      .from("partidos")
      .select(
        "id, local, visitante, local_code, visitante_code, fecha_inicio, estadio, ciudad, fase, grupo, resultado_local, resultado_visitante, estado, clasificado_real, api_fixture_id"
      )
      .order("fecha_inicio", { ascending: true, nullsFirst: false });

    if (partidosError) {
      throw new Error(`Error cargando partidos: ${partidosError.message}`);
    }

    const partidos = (partidosData ?? []) as PartidoSupabase[];
    const partidosPorId = new Map(partidos.map((partido) => [partido.id, partido]));
    const partidosEliminatorias = partidos
      .filter((partido) => esFaseEliminatoria(partido))
      .sort(ordenarEliminatorias);
    const partidosDieciseisavos = partidosEliminatorias.filter(esFaseDieciseisavos);
    const codigos = crearMapaCodigos(partidos);

    const [fixturesApi, standingsApi] = await Promise.all([
      obtenerPartidosMundial2026() as Promise<FootballFixturesResponse>,
      footballFetch("/standings?league=1&season=2026") as Promise<FootballStandingsResponse>,
    ]);

    const erroresFixtures = extraerErroresFootballApi(fixturesApi);
    const erroresStandings = extraerErroresFootballApi(standingsApi);

    if (erroresFixtures || erroresStandings) {
      return NextResponse.json(
        {
          ok: false,
          error: `Football API ha devuelto errores: ${[
            erroresFixtures,
            erroresStandings,
          ]
            .filter(Boolean)
            .join(" | ")}`,
        },
        { status: 502 }
      );
    }

    const fixtures = Array.isArray(fixturesApi.response) ? fixturesApi.response : [];
    const fixturesEliminatorias = fixtures.filter(fixtureEsEliminatoria);
    const fixturesPorFecha = crearFixturesPorFecha(fixtures);
    const fixturesEliminatoriasConEquipos = fixturesEliminatorias.filter(
      fixtureTieneEquiposReales
    );
    const gruposCerrados = extraerGruposCerrados(standingsApi);
    const gruposPorLetra = new Map(
      gruposCerrados.map((grupo) => [grupo.letra, grupo])
    );

    let actualizados = 0;
    let cambiosPorFixtures = 0;
    let cambiosPorStandings = 0;
    let cambiosPorBracket = 0;
    let cambiosHorariosAplicados = 0;
    let ignorados = 0;
    const errores: string[] = [];
    const cambios: CambioPrevisto[] = [];
    const cambiosHorarios: CambioHorarioPrevisto[] = [];
    const tercerosPendientes: Array<{
      partidoId: number;
      campo: "local" | "visitante";
      placeholder: string;
    }> = [];
    const crucesFuturosPendientes: Array<{
      partidoId: number;
      campo: "local" | "visitante";
      placeholder: string;
    }> = [];

    for (const partido of partidosEliminatorias) {
      const referencia = REFERENCIAS_CRUCES_ELIMINATORIAS[partido.id];
      const fixture = buscarFixtureParaPartido(partido, fixturesPorFecha);
      const cambiosAntes = cambios.length;
      const cambiosHorariosAntes = cambiosHorarios.length;

      const actualizacionHorario = crearActualizacionHorarioOficial(
        partido,
        fixture,
        cambiosHorarios
      );
      const partidoConHorario = { ...partido, ...actualizacionHorario };

      const actualizacionFixtures = crearActualizacionDesdeFixture(
        partidoConHorario,
        fixture,
        codigos,
        force,
        cambios
      );
      const actualizacionReferencia = crearActualizacionDesdeReferenciaOficial(
        { ...partidoConHorario, ...actualizacionFixtures },
        referencia,
        gruposPorLetra,
        partidosPorId,
        fixturesPorFecha,
        codigos,
        force,
        cambios
      );
      const actualizacion = unirActualizaciones(
        actualizacionHorario,
        actualizacionFixtures,
        actualizacionReferencia
      );

      (['local', 'visitante'] as const).forEach((campo) => {
        const valor = (actualizacion[campo] ?? partido[campo]) as string | null;

        if (esPlaceholderTercero(valor)) {
          tercerosPendientes.push({
            partidoId: partido.id,
            campo,
            placeholder: valor ?? "",
          });
        }

        if (esReferenciaGanadorPerdedor(valor)) {
          crucesFuturosPendientes.push({
            partidoId: partido.id,
            campo,
            placeholder: valor ?? "",
          });
        }
      });

      if (contarCampos(actualizacion) === 0) {
        ignorados += 1;
        continue;
      }

      const nuevosCambios = cambios.slice(cambiosAntes);

      cambiosPorFixtures += nuevosCambios.filter(
        (cambio) => cambio.origen === "fixtures"
      ).length;
      cambiosPorStandings += nuevosCambios.filter(
        (cambio) => cambio.origen === "standings"
      ).length;
      cambiosPorBracket += nuevosCambios.filter(
        (cambio) => cambio.origen === "bracket"
      ).length;

      cambiosHorariosAplicados += cambiosHorarios.length - cambiosHorariosAntes;

      if (!dryRun) {
        const { error: updateError } = await supabaseAdmin
          .from("partidos")
          .update(actualizacion)
          .eq("id", partido.id);

        if (updateError) {
          errores.push(
            `Partido ${partido.id} (${partido.local ?? "Local"} - ${
              partido.visitante ?? "Visitante"
            }): ${updateError.message}`
          );
          continue;
        }
      }

      Object.assign(partido, actualizacion);
      partidosPorId.set(partido.id, partido);
      actualizados += 1;
    }

    return NextResponse.json({
      ok: errores.length === 0,
      resumen: {
        dryRun,
        force,
        partidosEliminatorias: partidosEliminatorias.length,
        partidosDieciseisavos: partidosDieciseisavos.length,
        fixturesEliminatoriasDetectados: fixturesEliminatorias.length,
        fixturesEliminatoriasConEquipos: fixturesEliminatoriasConEquipos.length,
        horariosReferencia: Object.keys(REFERENCIAS_CRUCES_ELIMINATORIAS).length,
        gruposCerrados: gruposCerrados.length,
        gruposCerradosDetalle: gruposCerrados.map((grupo) => ({
          grupo: grupo.grupo,
          primero: grupo.primero,
          segundo: grupo.segundo,
          tercero: grupo.tercero,
        })),
        actualizados,
        ignorados,
        cambiosPorFixtures,
        cambiosPorStandings,
        cambiosPorBracket,
        horariosActualizados: cambiosHorariosAplicados,
        tercerosPendientes: tercerosPendientes.length,
        tercerosPendientesDetalle: tercerosPendientes,
        crucesFuturosPendientes: crucesFuturosPendientes.length,
        crucesFuturosPendientesDetalle: crucesFuturosPendientes,
        cambios,
        cambiosHorarios,
      },
      errores,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido actualizando cruces de eliminatorias";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
