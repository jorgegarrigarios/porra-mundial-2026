"use client";

import { useState } from "react";
import { ArrowRight, GitBranch, ShieldCheck, Table2, Trophy } from "lucide-react";
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
            <p>Grupos, mejores terceros y cuadro eliminatorio del Mundial 2026.</p>
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
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.22);
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

          .tableHeader,
          .teamRow {
            grid-template-columns: 32px minmax(155px, 1fr) repeat(6, 38px);
          }

          .teamRow {
            padding: 10px;
          }

          .flag {
            width: 32px;
            height: 32px;
          }

          .teamName {
            font-size: 14px;
          }

          .status,
          .stat {
            font-size: 12px;
          }

          .thirdsHeader {
            grid-template-columns: 1fr;
          }

          .thirdsCounter {
            text-align: left;
          }

          .thirdsGrid {
            grid-template-columns: 1fr;
          }

          .bracket {
            min-width: 900px;
          }

          .bracketIntro {
            padding: 18px;
          }
        }


        @media (max-width: 640px) {
          .clasificacionPage {
            padding: 22px 12px 138px;
            overflow-x: hidden;
          }

          .container,
          .header,
          .tabs,
          .groupsGrid,
          .thirdsPanel,
          .bracketIntro,
          .bracketScroll {
            max-width: 100%;
            box-sizing: border-box;
          }

          .header h1 {
            font-size: 34px;
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

          .groupsGrid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .groupCard,
          .roundColumn,
          .thirdsPanel,
          .rulesPanel,
          .bracketIntro {
            padding: 16px;
            border-radius: 22px;
          }

          .tableHeader,
          .teamRow {
            grid-template-columns: 30px minmax(140px, 1fr) repeat(6, 34px);
            min-width: 430px;
          }

          .teamRow {
            padding: 10px;
          }

          .teamName {
            font-size: 13px;
          }

          .teamStatus {
            font-size: 10px;
          }

          .stat,
          .status {
            font-size: 12px;
          }

          .thirdsHeader {
            grid-template-columns: 1fr;
          }

          .thirdsGrid {
            grid-template-columns: 1fr;
          }

          .thirdCard {
            grid-template-columns: auto auto 1fr;
          }

          .thirdStatus {
            grid-column: 3;
            width: fit-content;
          }

          .bracketScroll {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .bracket {
            min-width: 820px;
          }
        }

      `}</style>
    </main>
  );
}

function GruposView() {
  const mejoresTerceros = gruposMundial
    .map((grupo) => grupo.equipos[2] ? { ...grupo.equipos[2], grupo: grupo.nombre } : null)
    .filter((equipo): equipo is { nombre: string; code: string; grupo: string } => Boolean(equipo));

  return (
    <>
      <div className="rulesPanel">
        <div className="rulesIcon">
          <ShieldCheck size={26} />
        </div>

        <div>
          <h2>Formato Mundial 2026</h2>
          <p>
            Pasan los dos primeros de cada grupo y los 8 mejores terceros.
            Por eso la tercera posición queda marcada como zona de mejor tercero.
          </p>
        </div>
      </div>

      <div className="legend">
        <div><span className="legendDot direct" /> 1º y 2º: clasificados directos</div>
        <div><span className="legendDot third" /> 3º: opción mejores terceros</div>
        <div><span className="legendDot pending" /> 4º: pendiente / eliminado</div>
      </div>

      <div className="groupsGrid">
      {gruposMundial.map((grupo) => (
        <section key={grupo.nombre} className="groupCard">
          <div className="groupHeader">
            <Trophy size={22} color="#facc15" />
            <h2>{grupo.nombre}</h2>
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

            {grupo.equipos.map((equipo, index) => (
              <div
                key={equipo.nombre}
                className={`teamRow ${
                  index < 2 ? "directRow" : index === 2 ? "thirdRow" : ""
                }`}
              >
                <span
                  className={`position ${
                    index < 2 ? "direct" : index === 2 ? "third" : ""
                  }`}
                >
                  {index + 1}
                </span>

                <div className="teamCell">
                  <img
                    src={`https://flagcdn.com/w80/${equipo.code}.png`}
                    alt={equipo.nombre}
                    className="flag"
                  />

                  <div>
                    <span className="teamName">{equipo.nombre}</span>
                    <span className="teamStatus">
                      {index < 2
                        ? "Clasifica directo"
                        : index === 2
                        ? "Opción mejor tercero"
                        : "Pendiente"}
                    </span>
                  </div>
                </div>

                <span className="stat">0</span>
                <span className="stat">0</span>
                <span className="stat">0</span>
                <span className="stat">0</span>
                <span className="stat">0</span>
                <span className="status">0</span>
              </div>
            ))}
          </div>

          <p className="note">1º y 2º pasan directos. Los 8 mejores terceros también avanzan a dieciseisavos.</p>
        </section>
      ))}
      </div>

      <section className="thirdsPanel">
        <div className="thirdsHeader">
          <div>
            <p className="eyebrow">Nueva ronda 2026</p>
            <h2>Ranking de mejores terceros</h2>
            <p>
              Aquí se ordenarán los terceros de cada grupo cuando haya resultados.
              Los 8 primeros pasan a dieciseisavos.
            </p>
          </div>

          <div className="thirdsCounter">
            <strong>8/12</strong>
            <span>clasifican</span>
          </div>
        </div>

        <div className="thirdsGrid">
          {mejoresTerceros.map((equipo, index) => (
            <article
              key={`${equipo.grupo}-${equipo.nombre}`}
              className={`thirdCard ${index < 8 ? "qualified" : ""}`}
            >
              <span className="thirdPosition">{index + 1}</span>

              <img
                src={`https://flagcdn.com/w80/${equipo.code}.png`}
                alt={equipo.nombre}
                className="flag"
              />

              <div>
                <strong>{equipo.nombre}</strong>
                <span>Grupo {equipo.grupo} · 0 pts · DG 0</span>
              </div>

              <div className={`thirdStatus ${index < 8 ? "ok" : "wait"}`}>
                {index < 8 ? "Pasa" : "Fuera"}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
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
            Visualiza el camino hacia la final. En 2026 hay dieciseisavos:
            pasan 32 selecciones, incluyendo los 8 mejores terceros.
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