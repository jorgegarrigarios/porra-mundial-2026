import { supabase } from "@/lib/supabase";

export const SELECCIONES_MUNDIAL = [
  { nombre: "España", teamId: 9 },
  { nombre: "Brasil", teamId: 6 },
  { nombre: "Argentina", teamId: 26 },
  { nombre: "Francia", teamId: 2 },
  { nombre: "Alemania", teamId: 25 },
  { nombre: "Inglaterra", teamId: 10 },
  { nombre: "Portugal", teamId: 27 },
  { nombre: "Italia", teamId: 768 },
];

export async function guardarJugadoresEnSupabase(jugadores: any[], seleccion: string, teamId: number) {
  const jugadoresFormateados = jugadores.map((j) => ({
    nombre_oficial: j.name,
    slug: j.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-"),
    seleccion,
    posicion: j.position ?? null,
    api_football_id: j.id ?? null,
    api_team_id: teamId,
    foto_url: j.photo ?? null,
    fuente: "api-football",
  }));

  return supabase.from("jugadores").upsert(jugadoresFormateados, {
    onConflict: "slug",
  });
}
