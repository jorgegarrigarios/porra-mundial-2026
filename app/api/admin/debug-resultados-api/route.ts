import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { obtenerPartidosMundial2026 } from "@/lib/api/football";

type FixtureApiFootball = {
  fixture?: {
    id?: number;
    date?: string;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
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
  score?: {
    halftime?: {
      home?: number | null;
      away?: number | null;
    };
    fulltime?: {
      home?: number | null;
      away?: number | null;
    };
    extratime?: {
      home?: number | null;
      away?: number | null;
    };
    penalty?: {
      home?: number | null;
      away?: number | null;
    };
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function mismaFecha(fechaA: string | null, fechaB: string | null | undefined) {
  if (!fechaA || !fechaB) return false;

  const a = new Date(fechaA);
  const b = new Date(fechaB);

  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;

  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

function buscarPartidoParaFixture(
  fixture: FixtureApiFootball,
  partidos: PartidoSupabase[]
) {
  const fixtureId = fixture.fixture?.id ?? null;

  if (fixtureId) {
    const porId = partidos.find((partido) => partido.api_fixture_id === fixtureId);

    if (porId) {
      return {
        partido: porId,
        metodo: "api_fixture_id",
      };
    }
  }

  const home = normalizarEquipo(fixture.teams?.home?.name);
  const away = normalizarEquipo(fixture.teams?.away?.name);
  const fechaFixture = fixture.fixture?.date ?? null;

  if (!home || !away || !fechaFixture) {
    return {
      partido: null,
      metodo: "sin_datos_suficientes",
    };
  }

  const directo = partidos.find((partido) => {
    const local = normalizarEquipo(partido.local);
    const visitante = normalizarEquipo(partido.visitante);

    return (
      mismaFecha(partido.fecha_inicio, fechaFixture) &&
      local === home &&
      visitante === away
    );
  });

  if (directo) {
    return {
      partido: directo,
      metodo: "fecha_y_equipos_directo",
    };
  }

  const invertido = partidos.find((partido) => {
    const local = normalizarEquipo(partido.local);
    const visitante = normalizarEquipo(partido.visitante);

    return (
      mismaFecha(partido.fecha_inicio, fechaFixture) &&
      local === away &&
      visitante === home
    );
  });

  if (invertido) {
    return {
      partido: invertido,
      metodo: "fecha_y_equipos_invertido",
    };
  }

  return {
    partido: null,
    metodo: "no_mapeado",
  };
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

export async function GET(request: Request) {
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
      return NextResponse.json(
        {
          ok: false,
          error: `Football API ha devuelto errores: ${erroresFootballApi}`,
        },
        { status: 502 }
      );
    }

    const fixtures = Array.isArray(dataApi?.response)
      ? (dataApi.response as FixtureApiFootball[])
      : [];

    const diagnostico = fixtures.map((fixture) => {
      const { partido, metodo } = buscarPartidoParaFixture(fixture, partidos);

      return {
        api_fixture_id: fixture.fixture?.id ?? null,
        api_fecha: fixture.fixture?.date ?? null,
        api_estado_short: fixture.fixture?.status?.short ?? null,
        api_estado_long: fixture.fixture?.status?.long ?? null,
        api_minuto: fixture.fixture?.status?.elapsed ?? null,
        api_local: fixture.teams?.home?.name ?? null,
        api_visitante: fixture.teams?.away?.name ?? null,
        api_goles_local: fixture.goals?.home ?? null,
        api_goles_visitante: fixture.goals?.away ?? null,
        api_descanso_local: fixture.score?.halftime?.home ?? null,
        api_descanso_visitante: fixture.score?.halftime?.away ?? null,
        api_final_local: fixture.score?.fulltime?.home ?? null,
        api_final_visitante: fixture.score?.fulltime?.away ?? null,
        mapeado: Boolean(partido),
        metodo_mapeo: metodo,
        partido_id: partido?.id ?? null,
        partido_local: partido?.local ?? null,
        partido_visitante: partido?.visitante ?? null,
        partido_fecha_inicio: partido?.fecha_inicio ?? null,
        partido_estado_actual: partido?.estado ?? null,
        partido_resultado_local: partido?.resultado_local ?? null,
        partido_resultado_visitante: partido?.resultado_visitante ?? null,
      };
    });

    const resumen = {
      fixturesEncontrados: fixtures.length,
      mapeados: diagnostico.filter((item) => item.mapeado).length,
      noMapeados: diagnostico.filter((item) => !item.mapeado).length,
      conGolesApi: diagnostico.filter(
        (item) => item.api_goles_local !== null || item.api_goles_visitante !== null
      ).length,
      finalizadosApi: diagnostico.filter((item) =>
        ["FT", "AET", "PEN"].includes(item.api_estado_short ?? "")
      ).length,
      enJuegoApi: diagnostico.filter((item) =>
        ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(
          item.api_estado_short ?? ""
        )
      ).length,
    };

    return NextResponse.json({
      ok: true,
      resumen,
      diagnostico,
      generadoEn: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido diagnosticando resultados de Football API";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
