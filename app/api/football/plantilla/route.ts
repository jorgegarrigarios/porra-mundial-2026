import { NextResponse } from "next/server";
import { obtenerPlantilla } from "@/lib/api/football";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamIdRaw = searchParams.get("teamId");

    if (!teamIdRaw) {
      return NextResponse.json(
        { error: "Falta el parámetro teamId" },
        { status: 400 }
      );
    }

    const teamId = Number(teamIdRaw);

    if (!Number.isFinite(teamId)) {
      return NextResponse.json(
        { error: "teamId no válido" },
        { status: 400 }
      );
    }

    const jugadores = await obtenerPlantilla(teamId);

    return NextResponse.json({
      ok: true,
      teamId,
      total: jugadores.length,
      jugadores,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido consultando Football API";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
