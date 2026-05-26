"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";

import PhaseBadge from "@/components/PhaseBadge";
import TeamFlag from "@/components/TeamFlag";
import { supabase } from "@/lib/supabase";

type Partido = {
  id: number;
  local: string;
  visitante: string;
  local_code: string | null;
  visitante_code: string | null;
  fecha_inicio: string | null;
  estadio: string | null;
  ciudad: string | null;
  grupo: string | null;
  fase: string | null;
  resultado_local: number | null;
  resultado_visitante: number | null;
};

type Filtro =
  | "Todos"
  | "Fase de grupos"
  | "Eliminatorias"
  | "Finalizados"
  | "Pendientes";

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

const filtros: Filtro[] = [
  "Todos",
  "Fase de grupos",
  "Eliminatorias",
  "Finalizados",
  "Pendientes",
];

function queryTimeout<T>(ms = 12000): Promise<QueryResult<T>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: null,
        error: {
          message:
            "La carga está tardando demasiado. Revisa tu conexión y vuelve a intentarlo.",
        },
      });
    }, ms);
  });
}

export default function PartidosPage() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [filtroActivo, setFiltroActivo] = useState<Filtro>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    cargarPartidos();
  }, []);

  async function cargarPartidos() {
    setCargando(true);
    setErrorCarga(null);

    try {
      const response = (await Promise.race([
        supabase
          .from("partidos")
          .select(
            "id, local, visitante, local_code, visitante_code, fecha_inicio, estadio, ciudad, grupo, fase, resultado_local, resultado_visitante"
          )
          .order("fecha_inicio", { ascending: true, nullsFirst: false }),
        queryTimeout<Partido[]>(),
      ])) as QueryResult<Partido[]>;

      if (response.error) {
        console.error("Error cargando partidos:", response.error.message);
        setErrorCarga(response.error.message);
        setPartidos([]);
        return;
      }

      setPartidos(response.data ?? []);
    } catch (error) {
      console.error("Error inesperado cargando partidos:", error);
      setErrorCarga("No se pudieron cargar los partidos. Inténtalo de nuevo.");
      setPartidos([]);
    } finally {
      setCargando(false);
    }
  }

  function fechaValida(fechaInicio: string | null) {
    if (!fechaInicio) return null;

    const fecha = new Date(fechaInicio);

    if (Number.isNaN(fecha.getTime())) return null;

    return fecha;
  }

  function formatearFecha(fechaInicio: string | null) {
    const fecha = fechaValida(fechaInicio);

    if (!fecha) return "Fecha pendiente";

    return fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Madrid",
    });
  }

  function formatearHora(fechaInicio: string | null) {
    const fecha = fechaValida(fechaInicio);

    if (!fecha) return "--:--";

    return fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Madrid",
    });
  }

  function fechaCorta(fechaInicio: string | null) {
    const fecha = fechaValida(fechaInicio);

    if (!fecha) return "Pend.";

    return fecha
      .toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        timeZone: "Europe/Madrid",
      })
      .replace(".", "")
      .toUpperCase();
  }

  function normalizarTexto(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function scrollToFecha(fecha: string) {
    const element = document.getElementById(`fecha-${fecha}`);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  function obtenerClaseFase(fase: string | null) {
    switch (fase) {
      case "Final":
        return "faseFinal";

      case "Tercer puesto":
        return "faseTercerPuesto";

      case "Semifinales":
        return "faseSemi";

      case "Cuartos":
        return "faseCuartos";

      case "Octavos":
        return "faseOctavos";

      case "Dieciseisavos":
        return "faseDieciseisavos";

      default:
        return "faseGrupos";
    }
  }

  const partidosFiltrados = useMemo(() => {
    const textoBusqueda = normalizarTexto(busqueda.trim());

    return partidos.filter((partido) => {
      const finalizado =
        partido.resultado_local !== null &&
        partido.resultado_visitante !== null;

      const coincideBusqueda =
        textoBusqueda === "" ||
        normalizarTexto(partido.local).includes(textoBusqueda) ||
        normalizarTexto(partido.visitante).includes(textoBusqueda) ||
        normalizarTexto(partido.estadio ?? "").includes(textoBusqueda) ||
        normalizarTexto(partido.ciudad ?? "").includes(textoBusqueda) ||
        normalizarTexto(partido.fase ?? "").includes(textoBusqueda) ||
        normalizarTexto(partido.grupo ?? "").includes(textoBusqueda);

      if (!coincideBusqueda) return false;

      if (filtroActivo === "Todos") return true;

      if (filtroActivo === "Fase de grupos") {
        return partido.fase === "Fase de grupos";
      }

      if (filtroActivo === "Eliminatorias") {
        return partido.fase !== "Fase de grupos";
      }

      if (filtroActivo === "Finalizados") return finalizado;
      if (filtroActivo === "Pendientes") return !finalizado;

      return true;
    });
  }, [partidos, busqueda, filtroActivo]);

  const partidosPorFecha = useMemo(() => {
    return partidosFiltrados.reduce<Record<string, Partido[]>>((acc, partido) => {
      const fecha = formatearFecha(partido.fecha_inicio);

      if (!acc[fecha]) {
        acc[fecha] = [];
      }

      acc[fecha].push(partido);

      return acc;
    }, {});
  }, [partidosFiltrados]);

  const fechas = Object.entries(partidosPorFecha);

  return (
    <main className="partidosPage">
      <div className="container">
        <div className="header">
          <div className="headerIcon">
            <CalendarDays size={28} />
          </div>

          <div>
            <h1>Partidos</h1>
            <p>Calendario completo del Mundial 2026</p>
          </div>
        </div>

        <div className="filtersWrapper">
          <div className="searchBox">
            <Search size={18} />

            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar selección, fase, estadio o ciudad..."
            />
          </div>

          <div className="filterButtons">
            {filtros.map((filtro) => (
              <button
                key={filtro}
                type="button"
                className={filtroActivo === filtro ? "filterActive" : ""}
                onClick={() => setFiltroActivo(filtro)}
              >
                <Filter size={15} />
                {filtro}
              </button>
            ))}
          </div>
        </div>

        {errorCarga && (
          <div className="errorBox">
            <div>
              <AlertTriangle size={20} />
            </div>

            <div>
              <strong>No se han podido cargar los partidos</strong>
              <p>{errorCarga}</p>
            </div>

            <button type="button" onClick={cargarPartidos}>
              <RefreshCw size={17} />
              Reintentar
            </button>
          </div>
        )}

        {cargando ? (
          <div className="loadingBox">
            <Loader2 size={26} className="spin" />
            Cargando partidos...
          </div>
        ) : (
          <>
            {!errorCarga && partidos.length > 0 && (
              <>
                <div className="dateNav">
                  {fechas.map(([fecha, partidosFecha]) => (
                    <button
                      key={fecha}
                      type="button"
                      onClick={() => scrollToFecha(fecha)}
                    >
                      <CalendarDays size={15} />
                      <span>{fechaCorta(partidosFecha[0]?.fecha_inicio)}</span>
                    </button>
                  ))}
                </div>

                <div className="resultsInfo">
                  Mostrando {partidosFiltrados.length} de {partidos.length} partidos
                </div>
              </>
            )}

            {!errorCarga && fechas.length === 0 && (
              <div className="emptyBox">
                No hay partidos que coincidan con tu búsqueda o filtros.
              </div>
            )}

            <div className="datesList">
              {fechas.map(([fecha, partidosFecha]) => (
                <section key={fecha} id={`fecha-${fecha}`} className="dateSection">
                  <h2>{fecha}</h2>

                  <div className="cards">
                    {partidosFecha.map((partido) => {
                      const finalizado =
                        partido.resultado_local !== null &&
                        partido.resultado_visitante !== null;

                      return (
                        <article
                          key={partido.id}
                          className={`card ${obtenerClaseFase(partido.fase)}`}
                        >
                          <div className="topRow">
                            <div className="topLeft">
                              <PhaseBadge fase={partido.fase} />

                              {partido.grupo && (
                                <div className="grupoBadge">{partido.grupo}</div>
                              )}
                            </div>

                            {finalizado ? (
                              <div className="status finished">
                                <CheckCircle2 size={15} />
                                Finalizado
                              </div>
                            ) : (
                              <div className="status pending">
                                <Clock size={15} />
                                Pendiente
                              </div>
                            )}
                          </div>

                          <div className="timeRow">
                            <Clock size={16} />
                            {formatearHora(partido.fecha_inicio)}
                          </div>

                          <div className="matchRow">
                            <Team code={partido.local_code} name={partido.local} />

                            <div className="centerScore">
                              {finalizado ? (
                                <strong>
                                  {partido.resultado_local} -{" "}
                                  {partido.resultado_visitante}
                                </strong>
                              ) : (
                                <span>VS</span>
                              )}
                            </div>

                            <Team
                              code={partido.visitante_code}
                              name={partido.visitante}
                              alignRight
                            />
                          </div>

                          <div className="metaRow">
                            <span>
                              <MapPin size={14} />
                              {partido.estadio ?? "Estadio pendiente"}
                              {partido.ciudad ? ` · ${partido.ciudad}` : ""}
                            </span>
                          </div>

                          <div className="bottomRow">
                            <Link href={`/partidos/${partido.id}`} className="detailButton">
                              Ver detalle
                              <ArrowRight size={17} />
                            </Link>

                            <Link href="/mis-pronosticos" className="pronosticoButton">
                              <Target size={17} />
                              Pronosticar
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        .partidosPage {
          min-height: 100vh;
          padding: 28px 16px 120px;
          color: white;
        }

        .container {
          max-width: 1120px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
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
        }

        .header h1 {
          font-size: 40px;
          font-weight: 950;
          margin: 0;
        }

        .header p {
          color: #94a3b8;
          margin-top: 6px;
          font-weight: 700;
        }

        .filtersWrapper {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        .searchBox {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 18px;
          padding: 0 14px;
          color: #94a3b8;
        }

        .searchBox input {
          width: 100%;
          height: 48px;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-weight: 800;
        }

        .filterButtons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .filterButtons button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(15,23,42,0.72);
          color: #cbd5e1;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }

        .filterButtons button:hover,
        .filterButtons .filterActive {
          background: rgba(37,99,235,0.22);
          border-color: rgba(37,99,235,0.45);
          color: #bfdbfe;
        }

        .errorBox {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 14px;
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.28);
          color: #fecaca;
          border-radius: 20px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .errorBox strong {
          display: block;
          margin-bottom: 4px;
        }

        .errorBox p {
          margin: 0;
          color: #fecaca;
          font-size: 14px;
        }

        .errorBox button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 14px;
          padding: 11px 14px;
          background: #dc2626;
          color: white;
          font-weight: 900;
          cursor: pointer;
        }

        .loadingBox,
        .emptyBox {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          color: #94a3b8;
          font-weight: 900;
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dateNav {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 8px;
          scrollbar-width: none;
        }

        .dateNav::-webkit-scrollbar {
          display: none;
        }

        .dateNav button {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(15,23,42,0.72);
          color: #cbd5e1;
          border-radius: 999px;
          padding: 10px 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .resultsInfo {
          color: #94a3b8;
          font-size: 13px;
          font-weight: 800;
          margin: 0 0 16px;
        }

        .datesList {
          display: grid;
          gap: 28px;
        }

        .dateSection {
          scroll-margin-top: 90px;
        }

        .dateSection h2 {
          font-size: 28px;
          font-weight: 950;
          margin: 0 0 14px;
          text-transform: capitalize;
        }

        .cards {
          display: grid;
          gap: 14px;
        }

        .card {
          background: linear-gradient(
            145deg,
            rgba(15,23,42,0.98),
            rgba(15,23,42,0.65)
          );
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 26px;
          padding: 20px;
        }

        .faseFinal {
          border-color: rgba(250,204,21,0.42);
          box-shadow: 0 0 28px rgba(250,204,21,0.12);
        }

        .faseTercerPuesto {
          border-color: rgba(251,146,60,0.34);
        }

        .faseSemi {
          border-color: rgba(217,70,239,0.34);
        }

        .faseCuartos {
          border-color: rgba(139,92,246,0.30);
        }

        .faseOctavos {
          border-color: rgba(59,130,246,0.30);
        }

        .faseDieciseisavos {
          border-color: rgba(6,182,212,0.30);
        }

        .topRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .topLeft {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .grupoBadge,
        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 8px 12px;
          font-weight: 900;
          font-size: 13px;
        }

        .grupoBadge {
          background: rgba(255,255,255,0.08);
          color: #cbd5e1;
        }

        .status.pending {
          background: rgba(37,99,235,0.18);
          color: #93c5fd;
        }

        .status.finished {
          background: rgba(22,163,74,0.16);
          color: #86efac;
        }

        .timeRow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #cbd5e1;
          background: rgba(255,255,255,0.07);
          border-radius: 999px;
          padding: 8px 12px;
          font-weight: 900;
          margin-bottom: 18px;
        }

        .matchRow {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 18px;
        }

        .team {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .teamRight {
          justify-content: flex-end;
          text-align: right;
        }

        .team span {
          font-size: 20px;
          font-weight: 950;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .centerScore {
          min-width: 80px;
          text-align: center;
        }

        .centerScore span,
        .centerScore strong {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 66px;
          border-radius: 999px;
          background: rgba(37,99,235,0.14);
          border: 1px solid rgba(37,99,235,0.25);
          color: #93c5fd;
          padding: 8px 14px;
          font-weight: 950;
        }

        .centerScore strong {
          color: white;
          font-size: 22px;
        }

        .metaRow {
          margin-top: 16px;
          color: #94a3b8;
          font-size: 14px;
        }

        .metaRow span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .bottomRow {
          margin-top: 16px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .detailButton,
        .pronosticoButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          border-radius: 15px;
          padding: 12px 14px;
          font-weight: 950;
        }

        .detailButton {
          color: #bfdbfe;
          background: rgba(37,99,235,0.16);
          border: 1px solid rgba(96,165,250,0.26);
        }

        .pronosticoButton {
          color: white;
          background: #2563eb;
        }

        @media (max-width: 760px) {
          .partidosPage {
            padding: 22px 12px 120px;
          }

          .header h1 {
            font-size: 34px;
          }

          .filtersWrapper {
            gap: 8px;
          }

          .searchBox input {
            height: 42px;
            font-size: 14px;
          }

          .filterButtons {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 4px;
            scrollbar-width: none;
          }

          .filterButtons::-webkit-scrollbar {
            display: none;
          }

          .filterButtons button {
            flex: 0 0 auto;
            padding: 9px 12px;
            font-size: 13px;
          }

          .errorBox {
            grid-template-columns: 1fr;
          }

          .errorBox button {
            justify-content: center;
          }

          .dateSection h2 {
            font-size: 24px;
          }

          .matchRow {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .team,
          .teamRight {
            justify-content: center;
            text-align: center;
          }

          .bottomRow {
            flex-direction: column;
          }

          .detailButton,
          .pronosticoButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

function Team({
  code,
  name,
  alignRight = false,
}: {
  code: string | null;
  name: string;
  alignRight?: boolean;
}) {
  return (
    <div className={`team ${alignRight ? "teamRight" : ""}`}>
      <TeamFlag code={code} name={name} size="md" />
      <span>{name}</span>
    </div>
  );
}