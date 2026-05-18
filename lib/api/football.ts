const API_URL = "https://v3.football.api-sports.io";

async function apiFootballFetch(endpoint: string) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "x-apisports-key": process.env.FOOTBALL_API_KEY || "",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Error API Football: ${response.status}`);
  }

  return response.json();
}

export async function buscarLigas(nombre: string) {
  const data = await apiFootballFetch(`/leagues?search=${nombre}`);
  return data.response;
}

export async function obtenerPartidosPorLigaTemporada(
  leagueId: number,
  season: number
) {
  const data = await apiFootballFetch(
    `/fixtures?league=${leagueId}&season=${season}`
  );

  return data.response;
}