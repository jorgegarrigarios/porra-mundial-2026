import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { actualizarCrucesEliminatorias } from "@/lib/actualizarEliminatorias";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    const resultado = await actualizarCrucesEliminatorias({
      dryRun: body.dryRun === true,
      force: body.force === true,
    });

    return NextResponse.json(resultado, {
      status: resultado.ok ? 200 : 502,
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
