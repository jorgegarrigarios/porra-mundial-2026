import { NextResponse } from "next/server";
import { obtenerEquiposMundial2026 } from "@/lib/api/football";

export async function GET() {
  try {
    const equipos = await obtenerEquiposMundial2026();

    return NextResponse.json({
      ok: true,
      total: equipos.length,
      equipos,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido consultando equipos del Mundial 2026";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
