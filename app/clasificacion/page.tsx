"use client";

import { useState } from "react";
import { Trophy, Table2, GitBranch } from "lucide-react";
import { gruposMundial, eliminatorias } from "@/data/mock";

type Vista = "grupos" | "eliminatorias";

export default function ClasificacionPage() {
  const [vista, setVista] = useState<Vista>("grupos");

  return (
    <main className="clasificacionPage">
      <div className="container">
        <div className="header">
          <div className="headerIcon">
            {vista === "grupos" ? <Table2 size={30} /> : <GitBranch size={30} />}
          </div>

          <div>
            <h1>Clasificación</h1>
            <p>Grupos y cuadro eliminatorio del Mundial 2026.</p>
          </div>
        </div>

        <div className="tabs">
          <button
            className={`tab ${vista === "grupos" ? "active" : ""}`}
            onClick={() => setVista("grupos")}
          >
            <Table2 size={18} />
            Grupos
          </button>

          <button
            className={`tab ${vista === "eliminatorias" ? "active" : ""}`}
            onClick={() => setVista("eliminatorias")}
          >
            <GitBranch size={18} />
            Eliminatorias
          </button>
        </div>

        {vista === "grupos" ? <GruposView /> : <EliminatoriasView />}
      </div>

      <style>{`
        .clasificacionPage {
          min-height: 100vh;
          background: linear-gradient(180deg, #020617 0%, #111827 100%);
          color: white;
          padding: 32px 16px 110px;
        }

        .container {
          max-width: 1180px;
          margin: 0 auto;
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

        .tabs {
          display: inline-flex;
          gap: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 999px;
          padding: 6px;
          margin-bottom: 28px;
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

        .teams {
          display: grid;
          gap: 10px;
        }

        .teamRow {
          display: grid;
          grid-template-columns: 34px 42px 1fr auto;
          gap: 10px;
          align-items: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 12px;
        }

        .position {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 12px;
        }

        .flag {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.22);
        }

        .teamName {
          font-weight: 900;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status {
          color: #94a3b8;
          font-weight: 900;
          font-size: 13px;
        }

        .note {
          color: #86efac;
          margin-top: 16px;
          font-size: 13px;
          font-weight: 800;
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
          min-width: 1050px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
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

        .matchTeam + .matchTeam {
          margin-top: 8px;
        }

        .placeholderFlag {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.18);
          flex-shrink: 0;
        }

        .matchTeamName {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
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

        @media (max-width: 820px) {
          .groupsGrid {
            grid-template-columns: 1fr;
          }

          .bracketIntro {
            align-items: flex-start;
          }
        }

        @media (max-width: 520px) {
          .clasificacionPage {
            padding: 24px 12px 110px;
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

          .tabs {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .tab {
            justify-content: center;
            padding: 11px 10px;
            font-size: 13px;
          }

          .groupCard,
          .roundColumn {
            padding: 18px;
            border-radius: 24px;
          }

          .groupHeader h2,
          .roundHeader h2 {
            font-size: 22px;
          }

          .teamRow {
            grid-template-columns: 28px 36px 1fr auto;
            padding: 10px;
          }

          .flag {
            width: 32px;
            height: 32px;
          }

          .teamName {
            font-size: 14px;
          }

          .status {
            font-size: 12px;
          }

          .bracket {
            min-width: 900px;
          }

          .bracketIntro {
            padding: 18px;
          }
        }
      `}</style>
    </main>
  );
}

function GruposView() {
  return (
    <div className="groupsGrid">
      {gruposMundial.map((grupo) => (
        <section key={grupo.nombre} className="groupCard">
          <div className="groupHeader">
            <Trophy size={22} color="#facc15" />
            <h2>{grupo.nombre}</h2>
          </div>

          <div className="teams">
            {grupo.equipos.map((equipo, index) => (
              <div key={equipo.nombre} className="teamRow">
                <span className="position">{index + 1}</span>

                <img
                  src={`https://flagcdn.com/w80/${equipo.code}.png`}
                  alt={equipo.nombre}
                  className="flag"
                />

                <span className="teamName">{equipo.nombre}</span>

                <span className="status">0 pts</span>
              </div>
            ))}
          </div>

          <p className="note">Los 2 primeros pasan a la siguiente ronda.</p>
        </section>
      ))}
    </div>
  );
}

function EliminatoriasView() {
  return (
    <>
      <div className="bracketIntro">
        <div className="bracketIntroIcon">
          <GitBranch size={28} />
        </div>

        <div>
          <h2>Cuadro eliminatorio</h2>
          <p>
            Visualiza el camino hacia la final. Los cruces reales se completarán
            cuando estén definidos los clasificados.
          </p>
        </div>
      </div>

      <div className="bracketScroll">
        <div className="bracket">
          {eliminatorias.map((ronda) => (
            <section key={ronda.ronda} className="roundColumn">
              <div className="roundHeader">
                <Trophy size={20} color="#facc15" />
                <h2>{ronda.ronda}</h2>
              </div>

              <div className="matches">
                {ronda.partidos.map((partido) => (
                  <article key={partido.id} className="matchCard">
                    <BracketTeam name={partido.local} />
                    <BracketTeam name={partido.visitante} />

                    <div className="winnerBadge">
                      <Trophy size={13} />
                      Ganador pendiente
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

function BracketTeam({ name }: { name: string }) {
  return (
    <div className="matchTeam">
      <span className="placeholderFlag" />
      <span className="matchTeamName">{name}</span>
    </div>
  );
}