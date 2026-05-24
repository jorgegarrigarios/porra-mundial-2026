"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  Medal,
  RefreshCw,
  Star,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { obtenerParticipanteActual } from "@/lib/participante";

type Participante = {
  id: number;
  nombre: string | null;
  nickname: string | null;
};

type Pronostico = {
  participante_id: number;
  puntos: number | null;
};

type PronosticoGrupo = {
  participante_id: number;
  puntos_total: number | null;
};

type PronosticoBonus = {
  participante_id: number;
  puntos_total: number | null;
};

type RankingItem = {
  id: number;
  nombre: string;
  puntos: number;
  puntosPartidos: number;
  puntosGrupos: number;
  puntosBonus: number;
  exactos: number;
  acertados: number;
};

function sumarPuntosPorParticipante<T extends { participante_id: number }>(
  filas: T[],
  participanteId: number,
  obtenerPuntos: (fila: T) => number | null
) {
  return filas
    .filter((fila) => fila.participante_id === participanteId)
    .reduce((total, fila) => total + (obtenerPuntos(fila) ?? 0), 0);
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    cargarRanking();

    const channel = supabase
      .channel("ranking-global-v12")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pronosticos",
        },
        () => cargarRanking(true)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pronosticos_grupos",
        },
        () => cargarRanking(true)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pronosticos_bonus",
        },
        () => cargarRanking(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function cargarRanking(silencioso = false) {
    if (!silencioso) {
      setLoading(true);
    }

    setErrorCarga(null);

    try {
      const usuario = await obtenerParticipanteActual();

      if (usuario) {
        setUsuarioActual(usuario.nickname || usuario.nombre || "Usuario");
      }

      const [
        { data: participantes, error: participantesError },
        { data: pronosticos, error: pronosticosError },
        { data: pronosticosGrupos, error: gruposError },
        { data: pronosticosBonus, error: bonusError },
      ] = await Promise.all([
        supabase.from("participantes").select("id, nombre, nickname"),
        supabase.from("pronosticos").select("participante_id, puntos"),
        supabase.from("pronosticos_grupos").select("participante_id, puntos_total"),
        supabase.from("pronosticos_bonus").select("participante_id, puntos_total"),
      ]);

      if (participantesError) {
        console.error("Error cargando participantes:", participantesError.message);
        setErrorCarga("No se han podido cargar los participantes.");
        setRanking([]);
        return;
      }

      if (pronosticosError) {
        console.error("Error cargando pronósticos:", pronosticosError.message);
        setErrorCarga("No se han podido cargar los puntos de partidos.");
        setRanking([]);
        return;
      }

      if (gruposError) {
        console.error("Error cargando pronósticos de grupos:", gruposError.message);
        setErrorCarga("No se han podido cargar los puntos de grupos.");
        setRanking([]);
        return;
      }

      if (bonusError) {
        console.error("Error cargando pronósticos bonus:", bonusError.message);
        setErrorCarga("No se han podido cargar los puntos bonus.");
        setRanking([]);
        return;
      }

      const pronosticosPartidos = (pronosticos ?? []) as Pronostico[];
      const grupos = (pronosticosGrupos ?? []) as PronosticoGrupo[];
      const bonus = (pronosticosBonus ?? []) as PronosticoBonus[];

      const rankingGenerado = ((participantes ?? []) as Participante[]).map(
        (participante) => {
          const nombreVisible =
            participante.nickname || participante.nombre || "Usuario";

          const puntosPartidos = sumarPuntosPorParticipante(
            pronosticosPartidos,
            participante.id,
            (p) => p.puntos
          );

          const puntosGrupos = sumarPuntosPorParticipante(
            grupos,
            participante.id,
            (p) => p.puntos_total
          );

          const puntosBonus = sumarPuntosPorParticipante(
            bonus,
            participante.id,
            (p) => p.puntos_total
          );

          const puntos = puntosPartidos + puntosGrupos + puntosBonus;

          const exactos = pronosticosPartidos.filter(
            (p) => p.participante_id === participante.id && (p.puntos ?? 0) === 5
          ).length;

          const acertadosPartidos = pronosticosPartidos.filter(
            (p) => p.participante_id === participante.id && (p.puntos ?? 0) > 0
          ).length;

          const acertadosGrupos = grupos.filter(
            (p) => p.participante_id === participante.id && (p.puntos_total ?? 0) > 0
          ).length;

          const acertadosBonus = bonus.filter(
            (p) => p.participante_id === participante.id && (p.puntos_total ?? 0) > 0
          ).length;

          return {
            id: participante.id,
            nombre: nombreVisible,
            puntos,
            puntosPartidos,
            puntosGrupos,
            puntosBonus,
            exactos,
            acertados: acertadosPartidos + acertadosGrupos + acertadosBonus,
          };
        }
      );

      rankingGenerado.sort((a, b) => {
        if (b.puntos !== a.puntos) {
          return b.puntos - a.puntos;
        }

        if (b.acertados !== a.acertados) {
          return b.acertados - a.acertados;
        }

        if (b.exactos !== a.exactos) {
          return b.exactos - a.exactos;
        }

        return a.nombre.localeCompare(b.nombre);
      });

      setRanking(rankingGenerado);
    } catch (error) {
      console.error("Error inesperado cargando ranking:", error);
      setErrorCarga("Ha ocurrido un error cargando el ranking.");
      setRanking([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <div className="loadingBox">Cargando ranking...</div>
        </div>

        <Styles />
      </main>
    );
  }

  const top3 = ranking.slice(0, 3);

  return (
    <main className="page">
      <div className="container">
        <div className="header">
          <div className="headerIcon">
            <Trophy size={34} />
          </div>

          <div>
            <h1>Ranking</h1>

            <p>Clasificación general V1.2: partidos, grupos y bonus.</p>
          </div>
        </div>

        {errorCarga && (
          <div className="errorBox">
            <span>{errorCarga}</span>

            <button
              type="button"
              className="retryButton"
              onClick={() => cargarRanking()}
            >
              <RefreshCw size={16} />
              Reintentar
            </button>
          </div>
        )}

        <div className="podium">
          {top3.map((jugador, index) => {
            const posicion = index + 1;

            return (
              <div
                key={jugador.id}
                className={`podiumCard podium${posicion}`}
              >
                <div className="podiumIcon">
                  {posicion === 1 ? (
                    <Crown size={34} />
                  ) : posicion === 2 ? (
                    <Medal size={34} />
                  ) : (
                    <Star size={34} />
                  )}
                </div>

                <div className="podiumPosition">
                  {posicion === 1
                    ? "#1 · Campeón provisional"
                    : posicion === 2
                    ? "#2 · Segundo puesto"
                    : "#3 · Tercer puesto"}
                </div>

                <h2>{jugador.nombre}</h2>

                {jugador.nombre === usuarioActual && (
                  <div className="youBadge">Tú</div>
                )}

                <div className="points">{jugador.puntos}</div>

                <div className="pointsLabel">puntos</div>

                <div className="stats">
                  {jugador.acertados} aciertos · {jugador.exactos} exactos
                </div>

                <div className="breakdown">
                  <span>Partidos {jugador.puntosPartidos}</span>
                  <span>Grupos {jugador.puntosGrupos}</span>
                  <span>Bonus {jugador.puntosBonus}</span>
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="tableTitle">Clasificación general</h2>

        <div className="table">
          {ranking.map((jugador, index) => (
            <div
              key={jugador.id}
              className={`row ${
                jugador.nombre === usuarioActual ? "myRow" : ""
              }`}
            >
              <div className="left">
                <div className="position">{index + 1}</div>

                <div>
                  <div className="nameRow">
                    <strong>{jugador.nombre}</strong>

                    {jugador.nombre === usuarioActual && (
                      <span className="youBadgeSmall">Tú</span>
                    )}
                  </div>

                  <div className="detail">
                    Aciertos: {jugador.acertados} · Exactos: {jugador.exactos}
                  </div>

                  <div className="miniBreakdown">
                    <span>Partidos {jugador.puntosPartidos}</span>
                    <span>Grupos {jugador.puntosGrupos}</span>
                    <span>Bonus {jugador.puntosBonus}</span>
                  </div>
                </div>
              </div>

              <div className="right">
                <div className="pointsSmall">{jugador.puntos}</div>

                <div className="pointsText">puntos</div>

                <div className="liveBadge">
                  <TrendingUp size={15} />
                  Live
                </div>
              </div>
            </div>
          ))}

          {ranking.length === 0 && (
            <div className="emptyBox">
              <Trophy size={32} />
              <h2>Aún no hay ranking</h2>
              <p>Cuando haya participantes aparecerá la clasificación.</p>
            </div>
          )}
        </div>
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
          radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 30%),
          linear-gradient(180deg, #020617 0%, #111827 100%);
        color: white;
        padding: 36px 16px 120px;
      }

      .container {
        max-width: 1180px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
      }

      .headerIcon {
        width: 74px;
        height: 74px;
        border-radius: 24px;
        background: #2563eb;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .header h1 {
        font-size: 52px;
        font-weight: 900;
        margin: 0;
      }

      .header p {
        color: #94a3b8;
        margin-top: 6px;
        font-weight: 700;
      }

      .loadingBox,
      .emptyBox,
      .errorBox {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 24px;
        padding: 32px;
        color: #cbd5e1;
      }

      .loadingBox,
      .emptyBox {
        text-align: center;
      }

      .errorBox {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 18px;
        color: #fecaca;
        background: rgba(239,68,68,0.10);
        border-color: rgba(239,68,68,0.24);
      }

      .retryButton {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(255,255,255,0.16);
        border-radius: 16px;
        padding: 10px 14px;
        background: rgba(255,255,255,0.08);
        color: white;
        font-weight: 900;
        cursor: pointer;
        font-family: inherit;
      }

      .podium {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
        margin-bottom: 38px;
      }

      .podiumCard {
        position: relative;
        overflow: hidden;
        border-radius: 30px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        padding: 26px;
        min-height: 275px;
        box-shadow: 0 22px 70px rgba(0,0,0,0.22);
      }

      .podium1 {
        background:
          radial-gradient(circle at top right, rgba(250,204,21,0.24), transparent 40%),
          rgba(255,255,255,0.06);
        border-color: rgba(250,204,21,0.35);
      }

      .podium2 {
        border-color: rgba(226,232,240,0.22);
      }

      .podium3 {
        border-color: rgba(251,146,60,0.24);
      }

      .podiumIcon {
        width: 64px;
        height: 64px;
        border-radius: 22px;
        background: rgba(255,255,255,0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #facc15;
        margin-bottom: 18px;
      }

      .podium2 .podiumIcon {
        color: #e5e7eb;
      }

      .podium3 .podiumIcon {
        color: #fb923c;
      }

      .podiumPosition {
        color: #93c5fd;
        font-size: 13px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .podiumCard h2 {
        margin: 10px 0 0;
        font-size: 26px;
        font-weight: 950;
      }

      .youBadge {
        display: inline-flex;
        margin-top: 10px;
        border-radius: 999px;
        background: rgba(37,99,235,0.22);
        border: 1px solid rgba(96,165,250,0.32);
        color: #bfdbfe;
        padding: 5px 10px;
        font-size: 12px;
        font-weight: 900;
      }

      .points {
        margin-top: 18px;
        font-size: 54px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.06em;
      }

      .pointsLabel {
        color: #94a3b8;
        font-weight: 850;
        margin-top: 3px;
      }

      .stats {
        margin-top: 10px;
        color: #cbd5e1;
        font-size: 14px;
        font-weight: 800;
      }

      .breakdown,
      .miniBreakdown {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 12px;
      }

      .breakdown span,
      .miniBreakdown span {
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.10);
        color: #cbd5e1;
        padding: 6px 9px;
        font-size: 11px;
        font-weight: 900;
      }

      .tableTitle {
        font-size: 32px;
        font-weight: 950;
        letter-spacing: -0.04em;
        margin: 0 0 16px;
      }

      .table {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 24px;
        padding: 18px;
      }

      .myRow {
        background: linear-gradient(145deg, rgba(37,99,235,0.24), rgba(255,255,255,0.06));
        border-color: rgba(96,165,250,0.38);
      }

      .left {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }

      .position {
        width: 46px;
        height: 46px;
        border-radius: 16px;
        background: #2563eb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 950;
        flex-shrink: 0;
      }

      .nameRow {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .nameRow strong {
        font-size: 20px;
        font-weight: 950;
      }

      .youBadgeSmall {
        border-radius: 999px;
        background: rgba(37,99,235,0.22);
        border: 1px solid rgba(96,165,250,0.32);
        color: #bfdbfe;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 900;
      }

      .detail {
        color: #94a3b8;
        margin-top: 4px;
        font-weight: 750;
        font-size: 13px;
      }

      .right {
        text-align: right;
        flex-shrink: 0;
      }

      .pointsSmall {
        font-size: 32px;
        line-height: 1;
        font-weight: 950;
      }

      .pointsText {
        color: #94a3b8;
        font-size: 12px;
        font-weight: 850;
      }

      .liveBadge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
        border-radius: 999px;
        background: rgba(34,197,94,0.12);
        border: 1px solid rgba(34,197,94,0.24);
        color: #bbf7d0;
        padding: 6px 9px;
        font-size: 12px;
        font-weight: 900;
      }

      @media (max-width: 820px) {
        .podium {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .page {
          padding: 84px 14px 125px;
        }

        .header {
          align-items: flex-start;
        }

        .headerIcon {
          width: 58px;
          height: 58px;
          border-radius: 20px;
        }

        .header h1 {
          font-size: 38px;
        }

        .row {
          align-items: flex-start;
          flex-direction: column;
        }

        .right {
          width: 100%;
          text-align: left;
          padding-left: 60px;
        }

        .errorBox {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `}</style>
  );
}
