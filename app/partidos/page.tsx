"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Target,
  MapPin,
  Filter,
  ArrowRight,
  Search,
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

const filtros: Filtro[] = [
  "Todos",
  "Fase de grupos",
  "Eliminatorias",
  "Finalizados",
  "Pendientes",
];

export default function PartidosPage() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [filtroActivo, setFiltroActivo] = useState<Filtro>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPartidos();
  }, []);

  async function cargarPartidos() {
    setCargando(true);

    try {
      const { data, error } = await supabase
        .from("partidos")
        .select("*")
        .order("fecha_inicio", { ascending: true, nullsFirst: false });

      if (error) {
        console.error(error);
        setPartidos([]);
        return;
      }

      setPartidos(data ?? []);
    } catch (error) {
      console.error(error);
      setPartidos([]);
    } finally {
      setCargando(false);
    }
  }

  function formatearFecha(fechaInicio: string | null) {
    if (!fechaInicio) return "Fecha pendiente";

    return new Date(fechaInicio).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  function formatearHora(fechaInicio: string | null) {
    if (!fechaInicio) return "--:--";

    return new Date(fechaInicio).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function fechaCorta(fechaInicio: string | null) {
    if (!fechaInicio) return "Pend.";

    return new Date(fechaInicio)
      .toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      })
      .replace(".", "")
      .toUpperCase();
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

  const partidosFiltrados = partidos.filter((partido) => {
    const finalizado =
      partido.resultado_local !== null &&
      partido.resultado_visitante !== null;

    const textoBusqueda = busqueda.trim().toLowerCase();

    const coincideBusqueda =
      textoBusqueda === "" ||
      partido.local.toLowerCase().includes(textoBusqueda) ||
      partido.visitante.toLowerCase().includes(textoBusqueda) ||
      (partido.estadio ?? "").toLowerCase().includes(textoBusqueda) ||
      (partido.ciudad ?? "").toLowerCase().includes(textoBusqueda) ||
      (partido.fase ?? "").toLowerCase().includes(textoBusqueda);

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

  const partidosPorFecha = useMemo(() => {
    return partidosFiltrados.reduce<Record<string, Partido[]>>(
      (acc, partido) => {
        const fecha = formatearFecha(partido.fecha_inicio);

        if (!acc[fecha]) {
          acc[fecha] = [];
        }

        acc[fecha].push(partido);

        return acc;
      },
      {}
    );
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
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar selección, fase, estadio o ciudad..."
            />
          </div>

          <div className="filtersRow">
            {filtros.map((filtro) => (
              <button
                key={filtro}
                onClick={() => setFiltroActivo(filtro)}
                className={`filterButton ${
                  filtroActivo === filtro ? "activeFilter" : ""
                }`}
              >
                <Filter size={14} />
                {filtro}
              </button>
            ))}
          </div>

          <div className="datesNav">
            {fechas.map(([fecha, partidosFecha]) => (
              <button
                key={fecha}
                className="dateNavButton"
                onClick={() => scrollToFecha(fecha)}
              >
                {fechaCorta(partidosFecha[0]?.fecha_inicio ?? null)}
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="emptyState">Cargando partidos...</div>
        ) : (
          <div className="daysWrapper">
            {Object.entries(partidosPorFecha).map(([fecha, partidosFecha]) => (
              <section
                key={fecha}
                id={`fecha-${fecha}`}
                className="daySection"
              >
                <div className="dayHeader">
                  <CalendarDays size={18} />
                  <h2>{fecha}</h2>
                </div>

                <div className="cards">
                  {partidosFecha.map((partido) => {
                    const finalizado =
                      partido.resultado_local !== null &&
                      partido.resultado_visitante !== null;

                    const claseFase = obtenerClaseFase(partido.fase);

                    return (
                      <article
                        key={partido.id}
                        className={`card ${claseFase}`}
                      >
                        <div className="cardTop">
                          <div className="leftTop">
                            <div className="timeRow">
                              <Clock size={14} />
                              {formatearHora(partido.fecha_inicio)}
                            </div>

                            <PhaseBadge fase={partido.fase} />
                          </div>

                          <div
                            className={`statusBadge ${
                              finalizado ? "finished" : "pending"
                            }`}
                          >
                            {finalizado ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <Clock size={14} />
                            )}

                            {finalizado ? "Finalizado" : "Pendiente"}
                          </div>
                        </div>

                        <div className="matchCompact">
                          <Team
                            code={partido.local_code}
                            name={partido.local}
                          />

                          <div className="scoreCompact">
                            {finalizado
                              ? `${partido.resultado_local} - ${partido.resultado_visitante}`
                              : "VS"}
                          </div>

                          <Team
                            code={partido.visitante_code}
                            name={partido.visitante}
                            right
                          />
                        </div>

                        <div className="bottomCompact">
                          <div className="stadiumCompact">
                            <MapPin size={14} />
                            {partido.estadio ?? "Estadio pendiente"}
                            {partido.ciudad ? ` · ${partido.ciudad}` : ""}
                          </div>

                          <div className="buttonsCompact">
                            <Link
                              href={`/partidos/${partido.id}`}
                              className="detailsButton"
                            >
                              Detalle
                              <ArrowRight size={15} />
                            </Link>

                            <Link
                              href="/mis-pronosticos"
                              className="predictButton"
                            >
                              <Target size={15} />
                              Pronosticar
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .partidosPage {
          min-height: 100vh;
          background: linear-gradient(180deg, #020617 0%, #111827 100%);
          color: white;
          padding: 28px 16px 120px;
        }

        .container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
        }

        .headerIcon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 32px rgba(37,99,235,0.42);
        }

        .header h1 {
          font-size: 42px;
          margin: 0;
          font-weight: 900;
        }

        .header p {
          margin: 4px 0 0;
          color: #94a3b8;
        }

        .filtersWrapper {
          position: sticky;
          top: 74px;
          z-index: 30;
          background: rgba(15,23,42,0.86);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          padding: 16px;
          margin-bottom: 26px;
        }

        .searchBox {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(2,6,23,0.72);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          padding: 12px 14px;
          margin-bottom: 14px;
        }

        .searchBox input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 15px;
          font-weight: 700;
        }

        .searchBox input::placeholder {
          color: #94a3b8;
        }

        .filtersRow {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }

        .filterButton {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          cursor: pointer;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 800;
          background: rgba(255,255,255,0.06);
          color: #cbd5e1;
          font-family: inherit;
        }

        .activeFilter {
          background: #2563eb;
          color: white;
          box-shadow: 0 0 22px rgba(37,99,235,0.38);
        }

        .datesNav {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .datesNav::-webkit-scrollbar {
          display: none;
        }

        .dateNavButton {
          flex-shrink: 0;
          border: none;
          cursor: pointer;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 900;
          background: rgba(37,99,235,0.18);
          color: #bfdbfe;
          font-family: inherit;
        }

        .daysWrapper {
          display: grid;
          gap: 30px;
        }

        .daySection {
          scroll-margin-top: 180px;
        }

        .dayHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .dayHeader h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
          text-transform: capitalize;
        }

        .cards {
          display: grid;
          gap: 12px;
        }

        .card {
          background: linear-gradient(
            145deg,
            rgba(15,23,42,0.96),
            rgba(15,23,42,0.74)
          );
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 22px;
          padding: 16px;
          transition: 0.2s ease;
        }

        .card:hover {
          transform: translateY(-1px);
          border-color: rgba(255,255,255,0.18);
        }

        .card.faseFinal {
          border-color: rgba(250,204,21,0.58);
          box-shadow: 0 0 36px rgba(250,204,21,0.16);
          background: linear-gradient(
            145deg,
            rgba(120,53,15,0.36),
            rgba(15,23,42,0.92)
          );
        }

        .card.faseTercerPuesto {
          border-color: rgba(251,146,60,0.38);
          background: linear-gradient(
            145deg,
            rgba(124,45,18,0.28),
            rgba(15,23,42,0.92)
          );
        }

        .card.faseSemi {
          border-color: rgba(248,113,113,0.34);
          background: linear-gradient(
            145deg,
            rgba(127,29,29,0.24),
            rgba(15,23,42,0.92)
          );
        }

        .card.faseCuartos {
          border-color: rgba(251,146,60,0.30);
        }

        .card.faseOctavos {
          border-color: rgba(250,204,21,0.26);
        }

        .card.faseDieciseisavos {
          border-color: rgba(168,85,247,0.28);
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .leftTop {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .timeRow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #cbd5e1;
          font-size: 14px;
          font-weight: 800;
        }

        .statusBadge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }

        .statusBadge.pending {
          background: rgba(37,99,235,0.18);
          color: #93c5fd;
        }

        .statusBadge.finished {
          background: rgba(22,163,74,0.18);
          color: #86efac;
        }

        .matchCompact {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
        }

        .team {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .team.right {
          justify-content: flex-end;
        }

        .teamName {
          font-size: 18px;
          font-weight: 900;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .scoreCompact {
          min-width: 84px;
          text-align: center;
          font-size: 26px;
          font-weight: 900;
        }

        .bottomCompact {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .stadiumCompact {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 14px;
        }

        .buttonsCompact {
          display: flex;
          gap: 10px;
        }

        .detailsButton,
        .predictButton {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 14px;
          padding: 10px 14px;
          text-decoration: none;
          font-weight: 900;
          font-size: 14px;
        }

        .detailsButton {
          background: rgba(255,255,255,0.08);
          color: white;
        }

        .predictButton {
          background: rgba(37,99,235,0.20);
          color: #bfdbfe;
        }

        .emptyState {
          padding: 30px;
          text-align: center;
          border-radius: 20px;
          background: rgba(255,255,255,0.05);
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .matchCompact {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .team,
          .team.right {
            justify-content: center;
          }

          .bottomCompact {
            flex-direction: column;
            align-items: stretch;
          }

          .buttonsCompact {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .detailsButton,
          .predictButton {
            justify-content: center;
          }

          .teamName {
            white-space: normal;
          }

          .cardTop {
            align-items: flex-start;
          }
        }

        @media (max-width: 640px) {
          .header h1 {
            font-size: 34px;
          }

          .filtersWrapper {
            top: 10px;
          }

          .buttonsCompact {
            grid-template-columns: 1fr;
          }

          .statusBadge {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}

function Team({
  code,
  name,
  right = false,
}: {
  code: string | null;
  name: string;
  right?: boolean;
}) {
  return (
    <div className={`team ${right ? "right" : ""}`}>
      <TeamFlag code={code} name={name} size="lg" />
      <span className="teamName">{name}</span>
    </div>
  );
}