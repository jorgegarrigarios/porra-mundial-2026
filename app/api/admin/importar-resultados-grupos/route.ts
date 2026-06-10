import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { footballFetch } from "@/lib/api/football";

type StandingItem = {
  rank?: number;
  group?: string;
  team?: {
    id?: number;
    name?: string;
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

type ResultadoGrupo = {
  grupo: string;
  clasificado_1: string;
  clasificado_2: string;
  updated_at: string;
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

function extraerErroresFootballApi(dataApi: FootballStandingsResponse) {
  const errores = dataApi.errors;

  if (!errores) return "";

  if (Array.isArray(errores) && errores.length === 0) return "";

  if (typeof errores === "object" && Object.keys(errores).length === 0) {
    return "";
  }

  if (typeof errores === "string") return errores;

  return JSON.stringify(errores);
}

function traducirEquipo(nombreApi: string | undefined) {
  if (!nombreApi) return "";

  return NOMBRES_EQUIPOS_ES[nombreApi] ?? nombreApi;
}

function traducirGrupo(nombreApi: string | undefined) {
  const match = nombreApi?.match(/^Group\s+([A-L])$/i);

  if (!match?.[1]) return null;

  return `Grupo ${match[1].toUpperCase()}`;
}

function extraerResultadosGrupos(dataApi: FootballStandingsResponse) {
  const standings = dataApi.response?.[0]?.league?.standings;

  if (!Array.isArray(standings)) return [];

  const ahora = new Date().toISOString();

  return standings
    .map((grupoApi) => {
      const nombreGrupo = traducirGrupo(grupoApi?.[0]?.group);

      if (!nombreGrupo) return null;

      const ordenados = [...grupoApi].sort(
        (a, b) => (a.rank ?? 999) - (b.rank ?? 999)
      );

      const primero = traducirEquipo(ordenados[0]?.team?.name);
      const segundo = traducirEquipo(ordenados[1]?.team?.name);

      if (!primero || !segundo) return null;

      return {
        grupo: nombreGrupo,
        clasificado_1: primero,
        clasificado_2: segundo,
        updated_at: ahora,
      };
    })
    .filter((item): item is ResultadoGrupo => item !== null);
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

    const supabaseAdmin = crearSupabaseAdmin();

    const dataApi = (await footballFetch(
      "/standings?league=1&season=2026"
    )) as FootballStandingsResponse;

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

    const resultados = extraerResultadosGrupos(dataApi);

    if (resultados.length !== 12) {
      return NextResponse.json(
        {
          ok: false,
          error: `Se esperaban 12 grupos y se han detectado ${resultados.length}. No se ha guardado nada.`,
          resultadosDetectados: resultados,
        },
        { status: 422 }
      );
    }

    const { error } = await supabaseAdmin
      .from("resultados_grupos")
      .upsert(resultados, {
        onConflict: "grupo",
      });

    if (error) {
      throw new Error(`Error guardando resultados_grupos: ${error.message}`);
    }

    return NextResponse.json({
      ok: true,
      resumen: {
        gruposProcesados: resultados.length,
        resultados,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido importando resultados de grupos";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
