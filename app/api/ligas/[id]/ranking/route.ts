import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Props = {
  params: Promise<{ id: string }>;
};

type ParticipanteRow = {
  id: number;
  nombre: string | null;
  nickname: string | null;
};

type LigaParticipanteRow = {
  participante_id: number;
  participantes:
    | ParticipanteRow
    | ParticipanteRow[]
    | null;
};

type PronosticoRow = {
  participante_id: number;
  puntos: number | null;
};

type PronosticoGrupoRow = {
  participante_id: number;
  puntos_total: number | null;
};

type PronosticoBonusRow = {
  participante_id: number;
  puntos_total: number | null;
};

type MiembroRanking = {
  id: number;
  nombre: string;
  puntos: number;
  puntosPartidos: number;
  puntosGrupos: number;
  puntosBonus: number;
  aciertos: number;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAGE_SIZE = 1000;

function crearSupabaseUsuario(accessToken: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY."
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
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function obtenerBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authorization.slice("bearer ".length).trim();
}

function normalizarParticipante(
  participante: LigaParticipanteRow["participantes"]
) {
  if (!participante) return null;
  if (Array.isArray(participante)) return participante[0] ?? null;
  return participante;
}

function sumarPuntosPorParticipante<T extends { participante_id: number }>(
  filas: T[],
  participanteId: number,
  obtenerPuntos: (fila: T) => number | null
) {
  return filas
    .filter((fila) => fila.participante_id === participanteId)
    .reduce((total, fila) => total + Number(obtenerPuntos(fila) ?? 0), 0);
}

function contarAciertosPorParticipante<T extends { participante_id: number }>(
  filas: T[],
  participanteId: number,
  obtenerPuntos: (fila: T) => number | null
) {
  return filas.filter(
    (fila) => fila.participante_id === participanteId && Number(obtenerPuntos(fila) ?? 0) > 0
  ).length;
}

async function cargarTablaPaginada<T>(
  supabase: ReturnType<typeof crearSupabaseAdmin>,
  tabla: string,
  select: string,
  idsMiembros: number[]
): Promise<T[]> {
  if (idsMiembros.length === 0) return [];

  let desde = 0;
  let todos: T[] = [];

  while (true) {
    const { data, error } = await supabase
      .from(tabla)
      .select(select)
      .in("participante_id", idsMiembros)
      .order("participante_id", { ascending: true })
      .range(desde, desde + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Error cargando ${tabla}: ${error.message}`);
    }

    const bloque = (data ?? []) as T[];
    todos = [...todos, ...bloque];

    if (bloque.length < PAGE_SIZE) {
      break;
    }

    desde += PAGE_SIZE;
  }

  return todos;
}

export async function GET(request: Request, { params }: Props) {
  try {
    const resolvedParams = await params;
    const ligaId = Number(resolvedParams.id);

    if (!ligaId || Number.isNaN(ligaId)) {
      return NextResponse.json(
        { ok: false, error: "Liga no válida." },
        { status: 400 }
      );
    }

    const accessToken = obtenerBearerToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "No autorizado. Falta token de sesión." },
        { status: 401 }
      );
    }

    const supabaseUsuario = crearSupabaseUsuario(accessToken);

    const {
      data: { user },
      error: userError,
    } = await supabaseUsuario.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "No autorizado. Sesión no válida." },
        { status: 401 }
      );
    }

    const { data: participanteActual, error: participanteError } =
      await supabaseUsuario
        .from("participantes")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (participanteError || !participanteActual) {
      return NextResponse.json(
        { ok: false, error: "No se ha podido validar tu perfil." },
        { status: 403 }
      );
    }

    const { data: perteneceLiga, error: accesoError } = await supabaseUsuario
      .from("liga_participantes")
      .select("id")
      .eq("liga_id", ligaId)
      .eq("participante_id", participanteActual.id)
      .maybeSingle();

    if (accesoError || !perteneceLiga) {
      return NextResponse.json(
        { ok: false, error: "No tienes acceso a esta liga." },
        { status: 403 }
      );
    }

    const supabaseAdmin = crearSupabaseAdmin();

    const { data: miembrosData, error: miembrosError } = await supabaseAdmin
      .from("liga_participantes")
      .select(
        `
        participante_id,
        participantes (
          id,
          nombre,
          nickname
        )
      `
      )
      .eq("liga_id", ligaId);

    if (miembrosError) {
      throw new Error(`Error cargando miembros: ${miembrosError.message}`);
    }

    const miembros = ((miembrosData ?? []) as LigaParticipanteRow[])
      .map((item) => {
        const participante = normalizarParticipante(item.participantes);

        return (
          participante ?? {
            id: item.participante_id,
            nombre: null,
            nickname: null,
          }
        );
      })
      .filter((miembro): miembro is ParticipanteRow => Boolean(miembro?.id));

    const idsMiembros = miembros.map((miembro) => miembro.id);

    const [pronosticos, pronosticosGrupos, pronosticosBonus] = await Promise.all([
      cargarTablaPaginada<PronosticoRow>(
        supabaseAdmin,
        "pronosticos",
        "participante_id, puntos",
        idsMiembros
      ),
      cargarTablaPaginada<PronosticoGrupoRow>(
        supabaseAdmin,
        "pronosticos_grupos",
        "participante_id, puntos_total",
        idsMiembros
      ),
      cargarTablaPaginada<PronosticoBonusRow>(
        supabaseAdmin,
        "pronosticos_bonus",
        "participante_id, puntos_total",
        idsMiembros
      ),
    ]);

    const ranking: MiembroRanking[] = miembros.map((miembro) => {
      const nombreVisible = miembro.nickname || miembro.nombre || "Usuario";

      const puntosPartidos = sumarPuntosPorParticipante(
        pronosticos,
        miembro.id,
        (p) => p.puntos
      );

      const puntosGrupos = sumarPuntosPorParticipante(
        pronosticosGrupos,
        miembro.id,
        (p) => p.puntos_total
      );

      const puntosBonus = sumarPuntosPorParticipante(
        pronosticosBonus,
        miembro.id,
        (p) => p.puntos_total
      );

      const aciertosPartidos = contarAciertosPorParticipante(
        pronosticos,
        miembro.id,
        (p) => p.puntos
      );

      const aciertosGrupos = contarAciertosPorParticipante(
        pronosticosGrupos,
        miembro.id,
        (p) => p.puntos_total
      );

      const aciertosBonus = contarAciertosPorParticipante(
        pronosticosBonus,
        miembro.id,
        (p) => p.puntos_total
      );

      return {
        id: miembro.id,
        nombre: nombreVisible,
        puntos: puntosPartidos + puntosGrupos + puntosBonus,
        puntosPartidos,
        puntosGrupos,
        puntosBonus,
        aciertos: aciertosPartidos + aciertosGrupos + aciertosBonus,
      };
    });

    ranking.sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.aciertos !== a.aciertos) return b.aciertos - a.aciertos;
      return a.nombre.localeCompare(b.nombre);
    });

    return NextResponse.json({
      ok: true,
      ranking,
      resumen: {
        ligaId,
        miembros: miembros.length,
        pronosticosPartidos: pronosticos.length,
        pronosticosGrupos: pronosticosGrupos.length,
        pronosticosBonus: pronosticosBonus.length,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido cargando ranking de liga.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
