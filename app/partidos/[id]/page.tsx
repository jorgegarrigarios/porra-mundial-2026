"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Target,
  Trophy,
  Users,
  BarChart3,
  Lock,
  Eye,
  Clock,
  CheckCircle2,
} from "lucide-react";

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
  pais: string | null;
  grupo: string | null;
  fase: string | null;
  resultado_local: number | null;
  resultado_visitante: number | null;
  estado: string | null;
  tv: string | null;
};

type Pronostico = {
  id: number;
  goles_local: number | null;
  goles_visitante: number | null;
  puntos: number | null;
  participantes:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
};

export default function PartidoDetallePage() {
  const params = useParams();
  const id = Number(params.id);

  const [partido, setPartido] = useState<Partido | null>(null);
  const [pronosticos, setPronosticos] = useState<Pronostico[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDetalle();
  }, []);

  async function cargarDetalle() {
    setCargando(true);

    const { data: partidoData, error: partidoError } = await supabase
      .from("partidos")
      .select("*")
      .eq("id", id)
      .single();

    if (partidoError) {
      console.error("Error cargando partido:", partidoError.message);
      setPartido(null);
      setCargando(false);
      return;
    }

    setPartido(partidoData);

    const partidoFinalizado =
      partidoData.resultado_local !== null &&
      partidoData.resultado_visitante !== null;

    const partidoEmpezado = partidoData.fecha_inicio
      ? new Date(partidoData.fecha_inicio) <= new Date()
      : false;

    if (partidoFinalizado || partidoEmpezado) {
      const { data: pronosticosData, error: pronosticosError } =
        await supabase
          .from("pronosticos")
          .select(
            `
            id,
            goles_local,
            goles_visitante,
            puntos,
            participantes (
              nombre
            )
          `
          )
          .eq("partido_id", id);

      if (pronosticosError) {
        console.error(
          "Error cargando pronósticos:",
          pronosticosError.message
        );
        setPronosticos([]);
      } else {
        setPronosticos((pronosticosData ?? []) as Pronostico[]);
      }
    } else {
      setPronosticos([]);
    }

    setCargando(false);
  }

  function formatearFecha(fechaInicio: string | null) {
    if (!fechaInicio) return "Fecha pendiente";

    return new Date(fechaInicio).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatearHora(fechaInicio: string | null) {
    if (!fechaInicio) return "Hora pendiente";

    return new Date(fechaInicio).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getNombreParticipante(pronostico: Pronostico) {
    if (!pronostico.participantes) return "Participante";

    if (Array.isArray(pronostico.participantes)) {
      return pronostico.participantes[0]?.nombre ?? "Participante";
    }

    return pronostico.participantes.nombre;
  }

  function calcularTendencia() {
    let local = 0;
    let empate = 0;
    let visitante = 0;

    pronosticos.forEach((p) => {
      if (p.goles_local === null || p.goles_visitante === null) return;

      if (p.goles_local > p.goles_visitante) local++;
      else if (p.goles_local < p.goles_visitante) visitante++;
      else empate++;
    });

    const total = local + empate + visitante;

    if (total === 0) {
      return {
        local: 0,
        empate: 0,
        visitante: 0,
      };
    }

    return {
      local: Math.round((local / total) * 100),
      empate: Math.round((empate / total) * 100),
      visitante: Math.round((visitante / total) * 100),
    };
  }

  if (cargando) {
    return (
      <main className="page">
        <div className="container">
          <div className="emptyBox">Cargando detalle del partido...</div>
        </div>
        <Styles />
      </main>
    );
  }

  if (!partido) {
    return (
      <main className="page">
        <div className="container">
          <h1 className="title">Partido no encontrado</h1>

          <a href="/partidos" className="backButton">
            <ArrowLeft size={18} />
            Volver a partidos
          </a>
        </div>
        <Styles />
      </main>
    );
  }

  const finalizado =
    partido.resultado_local !== null && partido.resultado_visitante !== null;

  const partidoEmpezado = partido.fecha_inicio
    ? new Date(partido.fecha_inicio) <= new Date()
    : false;

  const puedeVerPronosticos = finalizado || partidoEmpezado;
  const tendencia = calcularTendencia();

  return (
    <main className="page">
      <div className="container">
        <a href="/partidos" className="backButton">
          <ArrowLeft size={18} />
          Volver a partidos
        </a>

        <section className="heroCard">
          <div className="topInfo">
            <div className="badge">
              <Trophy size={16} />
              {partido.fase ?? "Fase pendiente"}
              {partido.grupo ? ` · Grupo ${partido.grupo}` : ""}
            </div>

            <div className="badge">
              <CalendarDays size={16} />
              {formatearFecha(partido.fecha_inicio)}
            </div>

            <div className="badge">
              <Clock size={16} />
              {formatearHora(partido.fecha_inicio)}
            </div>

            <div className={`statusBadge ${finalizado ? "finished" : "pending"}`}>
              {finalizado ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              {finalizado ? "Finalizado" : "Pendiente"}
            </div>
          </div>

          <div className="matchMain">
            <Team code={partido.local_code} name={partido.local} />

            <div className="scoreBox">
              <p className="scoreLabel">
                {finalizado ? "Resultado final" : "Próximo partido"}
              </p>

              <p className="score">
                {finalizado
                  ? `${partido.resultado_local} - ${partido.resultado_visitante}`
                  : "VS"}
              </p>

              <p className="status">
                {finalizado ? "Partido finalizado" : "Pronósticos abiertos"}
              </p>
            </div>

            <Team code={partido.visitante_code} name={partido.visitante} />
          </div>

          <div className="stadium">
            <MapPin size={18} />
            {partido.estadio ?? "Estadio pendiente"}
            {partido.ciudad ? ` · ${partido.ciudad}` : ""}
            {partido.pais ? ` · ${partido.pais}` : ""}
          </div>

          {!partidoEmpezado && (
            <a href="/mis-pronosticos" className="primaryButton">
              <Target size={20} />
              Hacer pronóstico
            </a>
          )}
        </section>

        <div className="grid">
          <section className="panel">
            <h2 className="panelTitle">
              <BarChart3 size={24} color="#60a5fa" />
              Tendencia de pronósticos
            </h2>

            {puedeVerPronosticos ? (
              <>
                <PredictionBar
                  label={`Gana ${partido.local}`}
                  value={tendencia.local}
                />
                <PredictionBar label="Empate" value={tendencia.empate} />
                <PredictionBar
                  label={`Gana ${partido.visitante}`}
                  value={tendencia.visitante}
                />
              </>
            ) : (
              <div className="lockedMiniBox">
                <Lock size={26} />
                <p>La tendencia se mostrará cuando empiece el partido.</p>
              </div>
            )}
          </section>

          <section className="panel">
            <h2 className="panelTitle">
              <Users size={24} color="#22c55e" />
              Datos del partido
            </h2>

            <InfoRow label="Fase" value={partido.fase ?? "Pendiente"} />
            <InfoRow label="Grupo" value={partido.grupo ?? "Pendiente"} />
            <InfoRow
              label="Estado"
              value={finalizado ? "Finalizado" : "Pendiente"}
            />
            <InfoRow label="Estadio" value={partido.estadio ?? "Pendiente"} />
            <InfoRow label="Ciudad" value={partido.ciudad ?? "Pendiente"} />
            <InfoRow label="TV" value={partido.tv ?? "Pendiente"} />
          </section>
        </div>

        <section className="panel predictionsPanel">
          <h2 className="panelTitle">
            {puedeVerPronosticos ? (
              <Eye size={24} color="#60a5fa" />
            ) : (
              <Lock size={24} color="#facc15" />
            )}
            Pronósticos del grupo
          </h2>

          {!puedeVerPronosticos ? (
            <div className="lockedBox">
              <Lock size={34} />
              <h3>Pronósticos ocultos</h3>
              <p>
                Los pronósticos de los demás participantes se mostrarán cuando
                empiece el partido para evitar copias.
              </p>
            </div>
          ) : pronosticos.length === 0 ? (
            <div className="lockedBox">
              <Eye size={34} />
              <h3>Sin pronósticos todavía</h3>
              <p>No hay pronósticos guardados para este partido.</p>
            </div>
          ) : (
            <div className="predictionsList">
              {pronosticos.map((p) => {
                const nombre = getNombreParticipante(p);

                return (
                  <div key={p.id} className="predictionRow">
                    <div className="avatar">{nombre.charAt(0)}</div>

                    <div>
                      <p className="predictionName">{nombre}</p>
                      <p className="predictionText">
                        {partido.local} {p.goles_local} - {p.goles_visitante}{" "}
                        {partido.visitante}
                      </p>
                    </div>

                    <div className="predictionScore">
                      {p.goles_local} - {p.goles_visitante}
                    </div>

                    <div className="pointsBadge">{p.puntos ?? 0} pts</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Styles />
    </main>
  );
}

function Team({ code, name }: { code: string | null; name: string }) {
  return (
    <div className="team">
      <div className="flagCircle">
        {code ? (
          <img src={`https://flagcdn.com/w160/${code}.png`} alt={name} />
        ) : (
          <span />
        )}
      </div>

      <h2 className="teamName">{name}</h2>
    </div>
  );
}

function PredictionBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="barBlock">
      <div className="barHeader">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>

      <div className="barTrack">
        <div className="barFill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="infoRow">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      .page {
        min-height: 100vh;
        background: linear-gradient(180deg, #020617 0%, #111827 100%);
        color: white;
        padding: 32px 16px 110px;
      }

      .container {
        max-width: 1000px;
        margin: 0 auto;
      }

      .backButton {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #bfdbfe;
        text-decoration: none;
        font-weight: 900;
        margin-bottom: 18px;
      }

      .title {
        font-size: 44px;
        font-weight: 900;
      }

      .emptyBox {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 24px;
        padding: 32px;
        text-align: center;
        color: #94a3b8;
        font-weight: 800;
      }

      .heroCard,
      .panel {
        background: linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.65));
        border: 1px solid rgba(255,255,255,0.12);
      }

      .heroCard {
        border-radius: 34px;
        padding: 30px;
      }

      .topInfo {
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .badge,
      .statusBadge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 9px 14px;
        font-weight: 800;
      }

      .badge {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.10);
        color: #cbd5e1;
      }

      .statusBadge.pending {
        background: rgba(37,99,235,0.18);
        color: #93c5fd;
      }

      .statusBadge.finished {
        background: rgba(22,163,74,0.18);
        color: #86efac;
      }

      .matchMain {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 28px;
        margin-top: 34px;
      }

      .team {
        text-align: center;
      }

      .flagCircle {
        width: 120px;
        height: 120px;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        border: 2px solid rgba(255,255,255,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        overflow: hidden;
        box-shadow: 0 0 30px rgba(255,255,255,0.10);
      }

      .flagCircle img {
        width: 120px;
        height: 120px;
        object-fit: cover;
      }

      .teamName {
        font-size: 30px;
        font-weight: 900;
        margin-top: 16px;
      }

      .scoreBox {
        background: rgba(0,0,0,0.32);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 28px;
        padding: 26px 36px;
        text-align: center;
        min-width: 210px;
      }

      .scoreLabel {
        color: #94a3b8;
        font-size: 12px;
        text-transform: uppercase;
        font-weight: 900;
        letter-spacing: 1px;
      }

      .score {
        font-size: 56px;
        font-weight: 900;
        margin-top: 8px;
      }

      .status {
        color: #93c5fd;
        font-weight: 900;
        margin-top: 6px;
      }

      .stadium {
        margin-top: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #94a3b8;
        font-weight: 800;
        flex-wrap: wrap;
      }

      .primaryButton {
        margin: 28px auto 0;
        display: flex;
        width: fit-content;
        align-items: center;
        gap: 10px;
        justify-content: center;
        padding: 16px 26px;
        border-radius: 16px;
        background: #2563eb;
        color: white;
        text-decoration: none;
        font-weight: 900;
        font-size: 17px;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 22px;
        margin-top: 24px;
      }

      .panel {
        border-radius: 28px;
        padding: 24px;
      }

      .panelTitle {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 24px;
        font-weight: 900;
        margin-bottom: 18px;
      }

      .barBlock {
        margin-top: 18px;
      }

      .barHeader {
        display: flex;
        justify-content: space-between;
        color: #cbd5e1;
        font-weight: 800;
      }

      .barTrack {
        margin-top: 8px;
        height: 12px;
        background: rgba(255,255,255,0.08);
        border-radius: 999px;
        overflow: hidden;
      }

      .barFill {
        height: 100%;
        background: #2563eb;
        border-radius: 999px;
      }

      .infoRow {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 0;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }

      .infoRow span {
        color: #94a3b8;
      }

      .predictionsPanel {
        margin-top: 24px;
      }

      .lockedMiniBox,
      .lockedBox {
        text-align: center;
        background: rgba(0,0,0,0.24);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 24px;
        color: #cbd5e1;
      }

      .lockedMiniBox {
        padding: 26px;
      }

      .lockedBox {
        padding: 34px;
      }

      .lockedBox h3 {
        color: white;
        font-size: 24px;
        font-weight: 900;
        margin-top: 14px;
      }

      .lockedBox p,
      .lockedMiniBox p {
        max-width: 560px;
        margin: 10px auto 0;
        line-height: 1.6;
      }

      .predictionsList {
        display: grid;
        gap: 12px;
      }

      .predictionRow {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        align-items: center;
        gap: 14px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 18px;
        padding: 14px;
      }

      .avatar {
        width: 42px;
        height: 42px;
        border-radius: 999px;
        background: #2563eb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
      }

      .predictionName {
        font-weight: 900;
        font-size: 17px;
      }

      .predictionText {
        color: #94a3b8;
        margin-top: 3px;
      }

      .predictionScore {
        font-size: 24px;
        font-weight: 900;
        color: #bfdbfe;
      }

      .pointsBadge {
        background: rgba(34,197,94,0.18);
        color: #86efac;
        border-radius: 999px;
        padding: 8px 12px;
        font-weight: 900;
      }

      @media (max-width: 820px) {
        .matchMain {
          grid-template-columns: 1fr;
        }

        .grid {
          grid-template-columns: 1fr;
        }

        .scoreBox {
          width: 100%;
          box-sizing: border-box;
        }
      }

      @media (max-width: 520px) {
        .page {
          padding: 24px 12px 110px;
        }

        .heroCard,
        .panel {
          padding: 20px;
          border-radius: 26px;
        }

        .flagCircle {
          width: 88px;
          height: 88px;
        }

        .flagCircle img {
          width: 88px;
          height: 88px;
        }

        .teamName {
          font-size: 24px;
        }

        .score {
          font-size: 44px;
        }

        .predictionRow {
          grid-template-columns: auto 1fr;
        }

        .predictionScore,
        .pointsBadge {
          grid-column: 1 / -1;
          text-align: center;
        }
      }
    `}</style>
  );
}