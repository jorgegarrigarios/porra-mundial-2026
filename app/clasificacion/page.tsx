"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  GitBranch,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Table2,
  Trophy,
} from "lucide-react";

import TeamFlag from "@/components/TeamFlag";
import { supabase } from "@/lib/supabase";

type Vista = "grupos" | "eliminatorias";

type ApiStandingItem = {
  rank: number;
  team: {
    id: number;
    name: string;
    logo?: string | null;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string | null;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update?: string | null;
};

type ApiStandingsResponse = {
  get?: string;
  parameters?: Record<string, unknown>;
  errors?: unknown;
  results?: number;
  response?: Array<{
    league?: {
      id?: number;
      name?: string;
      season?: number;
      standings?: ApiStandingItem[][];
    };
  }>;
  ok?: boolean;
  error?: string;
};

type GrupoNormalizado = {
  nombreApi: string;
  nombre: string;
  equipos: ApiStandingItem[];
};

const NOMBRES_EQUIPOS_ES: Record<string, string> = {
  Algeria: "Argelia",
  Argentina: "Argentina",
  Australia: "Australia",
  Austria: "Austria",
  Belgium: "Bélgica",
  "Bosnia & Herzegovina": "Bosnia y Herzegovina",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  Brazil: "Brasil",
  "Cape Verde": "Cabo Verde",
  "Cape Verde Islands": "Cabo Verde",
  Canada: "Canadá",
  Colombia: "Colombia",
  "Congo DR": "RD Congo",
  "DR Congo": "RD Congo",
  Croatia: "Croacia",
  Curacao: "Curazao",
  "Curaçao": "Curazao",
  "Czech Republic": "Chequia",
  Czechia: "Chequia",
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

type PartidoEliminatoria = {
  id: number;
  local: string | null;
  visitante: string | null;
  local_code: string | null;
  visitante_code: string | null;
  fecha_inicio: string | null;
  fase: string | null;
  resultado_local: number | null;
  resultado_visitante: number | null;
  clasificado_real: string | null;
};

type RondaEliminatoria = {
  ronda: string;
  partidos: PartidoEliminatoria[];
};

const FASES_ELIMINATORIAS = [
  "Dieciseisavos",
  "Octavos",
  "Cuartos",
  "Semifinales",
  "Tercer puesto",
  "Final",
];

const ORDEN_FASES_ELIMINATORIAS: Record<string, number> = {
  Dieciseisavos: 1,
  Octavos: 2,
  Cuartos: 3,
  Semifinales: 4,
  "Tercer puesto": 5,
  Final: 6,
};

function traducirEquipo(nombreApi: string) {
  return NOMBRES_EQUIPOS_ES[nombreApi] ?? nombreApi;
}

function traducirGrupo(nombreApi: string) {
  if (nombreApi === "Ranking of third-placed teams") {
    return "Ranking de mejores terceros";
  }

  const match = nombreApi.match(/^Group\s+([A-L])$/i);

  if (match?.[1]) {
    return `Grupo ${match[1].toUpperCase()}`;
  }

  return nombreApi;
}

function esGrupoPrincipal(nombreApi: string) {
  return /^Group\s+[A-L]$/i.test(nombreApi);
}

function descripcionClasificacion(descripcion: string | null) {
  if (!descripcion) return "";

  const descripcionMinuscula = descripcion.toLowerCase();

  if (
    descripcionMinuscula.includes("promotion") ||
    descripcionMinuscula.includes("playoffs")
  ) {
    return "Pasa a dieciseisavos";
  }

  return descripcion;
}

function extraerStandings(data: ApiStandingsResponse | null): GrupoNormalizado[] {
  const standings = data?.response?.[0]?.league?.standings;

  if (!Array.isArray(standings)) return [];

  return standings
    .map((grupo) => {
      const equipos = Array.isArray(grupo) ? grupo : [];
      const nombreApi = equipos[0]?.group ?? "Sin grupo";

      return {
        nombreApi,
        nombre: traducirGrupo(nombreApi),
        equipos,
      };
    })
    .filter((grupo) => grupo.equipos.length > 0);
}

function formatearActualizacion(valor?: string | null) {
  if (!valor) return "-";

  try {
    return new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(valor));
  } catch {
    return valor;
  }
}

function puntosEquipo(equipo: ApiStandingItem) {
  return Number.isFinite(equipo.points) ? equipo.points : 0;
}

function diferenciaGolesEquipo(equipo: ApiStandingItem) {
  return Number.isFinite(equipo.goalsDiff) ? equipo.goalsDiff : 0;
}

function esPlaceholderEquipo(valor: string | null | undefined) {
  const limpio = valor?.trim() ?? "";
  const normalizado = limpio.toLowerCase();

  return (
    !limpio ||
    /^[12][A-L]$/i.test(limpio) ||
    /^3[A-L](\/[A-L])+$/i.test(limpio) ||
    normalizado.startsWith("ganador ") ||
    normalizado.startsWith("perdedor ") ||
    normalizado.includes("winner") ||
    normalizado.includes("loser") ||
    normalizado.includes("tbd") ||
    normalizado.includes("pendiente")
  );
}

function formatearFechaPartido(fechaInicio: string | null) {
  if (!fechaInicio) return "Fecha pendiente";

  const fecha = new Date(fechaInicio);
  if (Number.isNaN(fecha.getTime())) return "Fecha pendiente";

  return fecha.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Madrid",
  });
}

function formatearHoraPartido(fechaInicio: string | null) {
  if (!fechaInicio) return "--:--";

  const fecha = new Date(fechaInicio);
  if (Number.isNaN(fecha.getTime())) return "--:--";

  return fecha.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

function normalizarComparacionEquipo(valor: string | null | undefined) {
  return valor
    ?.trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") ?? "";
}

function ordenarPartidosEliminatoria(a: PartidoEliminatoria, b: PartidoEliminatoria) {
  const ordenA = ORDEN_FASES_ELIMINATORIAS[a.fase ?? ""] ?? 99;
  const ordenB = ORDEN_FASES_ELIMINATORIAS[b.fase ?? ""] ?? 99;

  if (ordenA !== ordenB) return ordenA - ordenB;

  const fechaA = a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : Number.MAX_SAFE_INTEGER;
  const fechaB = b.fecha_inicio ? new Date(b.fecha_inicio).getTime() : Number.MAX_SAFE_INTEGER;

  if (fechaA !== fechaB) return fechaA - fechaB;

  return a.id - b.id;
}

function construirRondasEliminatorias(partidos: PartidoEliminatoria[]): RondaEliminatoria[] {
  return FASES_ELIMINATORIAS.map((fase) => ({
    ronda: fase,
    partidos: partidos
      .filter((partido) => partido.fase === fase)
      .sort(ordenarPartidosEliminatoria),
  })).filter((ronda) => ronda.partidos.length > 0);
}

export default function ClasificacionPage() {
  const [vista, setVista] = useState<Vista>("grupos");
  const [data, setData] = useState<ApiStandingsResponse | null>(null);
  const [partidosEliminatorias, setPartidosEliminatorias] = useState<PartidoEliminatoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoEliminatorias, setCargandoEliminatorias] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorEliminatorias, setErrorEliminatorias] = useState<string | null>(null);

  async function cargarStandings() {
    setCargando(true);
    setError(null);

    try {
      const res = await fetch("/api/football/standings", {
        method: "GET",
        cache: "no-store",
      });

      const json = (await res.json()) as ApiStandingsResponse;

      if (!res.ok) {
        throw new Error(json.error ?? "No se pudo cargar la clasificación.");
      }

      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido cargando la clasificación."
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarEliminatorias() {
    setCargandoEliminatorias(true);
    setErrorEliminatorias(null);

    try {
      const { data: partidosData, error: partidosError } = await supabase
        .from("partidos")
        .select(
          "id, local, visitante, local_code, visitante_code, fecha_inicio, fase, resultado_local, resultado_visitante, clasificado_real"
        )
        .in("fase", FASES_ELIMINATORIAS)
        .order("fecha_inicio", { ascending: true, nullsFirst: false });

      if (partidosError) {
        throw new Error(partidosError.message);
      }

      setPartidosEliminatorias(
        ((partidosData ?? []) as PartidoEliminatoria[]).sort(ordenarPartidosEliminatoria)
      );
    } catch (err) {
      setErrorEliminatorias(
        err instanceof Error
          ? err.message
          : "Error desconocido cargando el cuadro eliminatorio."
      );
      setPartidosEliminatorias([]);
    } finally {
      setCargandoEliminatorias(false);
    }
  }

  useEffect(() => {
    cargarStandings();
    cargarEliminatorias();
  }, []);

  const grupos = useMemo(() => extraerStandings(data), [data]);

  const rondasEliminatorias = useMemo(
    () => construirRondasEliminatorias(partidosEliminatorias),
    [partidosEliminatorias]
  );

  const gruposPrincipales = grupos.filter((grupo) =>
    esGrupoPrincipal(grupo.nombreApi)
  );

  const mejoresTerceros =
    grupos.find((grupo) => grupo.nombreApi === "Ranking of third-placed teams") ??
    null;

  return (
    <main className="clasificacionPage">
      <div className="container">
        <div className="header">
          <div className="headerIcon">
            {vista === "grupos" ? <Table2 size={30} /> : <GitBranch size={30} />}
          </div>

          <div>
            <h1>Clasificación</h1>
            <p>
              Grupos, mejores terceros y cuadro eliminatorio del Mundial 2026.
            </p>
          </div>
        </div>

        <div className="topActions">
          <div className="tabs">
            <button
              type="button"
              className={`tab ${vista === "grupos" ? "active" : ""}`}
              onClick={() => setVista("grupos")}
            >
              <Table2 size={18} />
              Grupos
            </button>

            <button
              type="button"
              className={`tab ${vista === "eliminatorias" ? "active" : ""}`}
              onClick={() => setVista("eliminatorias")}
            >
              <GitBranch size={18} />
              Eliminatorias
            </button>
          </div>

          <button
            type="button"
            className="refreshButton"
            onClick={vista === "grupos" ? cargarStandings : cargarEliminatorias}
            disabled={vista === "grupos" ? cargando : cargandoEliminatorias}
          >
            {(vista === "grupos" ? cargando : cargandoEliminatorias) ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            Actualizar
          </button>
        </div>

        {vista === "grupos" ? (
          <GruposView
            cargando={cargando}
            error={error}
            gruposPrincipales={gruposPrincipales}
            mejoresTerceros={mejoresTerceros}
          />
        ) : (
          <EliminatoriasView
            cargando={cargandoEliminatorias}
            error={errorEliminatorias}
            rondas={rondasEliminatorias}
          />
        )}
      </div>

      <Styles />
    </main>
  );
}

function GruposView({
  cargando,
  error,
  gruposPrincipales,
  mejoresTerceros,
}: {
  cargando: boolean;
  error: string | null;
  gruposPrincipales: GrupoNormalizado[];
  mejoresTerceros: GrupoNormalizado | null;
}) {
  if (cargando && gruposPrincipales.length === 0) {
    return (
      <div className="loadingBox">
        <Loader2 className="spin" size={30} />
        <p>Cargando clasificación oficial desde API-FOOTBALL...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="errorBox">
        <AlertTriangle size={22} />
        <div>
          <strong>No se ha podido cargar la clasificación</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (gruposPrincipales.length === 0) {
    return (
      <div className="errorBox">
        <AlertTriangle size={22} />
        <div>
          <strong>No hay datos de clasificación disponibles</strong>
          <p>
            La API no ha devuelto standings para los grupos del Mundial 2026.
            Revisa la pantalla Admin Standings para confirmar la respuesta de
            API-FOOTBALL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rulesPanel">
        <div className="rulesIcon">
          <ShieldCheck size={26} />
        </div>

        <div>
          <h2>Formato Mundial 2026</h2>
          <p>
            Pasan los dos primeros de cada grupo y los 8 mejores terceros. Esta
            clasificación ya no usa datos mock: lee la misma respuesta real que
            Admin Standings desde API-FOOTBALL.
          </p>
        </div>
      </div>

      <div className="legend">
        <div>
          <span className="legendDot direct" /> 1º y 2º: clasificados directos
        </div>
        <div>
          <span className="legendDot third" /> 3º: opción mejores terceros
        </div>
        <div>
          <span className="legendDot pending" /> 4º: pendiente / eliminado
        </div>
      </div>

      <div className="groupsGrid">
        {gruposPrincipales.map((grupo) => (
          <section key={grupo.nombreApi} className="groupCard">
            <div className="groupHeader">
              <Trophy size={22} color="#facc15" />
              <div>
                <h2>{grupo.nombre}</h2>
                <span>{grupo.nombreApi}</span>
              </div>
            </div>

            <div className="teams">
              <div className="tableHeader">
                <span>Pos</span>
                <span>Selección</span>
                <span>PJ</span>
                <span>G</span>
                <span>E</span>
                <span>P</span>
                <span>DG</span>
                <span>Pts</span>
              </div>

              {grupo.equipos.map((equipo) => {
                const esDirecto = equipo.rank <= 2;
                const esTercero = equipo.rank === 3;
                const descripcion = descripcionClasificacion(equipo.description);

                return (
                  <div
                    key={`${grupo.nombreApi}-${equipo.team.id}`}
                    className={`teamRow ${
                      esDirecto ? "directRow" : esTercero ? "thirdRow" : ""
                    }`}
                  >
                    <span
                      className={`position ${
                        esDirecto ? "direct" : esTercero ? "third" : ""
                      }`}
                    >
                      {equipo.rank}
                    </span>

                    <div className="teamCell">
                      {equipo.team.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={equipo.team.logo}
                          alt={traducirEquipo(equipo.team.name)}
                          className="flag"
                        />
                      ) : (
                        <span className="placeholderFlag" />
                      )}

                      <div>
                        <span className="teamName">
                          {traducirEquipo(equipo.team.name)}
                        </span>
                        <span className="teamStatus">
                          {descripcion ||
                            (esDirecto
                              ? "Clasifica directo"
                              : esTercero
                              ? "Opción mejor tercero"
                              : "Pendiente")}
                        </span>
                      </div>
                    </div>

                    <span className="stat">{equipo.all.played}</span>
                    <span className="stat">{equipo.all.win}</span>
                    <span className="stat">{equipo.all.draw}</span>
                    <span className="stat">{equipo.all.lose}</span>
                    <span className="stat">
                      {diferenciaGolesEquipo(equipo) > 0
                        ? `+${diferenciaGolesEquipo(equipo)}`
                        : diferenciaGolesEquipo(equipo)}
                    </span>
                    <span className="status">{puntosEquipo(equipo)}</span>
                  </div>
                );
              })}
            </div>

            <p className="note">
              Última actualización API:{" "}
              {formatearActualizacion(grupo.equipos[0]?.update)}
            </p>
          </section>
        ))}
      </div>

      {mejoresTerceros && (
        <section className="thirdsPanel">
          <div className="thirdsHeader">
            <div>
              <p className="eyebrow">Nueva ronda 2026</p>
              <h2>Ranking de mejores terceros</h2>
              <p>
                API-FOOTBALL devuelve este bloque de forma separada. Los 8
                primeros pasan a dieciseisavos.
              </p>
            </div>

            <div className="thirdsCounter">
              <strong>8/12</strong>
              <span>clasifican</span>
            </div>
          </div>

          <div className="thirdsGrid">
            {mejoresTerceros.equipos.map((equipo) => {
              const clasifica = equipo.rank <= 8;

              return (
                <article
                  key={`terceros-${equipo.team.id}`}
                  className={`thirdCard ${clasifica ? "qualified" : ""}`}
                >
                  <span className="thirdPosition">{equipo.rank}</span>

                  {equipo.team.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={equipo.team.logo}
                      alt={traducirEquipo(equipo.team.name)}
                      className="flag"
                    />
                  ) : (
                    <span className="placeholderFlag" />
                  )}

                  <div>
                    <strong>{traducirEquipo(equipo.team.name)}</strong>
                    <span>
                      {puntosEquipo(equipo)} pts · DG{" "}
                      {diferenciaGolesEquipo(equipo) > 0
                        ? `+${diferenciaGolesEquipo(equipo)}`
                        : diferenciaGolesEquipo(equipo)}
                    </span>
                  </div>

                  <div className={`thirdStatus ${clasifica ? "ok" : "wait"}`}>
                    {clasifica ? "Pasa" : "Fuera"}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

function EliminatoriasView({
  cargando,
  error,
  rondas,
}: {
  cargando: boolean;
  error: string | null;
  rondas: RondaEliminatoria[];
}) {
  if (cargando && rondas.length === 0) {
    return (
      <div className="loadingBox">
        <Loader2 className="spin" size={30} />
        <p>Cargando cuadro eliminatorio desde la tabla de partidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="errorBox">
        <AlertTriangle size={22} />
        <div>
          <strong>No se ha podido cargar el cuadro eliminatorio</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (rondas.length === 0) {
    return (
      <div className="errorBox">
        <AlertTriangle size={22} />
        <div>
          <strong>No hay partidos de eliminatorias cargados</strong>
          <p>
            Revisa que la tabla partidos tenga registros con fase Dieciseisavos,
            Octavos, Cuartos, Semifinales, Tercer puesto o Final.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bracketIntro">
        <div className="bracketIntroIcon">
          <GitBranch size={28} />
        </div>

        <div>
          <h2>Cuadro eliminatorio</h2>
          <p>
            Visualiza el camino hacia la final con los cruces reales cargados en
            la aplicación. El cuadro se alimenta de la tabla partidos, igual que
            Partidos y Mis pronósticos.
          </p>
        </div>
      </div>

      <div className="bracketScroll">
        <div
          className="bracket"
          style={{
            gridTemplateColumns: `repeat(${Math.max(rondas.length, 1)}, 1fr)`,
          }}
        >
          {rondas.map((ronda) => (
            <section key={ronda.ronda} className="roundColumn">
              <div className="roundHeader">
                <Trophy size={20} color="#facc15" />
                <h2>{ronda.ronda}</h2>
              </div>

              <div className="matches">
                {ronda.partidos.map((partido) => {
                  const local = partido.local ?? "Clasificado pendiente";
                  const visitante = partido.visitante ?? "Clasificado pendiente";
                  const ganador = partido.clasificado_real;
                  const finalizado =
                    partido.resultado_local !== null &&
                    partido.resultado_visitante !== null;

                  return (
                    <article key={partido.id} className="matchCard">
                      <div className="matchDate">
                        {formatearFechaPartido(partido.fecha_inicio)} · {formatearHoraPartido(partido.fecha_inicio)}
                      </div>

                      <BracketTeam
                        name={local}
                        code={partido.local_code}
                        winner={Boolean(
                          ganador &&
                            local &&
                            normalizarComparacionEquipo(ganador) === normalizarComparacionEquipo(local)
                        )}
                      />

                      <BracketTeam
                        name={visitante}
                        code={partido.visitante_code}
                        winner={Boolean(
                          ganador &&
                            visitante &&
                            normalizarComparacionEquipo(ganador) === normalizarComparacionEquipo(visitante)
                        )}
                      />

                      {finalizado && (
                        <div className="matchResult">
                          {partido.resultado_local} - {partido.resultado_visitante}
                        </div>
                      )}

                      <div className={`winnerBadge ${ganador ? "winnerKnown" : ""}`}>
                        <Trophy size={13} />
                        {ganador ? `Pasa ${ganador}` : "Ganador pendiente"}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

function BracketTeam({
  name,
  code,
  winner,
}: {
  name: string;
  code: string | null;
  winner: boolean;
}) {
  const pendiente = esPlaceholderEquipo(name);

  return (
    <div className={`matchTeam ${winner ? "matchTeamWinner" : ""}`}>
      {pendiente ? (
        <span className="placeholderFlag" />
      ) : (
        <TeamFlag code={code} name={name} size="sm" />
      )}

      <span className="matchTeamName">{name}</span>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      .clasificacionPage {
        min-height: 100vh;
        overflow-x: hidden;
        background: linear-gradient(180deg, #020617 0%, #111827 100%);
        color: white;
        padding: 32px 16px 110px;
      }

      .container {
        max-width: 1180px;
        width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 24px;
      }

      .headerIcon {
        width: 62px;
        height: 62px;
        border-radius: 20px;
        background: #7c3aed;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .header h1 {
        font-size: 44px;
        font-weight: 900;
        margin: 0;
      }

      .header p {
        color: #94a3b8;
        margin-top: 4px;
      }

      .topActions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 28px;
      }

      .tabs {
        display: inline-flex;
        gap: 8px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 999px;
        padding: 6px;
      }

      .tab {
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: none;
        border-radius: 999px;
        padding: 11px 18px;
        background: transparent;
        color: #cbd5e1;
        font-weight: 900;
      }

      .tab.active {
        background: #2563eb;
        color: white;
        box-shadow: 0 0 24px rgba(37,99,235,0.42);
      }

      .refreshButton {
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        border: 1px solid rgba(34,197,94,0.34);
        border-radius: 999px;
        padding: 13px 18px;
        background: rgba(22,163,74,0.18);
        color: #bbf7d0;
        font-weight: 950;
      }

      .refreshButton:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .loadingBox,
      .errorBox {
        border-radius: 24px;
        padding: 20px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 18px;
        line-height: 1.5;
      }

      .loadingBox {
        min-height: 220px;
        align-items: center;
        justify-content: center;
        background: rgba(15,23,42,0.78);
        border: 1px solid rgba(148,163,184,0.22);
        color: #cbd5e1;
        font-weight: 850;
      }

      .errorBox {
        background: rgba(239,68,68,0.14);
        border: 1px solid rgba(239,68,68,0.30);
        color: #fecaca;
      }

      .errorBox strong {
        display: block;
        color: white;
        font-size: 18px;
        margin-bottom: 4px;
      }

      .errorBox p {
        margin: 0;
        color: #fecaca;
        font-weight: 750;
      }

      .rulesPanel {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        background: linear-gradient(135deg, rgba(37,99,235,0.22), rgba(15,23,42,0.88));
        border: 1px solid rgba(96,165,250,0.28);
        border-radius: 26px;
        padding: 20px;
        margin-bottom: 16px;
      }

      .rulesIcon {
        width: 56px;
        height: 56px;
        border-radius: 20px;
        background: rgba(37,99,235,0.22);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #bfdbfe;
        flex-shrink: 0;
      }

      .rulesPanel h2 {
        margin: 0;
        font-size: 26px;
        font-weight: 950;
        letter-spacing: -0.035em;
      }

      .rulesPanel p {
        margin: 8px 0 0;
        color: #cbd5e1;
        line-height: 1.55;
        font-weight: 750;
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 20px;
      }

      .legend div {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 9px 12px;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.10);
        color: #cbd5e1;
        font-size: 13px;
        font-weight: 900;
      }

      .legendDot {
        width: 11px;
        height: 11px;
        border-radius: 999px;
      }

      .legendDot.direct { background: #22c55e; }
      .legendDot.third { background: #facc15; }
      .legendDot.pending { background: #64748b; }

      .groupsGrid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 22px;
      }

      .groupCard,
      .roundColumn {
        background: linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.65));
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 28px;
        padding: 24px;
      }

      .groupHeader,
      .roundHeader {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
      }

      .groupHeader h2,
      .roundHeader h2 {
        font-size: 26px;
        font-weight: 900;
        margin: 0;
      }

      .groupHeader span {
        display: block;
        color: #93c5fd;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-top: 4px;
      }

      .teams {
        display: grid;
        gap: 10px;
        width: 100%;
        overflow-x: auto;
        padding-bottom: 2px;
        scrollbar-width: thin;
      }

      .tableHeader,
      .teamRow {
        display: grid;
        grid-template-columns: 36px minmax(180px, 1fr) repeat(6, 42px);
        gap: 8px;
        align-items: center;
      }

      .tableHeader {
        color: #94a3b8;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .10em;
        text-transform: uppercase;
        padding: 0 12px 4px;
      }

      .teamRow {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 12px;
      }

      .teamRow.directRow {
        background: rgba(34,197,94,0.08);
        border-color: rgba(34,197,94,0.24);
      }

      .teamRow.thirdRow {
        background: rgba(250,204,21,0.08);
        border-color: rgba(250,204,21,0.24);
      }

      .position {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 950;
        font-size: 12px;
      }

      .position.direct {
        color: #bbf7d0;
        background: rgba(34,197,94,0.18);
        border: 1px solid rgba(34,197,94,0.30);
      }

      .position.third {
        color: #fde68a;
        background: rgba(250,204,21,0.18);
        border: 1px solid rgba(250,204,21,0.30);
      }

      .flag {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        object-fit: contain;
        border: 2px solid rgba(255,255,255,0.22);
        background: rgba(255,255,255,0.08);
      }

      .placeholderFlag {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.18);
        flex-shrink: 0;
      }

      .teamCell {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .teamName {
        display: block;
        font-weight: 950;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .teamStatus {
        display: block;
        margin-top: 2px;
        color: #94a3b8;
        font-size: 11px;
        font-weight: 850;
      }

      .stat {
        text-align: center;
        color: #cbd5e1;
        font-size: 13px;
        font-weight: 900;
      }

      .status {
        color: #bfdbfe;
        font-weight: 950;
        font-size: 15px;
        text-align: center;
      }

      .note {
        color: #86efac;
        margin-top: 16px;
        font-size: 13px;
        font-weight: 850;
        line-height: 1.45;
      }

      .thirdsPanel {
        margin-top: 22px;
        background: linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.65));
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 28px;
        padding: 24px;
      }

      .thirdsHeader {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 18px;
        align-items: start;
        margin-bottom: 18px;
      }

      .eyebrow {
        margin: 0 0 8px;
        color: #fde68a;
        font-size: 12px;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .thirdsHeader h2 {
        margin: 0;
        font-size: clamp(30px, 4vw, 42px);
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.04em;
      }

      .thirdsHeader p {
        margin: 10px 0 0;
        color: #cbd5e1;
        line-height: 1.55;
        font-weight: 750;
      }

      .thirdsCounter {
        min-width: 132px;
        border-radius: 24px;
        padding: 16px;
        text-align: center;
        background: rgba(250,204,21,0.12);
        border: 1px solid rgba(250,204,21,0.24);
      }

      .thirdsCounter strong {
        display: block;
        font-size: 32px;
        line-height: 1;
        font-weight: 950;
        color: #fde68a;
      }

      .thirdsCounter span {
        display: block;
        margin-top: 5px;
        color: #fef3c7;
        font-size: 12px;
        font-weight: 950;
        text-transform: uppercase;
      }

      .thirdsGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .thirdCard {
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        align-items: center;
        gap: 10px;
        border-radius: 20px;
        padding: 12px;
        background: rgba(255,255,255,0.055);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .thirdCard.qualified {
        border-color: rgba(34,197,94,0.24);
        background: rgba(34,197,94,0.075);
      }

      .thirdPosition {
        width: 30px;
        height: 30px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.10);
        font-size: 13px;
        font-weight: 950;
      }

      .thirdCard strong {
        display: block;
        font-size: 14px;
        font-weight: 950;
      }

      .thirdCard span:not(.thirdPosition) {
        display: block;
        margin-top: 3px;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 800;
      }

      .thirdStatus {
        border-radius: 999px;
        padding: 7px 9px;
        font-size: 11px;
        font-weight: 950;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .thirdStatus.ok {
        color: #86efac;
        background: rgba(34,197,94,0.14);
      }

      .thirdStatus.wait {
        color: #cbd5e1;
        background: rgba(148,163,184,0.14);
      }

      .bracketIntro {
        background: linear-gradient(135deg, rgba(37,99,235,0.22), rgba(15,23,42,0.88));
        border: 1px solid rgba(37,99,235,0.45);
        border-radius: 24px;
        padding: 22px;
        margin-bottom: 22px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .bracketIntroIcon {
        width: 56px;
        height: 56px;
        border-radius: 18px;
        background: #2563eb;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .bracketIntro h2 {
        font-size: 24px;
        font-weight: 900;
        margin: 0;
      }

      .bracketIntro p {
        color: #cbd5e1;
        margin-top: 6px;
        line-height: 1.5;
      }

      .bracketScroll {
        overflow-x: auto;
        padding-bottom: 12px;
      }

      .bracket {
        min-width: 1260px;
        display: grid;
        gap: 18px;
        align-items: start;
      }

      .matches {
        display: grid;
        gap: 16px;
      }

      .matchCard {
        background: rgba(0,0,0,0.26);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 20px;
        padding: 14px;
        position: relative;
      }

      .matchDate {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        max-width: 100%;
        margin-bottom: 10px;
        border-radius: 999px;
        padding: 6px 9px;
        background: rgba(37,99,235,0.14);
        border: 1px solid rgba(96,165,250,0.20);
        color: #bfdbfe;
        font-size: 11px;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: .04em;
      }

      .matchCard::after {
        content: "";
        position: absolute;
        right: -18px;
        top: 50%;
        width: 18px;
        height: 1px;
        background: rgba(96,165,250,0.45);
      }

      .roundColumn:last-child .matchCard::after {
        display: none;
      }

      .matchTeam {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 10px;
        border-radius: 14px;
        background: rgba(255,255,255,0.04);
        font-weight: 900;
        min-height: 42px;
      }

      .matchTeamWinner {
        background: rgba(34,197,94,0.14);
        border: 1px solid rgba(34,197,94,0.30);
        color: #bbf7d0;
      }

      .matchTeam + .matchTeam {
        margin-top: 8px;
      }

      .matchTeamName {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
      }

      .matchResult {
        margin-top: 10px;
        width: fit-content;
        border-radius: 999px;
        padding: 6px 10px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.10);
        color: white;
        font-size: 13px;
        font-weight: 950;
      }

      .winnerBadge {
        margin-top: 10px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #facc15;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .winnerKnown {
        color: #86efac;
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @media (max-width: 820px) {
        .groupsGrid {
          grid-template-columns: 1fr;
        }

        .bracketIntro {
          align-items: flex-start;
        }
      }

      @media (max-width: 640px) {
        .clasificacionPage {
          padding: 22px 12px calc(170px + env(safe-area-inset-bottom));
          overflow-x: hidden;
        }

        .container {
          max-width: 100%;
          overflow-x: hidden;
        }

        .header {
          align-items: flex-start;
        }

        .headerIcon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
        }

        .header h1 {
          font-size: 34px;
        }

        .header p {
          font-size: 14px;
        }

        .topActions {
          display: grid;
          grid-template-columns: 1fr;
        }

        .tabs {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          box-sizing: border-box;
        }

        .tab {
          justify-content: center;
          padding: 11px 10px;
          font-size: 13px;
        }

        .refreshButton {
          width: 100%;
        }

        .rulesPanel {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          padding: 16px;
          border-radius: 22px;
        }

        .rulesIcon {
          width: 46px;
          height: 46px;
          border-radius: 16px;
        }

        .rulesPanel h2 {
          font-size: 22px;
        }

        .rulesPanel p {
          font-size: 14px;
        }

        .legend {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .legend div {
          width: fit-content;
          max-width: 100%;
          box-sizing: border-box;
        }

        .groupsGrid {
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .groupCard {
          width: 100%;
          overflow: hidden;
          padding: 16px;
          border-radius: 22px;
          box-sizing: border-box;
        }

        .groupHeader {
          margin-bottom: 14px;
        }

        .groupHeader h2,
        .roundHeader h2 {
          font-size: 22px;
        }

        .teams {
          width: 100%;
          overflow: visible;
          gap: 10px;
          padding-bottom: 0;
        }

        .tableHeader {
          display: none;
        }

        .teamRow {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          display: grid;
          grid-template-columns: 34px repeat(5, minmax(25px, 1fr)) 52px;
          grid-template-areas:
            "pos team team team team team pts"
            ".   pj   g    e    p    dg   .";
          gap: 9px 7px;
          padding: 12px 10px;
          border-radius: 18px;
        }

        .teamRow .position {
          grid-area: pos;
          width: 31px;
          height: 31px;
        }

        .teamRow .teamCell {
          grid-area: team;
          min-width: 0;
        }

        .teamRow .flag,
        .teamRow .placeholderFlag {
          width: 34px;
          height: 34px;
        }

        .teamRow .teamName {
          max-width: 100%;
          font-size: 15px;
          line-height: 1.15;
        }

        .teamRow .teamStatus {
          max-width: 100%;
          font-size: 11px;
          line-height: 1.2;
          white-space: normal;
        }

        .teamRow .stat,
        .teamRow .status {
          min-width: 0;
          border-radius: 12px;
          background: rgba(2,6,23,0.28);
          padding: 6px 3px;
          text-align: center;
          font-size: 13px;
          line-height: 1;
        }

        .teamRow .stat::before,
        .teamRow .status::before {
          display: block;
          margin-bottom: 4px;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .teamRow > .stat:nth-child(3) {
          grid-area: pj;
        }

        .teamRow > .stat:nth-child(3)::before {
          content: "PJ";
        }

        .teamRow > .stat:nth-child(4) {
          grid-area: g;
        }

        .teamRow > .stat:nth-child(4)::before {
          content: "G";
        }

        .teamRow > .stat:nth-child(5) {
          grid-area: e;
        }

        .teamRow > .stat:nth-child(5)::before {
          content: "E";
        }

        .teamRow > .stat:nth-child(6) {
          grid-area: p;
        }

        .teamRow > .stat:nth-child(6)::before {
          content: "P";
        }

        .teamRow > .stat:nth-child(7) {
          grid-area: dg;
        }

        .teamRow > .stat:nth-child(7)::before {
          content: "DG";
        }

        .teamRow > .status {
          grid-area: pts;
          align-self: stretch;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #dbeafe;
          background: rgba(37,99,235,0.16);
          border: 1px solid rgba(96,165,250,0.24);
          font-size: 18px;
        }

        .teamRow > .status::before {
          content: "Pts";
        }

        .note {
          font-size: 14px;
          margin-top: 14px;
          padding: 12px 13px;
          border-radius: 16px;
          background: rgba(34,197,94,0.10);
          border: 1px solid rgba(34,197,94,0.20);
        }

        .thirdsPanel {
          padding: 16px;
          overflow: hidden;
          border-radius: 22px;
        }

        .thirdsHeader {
          grid-template-columns: 1fr;
        }

        .thirdsHeader h2 {
          font-size: 28px;
        }

        .thirdsCounter {
          width: 100%;
          box-sizing: border-box;
          text-align: left;
        }

        .thirdsGrid {
          grid-template-columns: 1fr;
        }

        .thirdCard {
          grid-template-columns: auto auto 1fr;
          align-items: center;
        }

        .thirdStatus {
          grid-column: 3;
          width: fit-content;
        }

        .roundColumn,
        .bracketIntro {
          padding: 16px;
          border-radius: 22px;
        }

        .bracketScroll {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 10px;
        }

        .bracket {
          min-width: 1080px;
        }
      }
    `}</style>
  );
}
