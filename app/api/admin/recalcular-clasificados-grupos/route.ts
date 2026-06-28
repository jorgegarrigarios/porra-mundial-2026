import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ResultadoGrupo = {
  grupo: string;
  clasificado_1: string | null;
  clasificado_2: string | null;
};

type PronosticoGrupo = {
  id: number;
  participante_id: number | null;
  grupo: string;
  clasificado_1: string | null;
  clasificado_2: string | null;
};

type ActualizacionPronosticoGrupo = {
  puntos_clasificado_1: number;
  puntos_clasificado_2: number;
  puntos_bonus_dos_acertados: number;
  puntos_bonus_orden: number;
  puntos_total: number;
  updated_at: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function normalizarGrupo(valor: string | null | undefined) {
  const limpio = normalizarTexto(valor);

  if (!limpio) return "";

  const matchLetra =
    limpio.match(/^grupo\s*([a-l])$/i) ??
    limpio.match(/^group\s*([a-l])$/i) ??
    limpio.match(/^([a-l])$/i);

  if (matchLetra?.[1]) {
    return `grupo ${matchLetra[1].toLowerCase()}`;
  }

  return limpio;
}

function calcularPuntosPronostico(
  pronostico: PronosticoGrupo,
  resultado: ResultadoGrupo
): ActualizacionPronosticoGrupo {
  const p1 = normalizarTexto(pronostico.clasificado_1);
  const p2 = normalizarTexto(pronostico.clasificado_2);
  const r1 = normalizarTexto(resultado.clasificado_1);
  const r2 = normalizarTexto(resultado.clasificado_2);

  const pronosticados = new Set([p1, p2].filter(Boolean));
  const oficiales = new Set([r1, r2].filter(Boolean));

  const aciertaClasificado1 =
    p1.length > 0 && (p1 === r1 || p1 === r2) ? 2 : 0;

  const aciertaClasificado2 =
    p2.length > 0 && p2 !== p1 && (p2 === r1 || p2 === r2) ? 2 : 0;

  const aciertosTotales = [...pronosticados].filter((equipo) =>
    oficiales.has(equipo)
  ).length;

  const bonusDosAcertados = aciertosTotales === 2 ? 1 : 0;
  const bonusOrden = p1 === r1 && p2 === r2 && aciertosTotales === 2 ? 1 : 0;

  const puntosTotal =
    aciertaClasificado1 +
    aciertaClasificado2 +
    bonusDosAcertados +
    bonusOrden;

  return {
    puntos_clasificado_1: aciertaClasificado1,
    puntos_clasificado_2: aciertaClasificado2,
    puntos_bonus_dos_acertados: bonusDosAcertados,
    puntos_bonus_orden: bonusOrden,
    puntos_total: puntosTotal,
    updated_at: new Date().toISOString(),
  };
}

/*
  GET temporal y seguro:
  sirve para comprobar en navegador que la ruta existe.
  No guarda nada en Supabase.
*/
export async function GET() {
  return NextResponse.json({
    ok: true,
    mensaje:
      "Ruta recalcular-clasificados-grupos operativa. Para recalcular puntos hay que llamar por POST desde admin.",
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

    const supabaseAdmin = crearSupabaseAdmin();

    const { data: resultadosData, error: resultadosError } = await supabaseAdmin
      .from("resultados_grupos")
      .select("grupo, clasificado_1, clasificado_2");

    if (resultadosError) {
      throw new Error(
        `Error cargando resultados_grupos: ${resultadosError.message}`
      );
    }

    const resultados = (resultadosData ?? []) as ResultadoGrupo[];

    if (resultados.length !== 12) {
      return NextResponse.json(
        {
          ok: false,
          error: `Se esperaban 12 resultados de grupo y hay ${resultados.length}. Importa primero los clasificados oficiales.`,
        },
        { status: 422 }
      );
    }

    const resultadosPorGrupo = new Map(
      resultados.map((resultado) => [normalizarGrupo(resultado.grupo), resultado])
    );

    const { data: pronosticosData, error: pronosticosError } =
      await supabaseAdmin
        .from("pronosticos_grupos")
        .select("id, participante_id, grupo, clasificado_1, clasificado_2")
        .order("id", { ascending: true });

    if (pronosticosError) {
      throw new Error(
        `Error cargando pronosticos_grupos: ${pronosticosError.message}`
      );
    }

    const pronosticos = (pronosticosData ?? []) as PronosticoGrupo[];

    let actualizados = 0;
    let ignorados = 0;
    let puntosTotalesAsignados = 0;

    const resumenPorGrupo: Record<
      string,
      {
        pronosticos: number;
        puntos: number;
      }
    > = {};

    const gruposPronosticosSinResultado = new Set<string>();

    for (const pronostico of pronosticos) {
      const grupoNormalizado = normalizarGrupo(pronostico.grupo);
      const resultado = resultadosPorGrupo.get(grupoNormalizado);

      if (!resultado) {
        ignorados += 1;
        gruposPronosticosSinResultado.add(pronostico.grupo);
        continue;
      }

      const actualizacion = calcularPuntosPronostico(pronostico, resultado);

      const { error: updateError } = await supabaseAdmin
        .from("pronosticos_grupos")
        .update(actualizacion)
        .eq("id", pronostico.id);

      if (updateError) {
        throw new Error(
          `Error actualizando pronóstico ${pronostico.id}: ${updateError.message}`
        );
      }

      actualizados += 1;
      puntosTotalesAsignados += actualizacion.puntos_total;

      const grupoResumen = resultado.grupo;

      if (!resumenPorGrupo[grupoResumen]) {
        resumenPorGrupo[grupoResumen] = {
          pronosticos: 0,
          puntos: 0,
        };
      }

      resumenPorGrupo[grupoResumen].pronosticos += 1;
      resumenPorGrupo[grupoResumen].puntos += actualizacion.puntos_total;
    }

    return NextResponse.json({
      ok: true,
      resumen: {
        resultadosGrupos: resultados.length,
        pronosticosEncontrados: pronosticos.length,
        actualizados,
        ignorados,
        puntosTotalesAsignados,
        resumenPorGrupo,
        gruposResultadosDisponibles: resultados.map((resultado) => resultado.grupo),
        gruposPronosticosSinResultado: Array.from(gruposPronosticosSinResultado),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido recalculando clasificados de grupos";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
