function getApiFootballKey(): string {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("Falta API_FOOTBALL_KEY en las variables de entorno");
  }

  return apiKey;
}

const API_URL = "https://v3.football.api-sports.io";

export async function footballFetch(path: string) {
  const apiKey = getApiFootballKey();

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Football API error: ${res.status}`);
  }

  return res.json();
}

export async function obtenerPartidosPorLigaTemporada(
  ligaId: number,
  temporada: number
) {
  return footballFetch(`/fixtures?league=${ligaId}&season=${temporada}`);
}

export async function obtenerPlantilla(teamId: number) {
  const data = await footballFetch(`/players/squads?team=${teamId}`);

  return data?.response?.[0]?.players ?? [];
}
