"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Shield,
  UploadCloud,
  Calculator,
  Trophy,
} from "lucide-react";

import { comprobarAdminActual } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

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

  if (descripcion.toLowerCase().includes("promotion")) {
    return "Pasa a dieciseisavos";
  }

  if (descripcion.toLowerCase().includes("playoffs")) {
    return "Pasa a dieciseisavos";
  }

  return descripcion;
}

function extraerStandings(data: ApiStandingsResponse): GrupoNormalizado[] {
  const standings = data.response?.[0]?.league?.standings;

  if (!Array.isArray(standings)) return [];

  return standings
    .map((grupo) => {
      const nombreApi = grupo?.[0]?.group ?? "Sin grupo";

      return {
        nombreApi,
        nombre: traducirGrupo(nombreApi),
        equipos: Array.isArray(grupo) ? grupo : [],
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

export default function AdminStandingsPage() {
  const router = useRouter();

  const [autorizado, setAutorizado] = useState(false);
  const [cargandoPermisos, setCargandoPermisos] = useState(true);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [data, setData] = useState<ApiStandingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importandoGrupos, setImportandoGrupos] = useState(false);
  const [recalculandoGrupos, setRecalculandoGrupos] = useState(false);
  const [actualizandoCruces, setActualizandoCruces] = useState(false);
  const [mensajeImportacion, setMensajeImportacion] = useState<string | null>(null);
  const [errorImportacion, setErrorImportacion] = useState<string | null>(null);

  async function cargarStandings() {
    setCargandoDatos(true);
    setError(null);

    try {
      const res = await fetch("/api/football/standings", {
        method: "GET",
        cache: "no-store",
      });

      const json = (await res.json()) as ApiStandingsResponse & {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(json.error ?? "No se pudieron cargar los standings.");
      }

      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido cargando standings."
      );
    } finally {
      setCargandoDatos(false);
    }
  }

  async function importarClasificadosOficiales() {
    setImportandoGrupos(true);
    setMensajeImportacion(null);
    setErrorImportacion(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("No hay sesión activa. Vuelve a iniciar sesión.");
      }

      const res = await fetch("/api/admin/importar-resultados-grupos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        resumen?: {
          gruposProcesados?: number;
          resultados?: Array<{
            grupo: string;
            clasificado_1: string;
            clasificado_2: string;
          }>;
        };
      };

      if (!res.ok || !json.ok) {
        throw new Error(
          json.error ?? "No se pudieron importar los clasificados oficiales."
        );
      }

      setMensajeImportacion(
        `Clasificados oficiales importados correctamente: ${
          json.resumen?.gruposProcesados ?? 0
        } grupos guardados en resultados_grupos.`
      );
    } catch (err) {
      setErrorImportacion(
        err instanceof Error
          ? err.message
          : "Error desconocido importando clasificados oficiales."
      );
    } finally {
      setImportandoGrupos(false);
    }
  }

  async function recalcularClasificadosGrupos() {
    setRecalculandoGrupos(true);
    setMensajeImportacion(null);
    setErrorImportacion(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("No hay sesión activa. Vuelve a iniciar sesión.");
      }

      const res = await fetch("/api/admin/recalcular-clasificados-grupos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        resumen?: {
          resultadosGrupos?: number;
          pronosticosEncontrados?: number;
          actualizados?: number;
          ignorados?: number;
          puntosTotalesAsignados?: number;
        };
      };

      if (!res.ok || !json.ok) {
        throw new Error(
          json.error ?? "No se pudieron recalcular los clasificados de grupo."
        );
      }

      setMensajeImportacion(
        `Puntos de clasificados recalculados: ${
          json.resumen?.actualizados ?? 0
        } pronósticos actualizados de ${
          json.resumen?.pronosticosEncontrados ?? 0
        }. Puntos asignados: ${json.resumen?.puntosTotalesAsignados ?? 0}.`
      );
    } catch (err) {
      setErrorImportacion(
        err instanceof Error
          ? err.message
          : "Error desconocido recalculando clasificados de grupo."
      );
    } finally {
      setRecalculandoGrupos(false);
    }
  }

  async function actualizarCrucesEliminatorias() {
    setActualizandoCruces(true);
    setMensajeImportacion(null);
    setErrorImportacion(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("No hay sesión activa. Vuelve a iniciar sesión.");
      }

      const res = await fetch("/api/admin/actualizar-cruces-eliminatorias", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        resumen?: {
          partidosEliminatorias?: number;
          partidosDieciseisavos?: number;
          fixturesEliminatoriasConEquipos?: number;
          fixturesDieciseisavosConEquipos?: number;
          gruposCerrados?: number;
          actualizados?: number;
          ignorados?: number;
          cambiosPorFixtures?: number;
          cambiosPorStandings?: number;
          cambiosPorBracket?: number;
          horariosActualizados?: number;
          tercerosPendientes?: number;
          crucesFuturosPendientes?: number;
        };
      };

      if (!res.ok || !json.ok) {
        throw new Error(
          json.error ?? "No se pudieron actualizar los cruces de eliminatorias."
        );
      }

      setMensajeImportacion(
        `Cruces de eliminatorias actualizados: ${
          json.resumen?.actualizados ?? 0
        } partidos modificados de ${
          json.resumen?.partidosEliminatorias ?? json.resumen?.partidosDieciseisavos ?? 0
        }. Cambios por fixtures API: ${
          json.resumen?.cambiosPorFixtures ?? 0
        }. Cambios por grupos cerrados: ${
          json.resumen?.cambiosPorStandings ?? 0
        }. Cambios por bracket: ${
          json.resumen?.cambiosPorBracket ?? 0
        }. Horarios corregidos: ${
          json.resumen?.horariosActualizados ?? 0
        }. Terceros pendientes: ${
          json.resumen?.tercerosPendientes ?? 0
        }. Cruces futuros pendientes: ${json.resumen?.crucesFuturosPendientes ?? 0}.`
      );

      await cargarStandings();
    } catch (err) {
      setErrorImportacion(
        err instanceof Error
          ? err.message
          : "Error desconocido actualizando cruces de eliminatorias."
      );
    } finally {
      setActualizandoCruces(false);
    }
  }

  useEffect(() => {
    let activo = true;

    async function validarAdmin() {
      setCargandoPermisos(true);

      const admin = await comprobarAdminActual();

      if (!activo) return;

      if (!admin.isAdmin) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        router.replace("/");
        return;
      }

      setAutorizado(true);
      setCargandoPermisos(false);
      await cargarStandings();
    }

    validarAdmin();

    return () => {
      activo = false;
    };
  }, [router]);

  const grupos = useMemo(() => {
    if (!data) return [];

    return extraerStandings(data);
  }, [data]);

  const gruposPrincipales = grupos.filter((grupo) =>
    esGrupoPrincipal(grupo.nombreApi)
  );

  const mejoresTerceros = grupos.find(
    (grupo) => grupo.nombreApi === "Ranking of third-placed teams"
  );

  const totalEquiposGrupos = gruposPrincipales.reduce(
    (total, grupo) => total + grupo.equipos.length,
    0
  );

  if (cargandoPermisos) {
    return (
      <main className="page">
        <div className="loadingBox">
          <Loader2 className="spin" size={32} />
          <p>Comprobando permisos de administrador...</p>
        </div>
        <Styles />
      </main>
    );
  }

  if (!autorizado) {
    return null;
  }

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <div className="headerIcon">
            <Shield size={30} />
          </div>

          <div>
            <p className="kicker">Administración · API-FOOTBALL</p>
            <h1>Standings Mundial 2026</h1>
            <p className="subtitle">
              Vista de solo lectura para validar las clasificaciones oficiales
              de API-FOOTBALL antes de conectarlas a la web pública.
            </p>
          </div>
        </header>

        <section className="summaryGrid">
          <div className="summaryCard">
            <BarChart3 size={22} />
            <div>
              <span>Grupos detectados</span>
              <strong>{gruposPrincipales.length}</strong>
            </div>
          </div>

          <div className="summaryCard">
            <Trophy size={22} />
            <div>
              <span>Equipos en grupos</span>
              <strong>{totalEquiposGrupos}</strong>
            </div>
          </div>

          <div className="summaryCard">
            <CheckCircle2 size={22} />
            <div>
              <span>Mejores terceros</span>
              <strong>{mejoresTerceros?.equipos.length ?? 0}</strong>
            </div>
          </div>

          <div className="actionsBox">
            <button
              className="refreshButton"
              type="button"
              onClick={cargarStandings}
              disabled={cargandoDatos || importandoGrupos || recalculandoGrupos || actualizandoCruces}
            >
              {cargandoDatos ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <RefreshCw size={18} />
              )}
              Actualizar desde API
            </button>

            <button
              className="importButton"
              type="button"
              onClick={importarClasificadosOficiales}
              disabled={cargandoDatos || importandoGrupos || recalculandoGrupos || actualizandoCruces}
            >
              {importandoGrupos ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <UploadCloud size={18} />
              )}
              Importar clasificados oficiales
            </button>

            <button
              className="knockoutButton"
              type="button"
              onClick={actualizarCrucesEliminatorias}
              disabled={cargandoDatos || importandoGrupos || recalculandoGrupos || actualizandoCruces}
            >
              {actualizandoCruces ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <Trophy size={18} />
              )}
              Actualizar eliminatorias completas
            </button>

            <button
              className="recalculateButton"
              type="button"
              onClick={recalcularClasificadosGrupos}
              disabled={cargandoDatos || importandoGrupos || recalculandoGrupos || actualizandoCruces}
            >
              {recalculandoGrupos ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <Calculator size={18} />
              )}
              Recalcular puntos grupos
            </button>
          </div>
        </section>

        {error && (
          <div className="errorBox">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {errorImportacion && (
          <div className="errorBox">
            <AlertTriangle size={20} />
            <span>{errorImportacion}</span>
          </div>
        )}

        {mensajeImportacion && (
          <div className="successBox">
            <CheckCircle2 size={20} />
            <span>{mensajeImportacion}</span>
          </div>
        )}

        {!error && cargandoDatos && !data && (
          <div className="loadingBox inline">
            <Loader2 className="spin" size={26} />
            <p>Cargando standings desde API-FOOTBALL...</p>
          </div>
        )}

        {!error && data && (
          <div className="safeNote">
            <AlertTriangle size={18} />
            Esta pantalla muestra la respuesta de API-FOOTBALL para revisión del admin.
            Los botones de importación, recalculo y cruces sí actualizan datos controlados.
          </div>
        )}

        <section className="groupsGrid">
          {gruposPrincipales.map((grupo) => (
            <article key={grupo.nombreApi} className="groupCard">
              <div className="groupHeader">
                <h2>{grupo.nombre}</h2>
                <span>{grupo.nombreApi}</span>
              </div>

              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Selección</th>
                      <th>Pts</th>
                      <th>PJ</th>
                      <th>G</th>
                      <th>E</th>
                      <th>P</th>
                      <th>GF</th>
                      <th>GC</th>
                      <th>DG</th>
                    </tr>
                  </thead>

                  <tbody>
                    {grupo.equipos.map((equipo) => {
                      const descripcion = descripcionClasificacion(
                        equipo.description
                      );

                      return (
                        <tr key={`${grupo.nombreApi}-${equipo.team.id}`}>
                          <td>
                            <span
                              className={`rank rank-${Math.min(equipo.rank, 4)}`}
                            >
                              {equipo.rank}
                            </span>
                          </td>
                          <td>
                            <div className="teamCell">
                              {equipo.team.logo && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={equipo.team.logo}
                                  alt={equipo.team.name}
                                />
                              )}
                              <div>
                                <strong>{traducirEquipo(equipo.team.name)}</strong>
                                <small>
                                  {equipo.team.name} · ID {equipo.team.id}
                                </small>
                                {descripcion && <em>{descripcion}</em>}
                              </div>
                            </div>
                          </td>
                          <td className="bold">{equipo.points}</td>
                          <td>{equipo.all.played}</td>
                          <td>{equipo.all.win}</td>
                          <td>{equipo.all.draw}</td>
                          <td>{equipo.all.lose}</td>
                          <td>{equipo.all.goals.for}</td>
                          <td>{equipo.all.goals.against}</td>
                          <td>{equipo.goalsDiff}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="updated">
                Última actualización API:{" "}
                {formatearActualizacion(grupo.equipos[0]?.update)}
              </p>
            </article>
          ))}
        </section>

        {mejoresTerceros && (
          <section className="thirdsCard">
            <div className="groupHeader">
              <h2>{mejoresTerceros.nombre}</h2>
              <span>Los 8 mejores terceros también pasan</span>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Selección</th>
                    <th>Pts</th>
                    <th>PJ</th>
                    <th>G</th>
                    <th>E</th>
                    <th>P</th>
                    <th>GF</th>
                    <th>GC</th>
                    <th>DG</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {mejoresTerceros.equipos.map((equipo) => {
                    const descripcion = descripcionClasificacion(
                      equipo.description
                    );

                    return (
                      <tr key={`terceros-${equipo.team.id}`}>
                        <td>
                          <span
                            className={
                              equipo.rank <= 8 ? "rank rank-ok" : "rank"
                            }
                          >
                            {equipo.rank}
                          </span>
                        </td>
                        <td>
                          <div className="teamCell">
                            {equipo.team.logo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={equipo.team.logo} alt={equipo.team.name} />
                            )}
                            <div>
                              <strong>{traducirEquipo(equipo.team.name)}</strong>
                              <small>
                                {equipo.team.name} · ID {equipo.team.id}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="bold">{equipo.points}</td>
                        <td>{equipo.all.played}</td>
                        <td>{equipo.all.win}</td>
                        <td>{equipo.all.draw}</td>
                        <td>{equipo.all.lose}</td>
                        <td>{equipo.all.goals.for}</td>
                        <td>{equipo.all.goals.against}</td>
                        <td>{equipo.goalsDiff}</td>
                        <td>{descripcion || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <Styles />
    </main>
  );
}

function Styles() {
  return (
    <style>{`
      .page {
        min-height: 100vh;
        background:
          radial-gradient(circle at top, rgba(37, 99, 235, 0.20), transparent 34%),
          linear-gradient(180deg, #020617 0%, #111827 100%);
        color: white;
        padding: 36px 16px 120px;
      }

      .container {
        max-width: 1280px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .headerIcon {
        width: 64px;
        height: 64px;
        border-radius: 22px;
        background: #2563eb;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 18px 40px rgba(37, 99, 235, 0.28);
      }

      .kicker {
        margin: 0 0 6px;
        color: #bfdbfe;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-size: clamp(34px, 6vw, 54px);
        line-height: 0.95;
        font-weight: 950;
        letter-spacing: -0.06em;
      }

      .subtitle {
        margin: 12px 0 0;
        color: #cbd5e1;
        max-width: 800px;
        line-height: 1.6;
        font-weight: 650;
      }

      .summaryGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(280px, 1.15fr);
        gap: 14px;
        margin-bottom: 18px;
      }

      .summaryCard,
      .actionsBox {
        border-radius: 22px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(15, 23, 42, 0.78);
        padding: 16px;
        min-height: 76px;
      }

      .summaryCard {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .summaryCard svg {
        color: #93c5fd;
      }

      .summaryCard span {
        display: block;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .summaryCard strong {
        display: block;
        margin-top: 4px;
        font-size: 28px;
        font-weight: 950;
      }

      .actionsBox {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .refreshButton,
      .importButton,
      .knockoutButton,
      .recalculateButton {
        color: white;
        border: none;
        border-radius: 16px;
        padding: 13px 14px;
        min-height: 52px;
        font-weight: 950;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        cursor: pointer;
      }

      .refreshButton {
        background: #16a34a;
      }

      .importButton {
        background: #2563eb;
      }

      .knockoutButton {
        background: #0891b2;
      }

      .recalculateButton {
        background: #7c3aed;
      }

      .refreshButton:disabled,
      .importButton:disabled,
      .knockoutButton:disabled,
      .recalculateButton:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .safeNote,
      .errorBox,
      .successBox,
      .loadingBox {
        border-radius: 20px;
        padding: 16px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-weight: 850;
        line-height: 1.5;
        margin-bottom: 18px;
      }

      .safeNote {
        background: rgba(245, 158, 11, 0.10);
        border: 1px solid rgba(245, 158, 11, 0.24);
        color: #fde68a;
      }

      .errorBox {
        background: rgba(239, 68, 68, 0.14);
        border: 1px solid rgba(239, 68, 68, 0.30);
        color: #fecaca;
      }

      .successBox {
        background: rgba(22, 163, 74, 0.14);
        border: 1px solid rgba(22, 163, 74, 0.30);
        color: #bbf7d0;
      }

      .loadingBox {
        background: rgba(15, 23, 42, 0.78);
        border: 1px solid rgba(148, 163, 184, 0.22);
        color: #cbd5e1;
        align-items: center;
        justify-content: center;
        min-height: 220px;
      }

      .loadingBox.inline {
        min-height: auto;
      }

      .groupsGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      .groupCard,
      .thirdsCard {
        border-radius: 28px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(15, 23, 42, 0.84);
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
        overflow: hidden;
      }

      .thirdsCard {
        margin-top: 22px;
      }

      .groupHeader {
        padding: 18px 18px 12px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.16);
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
      }

      .groupHeader h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 950;
        letter-spacing: -0.04em;
      }

      .groupHeader span {
        color: #93c5fd;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        text-align: right;
      }

      .tableWrap {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      th {
        color: #94a3b8;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.06em;
        text-align: left;
        padding: 12px 10px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.16);
        white-space: nowrap;
      }

      td {
        padding: 12px 10px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.10);
        color: #e5e7eb;
        white-space: nowrap;
      }

      .bold {
        font-weight: 950;
        color: white;
      }

      .rank {
        width: 28px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.16);
        color: #cbd5e1;
        font-weight: 950;
      }

      .rank-1,
      .rank-2,
      .rank-ok {
        background: rgba(22, 163, 74, 0.22);
        color: #86efac;
      }

      .rank-3 {
        background: rgba(245, 158, 11, 0.20);
        color: #fde68a;
      }

      .rank-4 {
        background: rgba(148, 163, 184, 0.18);
        color: #cbd5e1;
      }

      .teamCell {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 210px;
      }

      .teamCell img {
        width: 28px;
        height: 28px;
        object-fit: contain;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
      }

      .teamCell strong {
        display: block;
        color: white;
        font-size: 14px;
      }

      .teamCell small {
        display: block;
        color: #94a3b8;
        margin-top: 2px;
        font-weight: 700;
      }

      .teamCell em {
        display: inline-flex;
        margin-top: 5px;
        color: #86efac;
        font-size: 11px;
        font-style: normal;
        font-weight: 900;
      }

      .updated {
        margin: 0;
        padding: 12px 18px 16px;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 750;
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @media (max-width: 1050px) {
        .groupsGrid {
          grid-template-columns: 1fr;
        }

        .summaryGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 620px) {
        .page {
          padding: 84px 12px 110px;
        }

        .header {
          align-items: flex-start;
        }

        .headerIcon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
        }

        .summaryGrid {
          grid-template-columns: 1fr;
        }

        .groupHeader {
          align-items: flex-start;
          flex-direction: column;
        }

        .groupHeader span {
          text-align: left;
        }
      }
    `}</style>
  );
}
