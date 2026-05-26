import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { obtenerPartidosMundial2026 } from "@/lib/api/football";
import { recalcularPronosticos } from "@/lib/recalcularPronosticos";

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ESTADOS_FINALIZADOS = new Set(["FT", "AET", "PEN"]);

const ALIAS_EQUIPOS: Record<string, string> = {
  argentina: "argentina",
  australia: "australia",
  austria: "austria",
  belgium: "belgica",
  bélgica: "belgica",
  belgica: "belgica",
  brazil: "brasil",
  brasil: "brasil",
  canada: "canada",
  canadá: "canada",
  colombia: "colombia",
  croatia: "croacia",
  croacia: "croacia",
  denmark: "dinamarca",
  dinamarca: "dinamarca",
  ecuador: "ecuador",
  england: "inglaterra",
  inglaterra: "inglaterra",
  france: "francia",
  francia: "francia",
  germany: "alemania",
  alemania: "alemania",
  ghana: "ghana",
  iran: "iran",
  irán: "iran",
  japan: "japon",
  japón: "japon",
  japon: "japon",
  mexico: "mexico",
  méxico: "mexico",
  marruecos: "marruecos",
  morocco: "marruecos",
  netherlands: "paises bajos",
  holland: "paises bajos",
  "paises bajos": "paises bajos",
  "países bajos": "paises bajos",
  "new zealand": "nueva zelanda",
  "nueva zelanda": "nueva zelanda",
  norway: "noruega",
  noruega: "noruega",
  paraguay: "paraguay",
  portugal: "portugal",
  qatar: "qatar",
  "saudi arabia": "arabia saudi",
  "arabia saudí": "arabia saudi",
  "arabia saudi": "arabia saudi",
  senegal: "senegal",
  serbia: "serbia",
  "south korea": "corea del sur",
  "korea republic": "corea del sur",
  "corea del sur": "corea del sur",
  spain: "espana",
  españa: "espana",
  espana: "espana",
  switzerland: "suiza",
  suiza: "suiza",
  tunisia: "tunez",
  túnez: "tunez",
  tunez: "tunez",
  uruguay: "uruguay",
  usa: "estados unidos",
  "united states": "estados unidos",
  "estados unidos": "estados unidos",
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

function obtenerClasificadoReal(
  fixture: FixtureApiFootball,
  partido: PartidoSupabase
) {
  const homeWinner = fixture.teams?.home?.winner;
  const awayWinner = fixture.teams?.away?.winner;

  if (homeWinner === true) return partido.local;
  if (awayWinner === true) return partido.visitante;

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
  partido: PartidoSupabase,
  force: boolean
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

  const yaTieneResultado =
    partido.resultado_local !== null && partido.resultado_visitante !== null;

  if (!yaTieneResultado || force) {
    actualizacion.resultado_local = golesLocal;
    actualizacion.resultado_visitante = golesVisitante;

    const clasificadoReal = obtenerClasificadoReal(fixture, partido);

    if (clasificadoReal) {
      actualizacion.clasificado_real = clasificadoReal;
    }
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
      force?: boolean;
    };

    const force = body.force === true;
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
          resumen: {
            fixturesEncontrados: 0,
            mapeados: 0,
            actualizados: 0,
            ignorados: 0,
            pronosticosActualizados: 0,
          },
          errores: [erroresFootballApi],
          force,
        },
        { status: 502 }
      );
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

      const actualizacion = crearActualizacion(fixture, partido, force);

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

    return NextResponse.json({
      ok: errores.length === 0,
      resumen: {
        fixturesEncontrados,
        mapeados,
        actualizados,
        ignorados,
        pronosticosActualizados: recalculo.actualizados ?? 0,
      },
      errores,
      force,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido importando resultados desde Football API";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
