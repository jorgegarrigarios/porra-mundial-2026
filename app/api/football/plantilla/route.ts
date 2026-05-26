import { NextResponse } from "next/server";
import { obtenerPlantilla, resolverSeleccionPorNombre } from "@/lib/api/football";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamIdRaw = searchParams.get("teamId");
    const nombre = searchParams.get("nombre");

    let teamId: number | null = null;
    let equipoResuelto: {
      nombre: string;
      nombreApi: string;
      teamId: number;
    } | null = null;

    if (teamIdRaw) {
      const parsed = Number(teamIdRaw);

      if (!Number.isFinite(parsed)) {
        return NextResponse.json(
          { error: "teamId no válido" },
          { status: 400 }
        );
      }

      teamId = parsed;
    } else if (nombre?.trim()) {
      const equipo = await resolverSeleccionPorNombre(nombre.trim());

      if (!equipo) {
        return NextResponse.json(
          {
            ok: false,
            error: `No se ha podido resolver el teamId para ${nombre}.`,
          },
          { status: 404 }
        );
      }

      teamId = equipo.teamId;
      equipoResuelto = {
        nombre: equipo.nombre,
        nombreApi: equipo.nombreApi,
        teamId: equipo.teamId,
      };
    }

    if (!teamId) {
      return NextResponse.json(
        { error: "Falta el parámetro teamId o nombre" },
        { status: 400 }
      );
    }

    const jugadores = await obtenerPlantilla(teamId);

    return NextResponse.json({
      ok: true,
      teamId,
      equipo: equipoResuelto,
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
