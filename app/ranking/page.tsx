"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  Medal,
  Crown,
  Star,
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

type RankingItem = {
  id: number;
  nombre: string;
  puntos: number;
  exactos: number;
  acertados: number;
};

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarRanking();
  }, []);

  async function cargarRanking() {
    setLoading(true);

    try {
      const usuario = await obtenerParticipanteActual();

      if (usuario) {
        setUsuarioActual(usuario.nickname || usuario.nombre || "Usuario");
      }

      const { data: participantes, error: participantesError } = await supabase
        .from("participantes")
        .select("id, nombre, nickname");

      if (participantesError) {
        console.error(
          "Error cargando participantes:",
          participantesError.message
        );
        setRanking([]);
        return;
      }

      const { data: pronosticos, error: pronosticosError } = await supabase
        .from("pronosticos")
        .select("participante_id, puntos");

      if (pronosticosError) {
        console.error(
          "Error cargando pronósticos:",
          pronosticosError.message
        );
        setRanking([]);
        return;
      }

      const rankingGenerado = (participantes ?? []).map(
        (participante: Participante) => {
          const nombreVisible =
            participante.nickname || participante.nombre || "Usuario";

          const pronosticosJugador = (pronosticos ?? []).filter(
            (p: Pronostico) => p.participante_id === participante.id
          );

          const puntos = pronosticosJugador.reduce(
            (acc: number, p: Pronostico) => acc + (p.puntos ?? 0),
            0
          );

          return {
            id: participante.id,
            nombre: nombreVisible,
            puntos,

            exactos: pronosticosJugador.filter(
              (p: Pronostico) => (p.puntos ?? 0) === 5
            ).length,

            acertados: pronosticosJugador.filter(
              (p: Pronostico) => (p.puntos ?? 0) >= 3
            ).length,
          };
        }
      );

      rankingGenerado.sort((a, b) => {
        if (b.puntos !== a.puntos) {
          return b.puntos - a.puntos;
        }

        if (b.exactos !== a.exactos) {
          return b.exactos - a.exactos;
        }

        return b.acertados - a.acertados;
      });

      setRanking(rankingGenerado);
    } catch (error) {
      console.error("Error inesperado cargando ranking:", error);
      setRanking([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <div className="loadingBox">
            Cargando ranking...
          </div>
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

            <p>
              Clasificación general de la porra del Mundial 2026.
            </p>
          </div>
        </div>

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

                <div className="points">
                  {jugador.puntos}
                </div>

                <div className="pointsLabel">
                  puntos
                </div>

                <div className="stats">
                  {jugador.exactos} exactos ·{" "}
                  {jugador.acertados} aciertos
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="tableTitle">
          Clasificación general
        </h2>

        <div className="table">
          {ranking.map((jugador, index) => (
            <div
              key={jugador.id}
              className={`row ${
                jugador.nombre === usuarioActual ? "myRow" : ""
              }`}
            >
              <div className="left">
                <div className="position">
                  {index + 1}
                </div>

                <div>
                  <div className="nameRow">
                    <strong>{jugador.nombre}</strong>

                    {jugador.nombre === usuarioActual && (
                      <span className="youBadgeSmall">
                        Tú
                      </span>
                    )}
                  </div>

                  <div className="detail">
                    Exactos: {jugador.exactos} ·
                    Aciertos: {jugador.acertados}
                  </div>
                </div>
              </div>

              <div className="right">
                <div className="pointsSmall">
                  {jugador.puntos}
                </div>

                <div className="pointsText">
                  puntos
                </div>

                <div className="liveBadge">
                  <TrendingUp size={15} />
                  Live
                </div>
              </div>
            </div>
          ))}
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
      }

      .header h1 {
        font-size: 52px;
        font-weight: 900;
        margin: 0;
      }

      .header p {
        color: #94a3b8;
        margin-top: 6px;
      }

      .loadingBox {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 24px;
        padding: 30px;
        text-align: center;
        color: #94a3b8;
        font-weight: 800;
      }

      .podium {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 22px;
        margin-bottom: 44px;
      }

      .podiumCard {
        background: linear-gradient(
          145deg,
          rgba(15,23,42,0.98),
          rgba(15,23,42,0.65)
        );
        border-radius: 34px;
        padding: 34px 24px;
        text-align: center;
        border: 1px solid rgba(255,255,255,0.12);
      }

      .podium1 {
        border-color: rgba(250,204,21,0.45);
      }

      .podium2 {
        border-color: rgba(203,213,225,0.35);
      }

      .podium3 {
        border-color: rgba(251,146,60,0.35);
      }

      .podiumIcon {
        width: 92px;
        height: 92px;
        border-radius: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
      }

      .podium1 .podiumIcon {
        background: #facc15;
        color: black;
      }

      .podium2 .podiumIcon {
        background: #d1d5db;
        color: black;
      }

      .podium3 .podiumIcon {
        background: #fb923c;
      }

      .podiumPosition {
        font-size: 14px;
        font-weight: 900;
        margin-bottom: 18px;
      }

      .podium1 .podiumPosition {
        color: #facc15;
      }

      .podium2 .podiumPosition {
        color: #d1d5db;
      }

      .podium3 .podiumPosition {
        color: #fb923c;
      }

      .podiumCard h2 {
        font-size: 28px;
        font-weight: 900;
        margin-bottom: 14px;
      }

      .youBadge,
      .youBadgeSmall {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #2563eb;
        color: white;
        font-weight: 900;
        border-radius: 999px;
      }

      .youBadge {
        padding: 8px 14px;
        margin-bottom: 22px;
      }

      .youBadgeSmall {
        padding: 4px 10px;
        font-size: 12px;
      }

      .points {
        font-size: 74px;
        font-weight: 900;
        line-height: 1;
      }

      .pointsLabel {
        color: #94a3b8;
        margin-top: 10px;
        font-size: 18px;
      }

      .stats {
        margin-top: 22px;
        color: #cbd5e1;
        font-size: 16px;
      }

      .tableTitle {
        font-size: 48px;
        font-weight: 900;
        margin-bottom: 22px;
      }

      .table {
        display: grid;
        gap: 14px;
      }

      .row {
        background: rgba(15,23,42,0.72);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 28px;
        padding: 22px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
      }

      .myRow {
        background: rgba(37,99,235,0.34);
        border-color: rgba(96,165,250,0.45);
      }

      .left {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .position {
        width: 58px;
        height: 58px;
        border-radius: 999px;
        background: #facc15;
        color: black;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        font-weight: 900;
        flex-shrink: 0;
      }

      .nameRow {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .nameRow strong {
        font-size: 22px;
      }

      .detail {
        margin-top: 4px;
        color: #94a3b8;
      }

      .right {
        text-align: right;
      }

      .pointsSmall {
        font-size: 52px;
        font-weight: 900;
        line-height: 1;
      }

      .pointsText {
        color: #94a3b8;
        margin-top: 4px;
      }

      .liveBadge {
        margin-top: 10px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(34,197,94,0.18);
        color: #86efac;
        border-radius: 999px;
        padding: 8px 12px;
        font-weight: 900;
      }

      @media (max-width: 980px) {
        .podium {
          grid-template-columns: 1fr;
        }

        .tableTitle {
          font-size: 36px;
        }

        .row {
          flex-direction: column;
          align-items: flex-start;
        }

        .right {
          width: 100%;
          text-align: left;
        }
      }

      @media (max-width: 640px) {
        .header {
          align-items: flex-start;
        }

        .header h1 {
          font-size: 40px;
        }

        .tableTitle {
          font-size: 32px;
        }

        .points {
          font-size: 60px;
        }

        .pointsSmall {
          font-size: 42px;
        }
      }
    `}</style>
  );
}