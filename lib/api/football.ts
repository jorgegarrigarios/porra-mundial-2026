function getApiFootballKey(): string {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    throw new Error("Falta API_FOOTBALL_KEY en las variables de entorno");
  }

  return apiKey;
}

const API_URL = "https://v3.football.api-sports.io";

export const WORLD_CUP_2026_LEAGUE_ID = 1;
export const WORLD_CUP_2026_SEASON = 2026;

type ApiFootballTeamResponse = {
  team?: {
    id?: number;
    name?: string;
    code?: string | null;
    country?: string | null;
    national?: boolean;
    logo?: string | null;
  };
};

export type EquipoMundialApiFootball = {
  nombre: string;
  nombreApi: string;
  teamId: number;
  code: string | null;
  country: string | null;
  logo: string | null;
};

const NOMBRES_EQUIPOS_ES: Record<string, string> = {
  Algeria: "Argelia",
  Argentina: "Argentina",
  Australia: "Australia",
  Austria: "Austria",
  Belgium: "Bélgica",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  Brazil: "Brasil",
  "Cape Verde": "Cabo Verde",
  Canada: "Canadá",
  Colombia: "Colombia",
  Croatia: "Croacia",
  Curacao: "Curazao",
  "Curaçao": "Curazao",
  "Czech Republic": "Chequia",
  Czechia: "Chequia",
  "Congo DR": "RD Congo",
  "DR Congo": "RD Congo",
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

const BUSQUEDA_API_POR_NOMBRE_ES: Record<string, string> = {
  "alemania": "Germany",
  "arabia saudi": "Saudi Arabia",
  "argelia": "Algeria",
  "argentina": "Argentina",
  "australia": "Australia",
  "austria": "Austria",
  "belgica": "Belgium",
  "bosnia y herzegovina": "Bosnia",
  "brasil": "Brazil",
  "cabo verde": "Cape Verde",
  "canada": "Canada",
  "catar": "Qatar",
  "chequia": "Czech",
  "colombia": "Colombia",
  "corea del sur": "South Korea",
  "costa de marfil": "Ivory Coast",
  "croacia": "Croatia",
  "curazao": "Curacao",
  "ecuador": "Ecuador",
  "egipto": "Egypt",
  "escocia": "Scotland",
  "espana": "Spain",
  "estados unidos": "USA",
  "francia": "France",
  "ghana": "Ghana",
  "haiti": "Haiti",
  "inglaterra": "England",
  "irak": "Iraq",
  "iran": "Iran",
  "japon": "Japan",
  "jordania": "Jordan",
  "marruecos": "Morocco",
  "mexico": "Mexico",
  "noruega": "Norway",
  "nueva zelanda": "New Zealand",
  "paises bajos": "Netherlands",
  "panama": "Panama",
  "paraguay": "Paraguay",
  "portugal": "Portugal",
  "rd congo": "Congo",
  "senegal": "Senegal",
  "sudafrica": "South Africa",
  "suecia": "Sweden",
  "suiza": "Switzerland",
  "tunez": "Tunisia",
  "turquia": "Turkey",
  "uruguay": "Uruguay",
  "uzbekistan": "Uzbekistan",
};

function traducirNombreEquipo(nombreApi: string) {
  return NOMBRES_EQUIPOS_ES[nombreApi] ?? nombreApi;
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

function obtenerBusquedaApi(nombre: string) {
  const normalizado = normalizarTexto(nombre);

  return BUSQUEDA_API_POR_NOMBRE_ES[normalizado] ?? nombre.trim();
}

function mapearEquipo(item: ApiFootballTeamResponse): EquipoMundialApiFootball | null {
  const team = item.team;
  const teamId = team?.id;
  const nombreApi = team?.name?.trim();

  if (!teamId || !nombreApi) return null;

  return {
    nombre: traducirNombreEquipo(nombreApi),
    nombreApi,
    teamId,
    code: team?.code ?? null,
    country: team?.country ?? null,
    logo: team?.logo ?? null,
  };
}

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

export async function obtenerPartidosMundial2026() {
  return obtenerPartidosPorLigaTemporada(
    WORLD_CUP_2026_LEAGUE_ID,
    WORLD_CUP_2026_SEASON
  );
}

export async function obtenerEquiposMundial2026(): Promise<EquipoMundialApiFootball[]> {
  const data = await footballFetch(
    `/teams?league=${WORLD_CUP_2026_LEAGUE_ID}&season=${WORLD_CUP_2026_SEASON}`
  );

  const response = Array.isArray(data?.response)
    ? (data.response as ApiFootballTeamResponse[])
    : [];

  return response
    .map(mapearEquipo)
    .filter((equipo): equipo is EquipoMundialApiFootball => equipo !== null)
    .filter((equipo) => normalizarTexto(equipo.nombre) !== "italia")
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function buscarEquiposPorNombre(
  nombre: string
): Promise<EquipoMundialApiFootball[]> {
  const busqueda = obtenerBusquedaApi(nombre);

  if (!busqueda) return [];

  const data = await footballFetch(`/teams?search=${encodeURIComponent(busqueda)}`);

  const response = Array.isArray(data?.response)
    ? (data.response as ApiFootballTeamResponse[])
    : [];

  return response
    .map(mapearEquipo)
    .filter((equipo): equipo is EquipoMundialApiFootball => equipo !== null)
    .sort((a, b) => {
      const aNacional = a.country && a.nombreApi ? 0 : 1;
      const bNacional = b.country && b.nombreApi ? 0 : 1;

      if (aNacional !== bNacional) return aNacional - bNacional;

      return a.nombre.localeCompare(b.nombre, "es");
    });
}

export async function resolverSeleccionPorNombre(
  nombre: string
): Promise<EquipoMundialApiFootball | null> {
  const equipos = await buscarEquiposPorNombre(nombre);

  if (equipos.length === 0) return null;

  const objetivoNormalizado = normalizarTexto(nombre);

  const exactoEnEspanol = equipos.find(
    (equipo) => normalizarTexto(equipo.nombre) === objetivoNormalizado
  );

  if (exactoEnEspanol) return exactoEnEspanol;

  const exactoApi = equipos.find(
    (equipo) => normalizarTexto(equipo.nombreApi) === objetivoNormalizado
  );

  if (exactoApi) return exactoApi;

  return equipos[0] ?? null;
}

export async function obtenerPlantilla(teamId: number) {
  const data = await footballFetch(`/players/squads?team=${teamId}`);

  return data?.response?.[0]?.players ?? [];
}
