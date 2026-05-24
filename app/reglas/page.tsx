import {
  CalendarClock,
  CheckCircle2,
  Crown,
  Flame,
  Goal,
  Medal,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

export default function ReglasPage() {
  return (
    <main className="reglasPage">
      <div className="container">
        <section className="hero">
          <div className="heroIcon">
            <Trophy size={38} />
          </div>

          <div className="heroText">
            <div className="eyebrow">
              <Sparkles size={16} />
              Sistema definitivo V1.2
            </div>

            <h1>Reglas y puntuación</h1>

            <p>
              Una porra rápida en fase de grupos, más intensa en eliminatorias y
              con bonus para mantener la emoción hasta el último partido.
            </p>
          </div>
        </section>

        <section className="summaryGrid">
          <article className="summaryCard highlight">
            <div className="summaryIcon">
              <Zap size={22} />
            </div>

            <span>Fase de grupos</span>
            <strong>Pronóstico rápido 1X2</strong>

            <p>
              Elige si gana el local, hay empate o gana el visitante. Rápido,
              sencillo y perfecto para móvil.
            </p>
          </article>

          <article className="summaryCard">
            <div className="summaryIcon">
              <Target size={22} />
            </div>

            <span>Eliminatorias</span>
            <strong>Resultado exacto</strong>

            <p>
              En los cruces aumenta la emoción: pronostica marcador exacto y qué
              selección pasa si pones empate.
            </p>
          </article>

          <article className="summaryCard">
            <div className="summaryIcon">
              <Crown size={22} />
            </div>

            <span>Bonus Mundial</span>
            <strong>Emoción hasta la final</strong>

            <p>
              Campeón, finalistas, Bota de Oro, revelación, decepción y premios
              individuales.
            </p>
          </article>
        </section>

        <section className="mainCard">
          <div className="sectionHeader">
            <Zap size={24} />

            <div>
              <h2>1. Fase de grupos: 1X2</h2>

              <p>
                Para evitar que la porra sea pesada, en fase de grupos solo hay
                que elegir el signo del partido.
              </p>
            </div>
          </div>

          <div className="oneXTwoGrid">
            <article className="choiceCard home">
              <span>1</span>
              <h3>Gana el local</h3>
              <p>Ejemplo: España gana a Japón.</p>
            </article>

            <article className="choiceCard draw">
              <span>X</span>
              <h3>Empate</h3>
              <p>Ejemplo: España y Japón empatan.</p>
            </article>

            <article className="choiceCard away">
              <span>2</span>
              <h3>Gana el visitante</h3>
              <p>Ejemplo: Japón gana a España.</p>
            </article>
          </div>

          <div className="pointsBanner">
            <strong>3 puntos</strong>
            <span>por cada 1X2 acertado en fase de grupos</span>
          </div>
        </section>

        <section className="mainCard">
          <div className="sectionHeader">
            <Target size={24} />

            <div>
              <h2>2. Eliminatorias: resultado exacto</h2>

              <p>
                En octavos, cuartos, semifinales, tercer puesto y final, la porra
                se vuelve más intensa.
              </p>
            </div>
          </div>

          <div className="rulesGrid">
            <article className="ruleCard exact">
              <div className="ruleTop">
                <Sparkles size={22} />
                <span>5 puntos</span>
              </div>

              <h3>Resultado exacto</h3>

              <p>Aciertas exactamente el marcador del partido.</p>

              <div className="example">
                <strong>Ejemplo</strong>

                <div className="exampleMatch">Argentina 2 - 1 Francia</div>

                <div className="exampleResult success">
                  Tu pronóstico: 2 - 1
                </div>
              </div>
            </article>

            <article className="ruleCard winner">
              <div className="ruleTop">
                <CheckCircle2 size={22} />
                <span>3 puntos</span>
              </div>

              <h3>Clasificado correcto</h3>

              <p>
                No aciertas el marcador exacto, pero sí la selección que pasa de
                ronda.
              </p>

              <div className="example">
                <strong>Ejemplo</strong>

                <div className="exampleMatch">Brasil 1 - 0 Alemania</div>

                <div className="exampleResult partial">
                  Tu pronóstico: Brasil 2 - 0
                </div>
              </div>
            </article>
          </div>

          <div className="tieCard">
            <div className="tieIcon">
              <Target size={24} />
            </div>

            <div>
              <h3>¿Y si pronosticas empate?</h3>

              <p>
                Si pones un empate en eliminatorias, tendrás que elegir qué
                selección pasa. Esto sirve para saber tu clasificado, pero{" "}
                <strong>no da puntos extra</strong>.
              </p>

              <div className="tieExample">
                <span>Pronóstico:</span>
                <strong>Argentina 1 - 1 Francia · Pasa Argentina</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="mainCard">
          <div className="sectionHeader">
            <Users size={24} />

            <div>
              <h2>3. Clasificados de grupo</h2>

              <p>
                Antes de empezar el Mundial, pronostica qué selecciones pasan de
                cada grupo.
              </p>
            </div>
          </div>

          <div className="groupScoring">
            <div className="scoreLine">
              <strong>2 puntos</strong>
              <span>por cada selección acertada</span>
            </div>

            <div className="scoreLine">
              <strong>+1 punto</strong>
              <span>si aciertas los 2 clasificados del grupo</span>
            </div>

            <div className="scoreLine">
              <strong>+1 punto</strong>
              <span>si aciertas también el orden exacto</span>
            </div>
          </div>

          <div className="exampleWide">
            <strong>Ejemplo</strong>

            <p>
              Si pasan España y Japón, y tú pronosticas España 1ª y Japón 2ª,
              sumas 2 + 2 + 1 + 1 = <b>6 puntos</b>.
            </p>
          </div>
        </section>

        <section className="mainCard bonusCard">
          <div className="sectionHeader">
            <Crown size={24} />

            <div>
              <h2>4. Bonus antes del Mundial</h2>

              <p>
                Estos pronósticos se hacen una sola vez y se bloquean cuando
                empiece el primer partido del Mundial.
              </p>
            </div>
          </div>

          <div className="bonusGrid">
            <article className="bonusItem champion">
              <div className="bonusTop">
                <Crown size={22} />
                <span>Campeón</span>
              </div>

              <h3>Ganador del Mundial</h3>

              <ul>
                <li>
                  <strong>20 puntos</strong> si aciertas el campeón.
                </li>
                <li>
                  <strong>8 puntos</strong> si tu campeón queda subcampeón.
                </li>
                <li>
                  <strong>4 puntos</strong> si llega a semifinales.
                </li>
              </ul>
            </article>

            <article className="bonusItem finalists">
              <div className="bonusTop">
                <Medal size={22} />
                <span>Finalistas</span>
              </div>

              <h3>Equipos que llegan a la final</h3>

              <ul>
                <li>
                  <strong>7 puntos</strong> por cada finalista acertado.
                </li>
                <li>
                  <strong>+4 puntos</strong> si aciertas los dos finalistas.
                </li>
              </ul>
            </article>

            <article className="bonusItem scorer">
              <div className="bonusTop">
                <Goal size={22} />
                <span>Bota de Oro</span>
              </div>

              <h3>Máximo goleador</h3>

              <ul>
                <li>
                  <strong>14 puntos</strong> si aciertas el máximo goleador.
                </li>
                <li>
                  <strong>5 puntos</strong> si tu jugador queda en el top 3.
                </li>
              </ul>
            </article>

            <article className="bonusItem player">
              <div className="bonusTop">
                <Star size={22} />
                <span>Premios</span>
              </div>

              <h3>Mejor jugador y portero</h3>

              <ul>
                <li>
                  <strong>10 puntos</strong> por acertar el mejor jugador.
                </li>
                <li>
                  <strong>8 puntos</strong> por acertar el mejor portero.
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section className="mainCard specialCard">
          <div className="sectionHeader">
            <Flame size={24} />

            <div>
              <h2>5. Bonus especiales</h2>

              <p>
                Apuestas sencillas, con mucho pique y capaces de mover el
                ranking.
              </p>
            </div>
          </div>

          <div className="specialGrid">
            <article className="specialItem revelation">
              <div className="bonusTop">
                <Flame size={22} />
                <span>Selección revelación</span>
              </div>

              <h3>La sorpresa del Mundial</h3>

              <p>
                Elige una selección entre las 10 peores clasificadas según el
                Ranking FIFA oficial masculino publicado el 1 de abril de 2026.
              </p>

              <ul>
                <li>
                  <strong>14 puntos</strong> si pasa la fase de grupos.
                </li>
                <li>
                  <strong>+5 puntos</strong> si llega a cuartos.
                </li>
              </ul>
            </article>

            <article className="specialItem disappointment">
              <div className="bonusTop">
                <ShieldAlert size={22} />
                <span>Selección decepción</span>
              </div>

              <h3>La cabeza de serie que falla</h3>

              <p>
                Elige una cabeza de serie que crees que no pasará la fase de
                grupos.
              </p>

              <ul>
                <li>
                  <strong>14 puntos</strong> si queda eliminada en fase de
                  grupos.
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section className="mainCard lockCard">
          <div className="sectionHeader">
            <CalendarClock size={24} />

            <div>
              <h2>6. Cuándo se bloquean</h2>

              <p>
                Para que sea justo, cada pronóstico tiene un momento de cierre.
              </p>
            </div>
          </div>

          <div className="lockList">
            <div className="lockRow">
              <span>Partidos de fase de grupos</span>
              <strong>Hasta el inicio de cada partido</strong>
            </div>

            <div className="lockRow">
              <span>Eliminatorias</span>
              <strong>Hasta el inicio de cada eliminatoria</strong>
            </div>

            <div className="lockRow">
              <span>Clasificados de grupo</span>
              <strong>Hasta el primer partido del Mundial</strong>
            </div>

            <div className="lockRow">
              <span>Campeón, finalistas y bonus</span>
              <strong>Hasta el primer partido del Mundial</strong>
            </div>
          </div>
        </section>

        <section className="whyCard">
          <div className="whyTop">
            <Sparkles size={26} />
            <h2>Por qué este sistema engancha</h2>
          </div>

          <div className="whyGrid">
            <div className="whyItem">⚡ Fase de grupos rápida</div>
            <div className="whyItem">🎯 Eliminatorias más intensas</div>
            <div className="whyItem">🔥 Bonus para remontar</div>
            <div className="whyItem">🏆 Emoción hasta la final</div>
          </div>
        </section>

        <section className="comebackCard">
          <div className="comebackIcon">
            <Flame size={30} />
          </div>

          <div>
            <h2>En esta porra nunca estás fuera</h2>

            <p>
              Aunque empieces mal, los clasificados, las eliminatorias, la Bota
              de Oro, los finalistas, el campeón y los bonus finales pueden
              cambiar el ranking hasta el último partido.
            </p>
          </div>
        </section>
      </div>

      <style>{`
        .reglasPage {
          min-height: 100vh;
          padding: 32px 16px 120px;
          background:
            radial-gradient(circle at top left, rgba(37,99,235,0.24), transparent 28%),
            radial-gradient(circle at top right, rgba(250,204,21,0.12), transparent 24%),
            linear-gradient(180deg, #020617 0%, #0f172a 48%, #020617 100%);
          color: white;
        }

        .container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .hero {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }

        .heroIcon {
          width: 78px;
          height: 78px;
          border-radius: 28px;
          background:
            linear-gradient(135deg, rgba(250,204,21,0.95), rgba(245,158,11,0.95)),
            linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 45px rgba(250,204,21,0.24);
          flex-shrink: 0;
        }

        .heroText {
          min-width: 0;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(37,99,235,0.18);
          border: 1px solid rgba(147,197,253,0.22);
          color: #bfdbfe;
          font-size: 13px;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .hero h1 {
          margin: 0;
          font-size: 48px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -1.6px;
        }

        .hero p {
          margin: 12px 0 0;
          color: #cbd5e1;
          font-size: 16px;
          line-height: 1.65;
          max-width: 800px;
        }

        .summaryGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .summaryCard {
          border-radius: 28px;
          padding: 22px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(14px);
        }

        .summaryCard.highlight {
          background:
            linear-gradient(135deg, rgba(37,99,235,0.24), rgba(15,23,42,0.76));
          border-color: rgba(96,165,250,0.28);
        }

        .summaryIcon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          color: #93c5fd;
        }

        .summaryCard span {
          display: block;
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 900;
          margin-bottom: 6px;
        }

        .summaryCard strong {
          display: block;
          font-size: 20px;
          font-weight: 950;
          margin-bottom: 8px;
        }

        .summaryCard p {
          margin: 0;
          color: #cbd5e1;
          line-height: 1.6;
          font-size: 14px;
        }

        .mainCard,
        .whyCard,
        .comebackCard {
          background: rgba(15,23,42,0.74);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 32px;
          padding: 28px;
          backdrop-filter: blur(14px);
          margin-bottom: 24px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.18);
        }

        .sectionHeader {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 22px;
        }

        .sectionHeader > svg {
          color: #facc15;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .sectionHeader h2,
        .whyTop h2,
        .comebackCard h2 {
          margin: 0;
          font-size: 29px;
          line-height: 1.12;
          font-weight: 950;
          letter-spacing: -0.6px;
        }

        .sectionHeader p {
          margin: 7px 0 0;
          color: #94a3b8;
          line-height: 1.55;
        }

        .oneXTwoGrid,
        .groupScoring {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .choiceCard,
        .scoreLine {
          border-radius: 24px;
          padding: 22px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
        }

        .choiceCard:hover,
        .scoreLine:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.06);
        }

        .choiceCard span {
          width: 48px;
          height: 48px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 950;
          margin-bottom: 14px;
          background: rgba(255,255,255,0.1);
        }

        .choiceCard h3 {
          margin: 0 0 8px;
          font-size: 21px;
          font-weight: 950;
        }

        .choiceCard p {
          margin: 0;
          color: #cbd5e1;
          line-height: 1.5;
        }

        .choiceCard.home {
          border-color: rgba(34,197,94,0.28);
          background: rgba(34,197,94,0.08);
        }

        .choiceCard.draw {
          border-color: rgba(250,204,21,0.28);
          background: rgba(250,204,21,0.08);
        }

        .choiceCard.away {
          border-color: rgba(59,130,246,0.28);
          background: rgba(59,130,246,0.08);
        }

        .pointsBanner {
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 22px;
          padding: 18px 20px;
          background:
            linear-gradient(135deg, rgba(250,204,21,0.16), rgba(37,99,235,0.14));
          border: 1px solid rgba(250,204,21,0.2);
        }

        .pointsBanner strong {
          color: #fef3c7;
          font-size: 26px;
          font-weight: 950;
          white-space: nowrap;
        }

        .pointsBanner span {
          color: #dbeafe;
          font-weight: 800;
        }

        .rulesGrid,
        .bonusGrid,
        .specialGrid {
          display: grid;
          gap: 18px;
        }

        .rulesGrid,
        .bonusGrid,
        .specialGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .ruleCard,
        .bonusItem,
        .specialItem {
          border-radius: 26px;
          padding: 22px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
        }

        .ruleCard:hover,
        .bonusItem:hover,
        .specialItem:hover {
          transform: translateY(-3px);
          border-color: rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.06);
        }

        .ruleCard.exact {
          border-color: rgba(250,204,21,0.34);
          background: rgba(250,204,21,0.08);
        }

        .ruleCard.winner {
          border-color: rgba(34,197,94,0.34);
          background: rgba(34,197,94,0.08);
        }

        .ruleTop,
        .bonusTop {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.08);
          font-size: 14px;
          font-weight: 950;
          margin-bottom: 16px;
        }

        .ruleCard h3,
        .bonusItem h3,
        .specialItem h3,
        .tieCard h3 {
          margin: 0 0 10px;
          font-size: 23px;
          line-height: 1.15;
          font-weight: 950;
          letter-spacing: -0.3px;
        }

        .ruleCard p,
        .specialItem p,
        .tieCard p {
          margin: 0 0 18px;
          color: #cbd5e1;
          line-height: 1.6;
        }

        .tieCard {
          display: flex;
          gap: 16px;
          margin-top: 18px;
          border-radius: 26px;
          padding: 22px;
          background:
            linear-gradient(135deg, rgba(59,130,246,0.14), rgba(2,6,23,0.38));
          border: 1px solid rgba(96,165,250,0.22);
        }

        .tieIcon {
          width: 50px;
          height: 50px;
          border-radius: 18px;
          background: rgba(59,130,246,0.18);
          color: #93c5fd;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tieCard strong {
          color: #fef3c7;
        }

        .tieExample {
          display: inline-flex;
          flex-direction: column;
          gap: 5px;
          border-radius: 18px;
          padding: 14px 16px;
          background: rgba(2,6,23,0.38);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .tieExample span {
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 900;
        }

        .example {
          background: rgba(2,6,23,0.45);
          border-radius: 18px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .example strong,
        .exampleWide strong {
          display: block;
          margin-bottom: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 12px;
        }

        .exampleMatch {
          font-size: 20px;
          font-weight: 950;
          margin-bottom: 12px;
        }

        .exampleResult {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 950;
          font-size: 14px;
        }

        .exampleResult.success {
          background: rgba(250,204,21,0.18);
          color: #fde68a;
        }

        .exampleResult.partial {
          background: rgba(34,197,94,0.18);
          color: #86efac;
        }

        .scoreLine strong {
          display: block;
          font-size: 25px;
          font-weight: 950;
          color: #fef3c7;
          margin-bottom: 6px;
        }

        .scoreLine span {
          display: block;
          color: #cbd5e1;
          line-height: 1.45;
        }

        .exampleWide {
          border-radius: 22px;
          padding: 20px;
          background:
            linear-gradient(135deg, rgba(37,99,235,0.16), rgba(2,6,23,0.36));
          border: 1px solid rgba(96,165,250,0.2);
        }

        .exampleWide p {
          margin: 0;
          color: #dbeafe;
          line-height: 1.65;
        }

        .exampleWide b {
          color: #fef3c7;
        }

        .bonusItem ul,
        .specialItem ul {
          margin: 14px 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 10px;
        }

        .bonusItem li,
        .specialItem li {
          color: #dbeafe;
          line-height: 1.5;
          background: rgba(2,6,23,0.34);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 12px 14px;
        }

        .bonusItem li strong,
        .specialItem li strong {
          color: #fef3c7;
        }

        .champion {
          border-color: rgba(250,204,21,0.34);
          background: rgba(250,204,21,0.08);
        }

        .finalists {
          border-color: rgba(59,130,246,0.34);
          background: rgba(59,130,246,0.08);
        }

        .scorer {
          border-color: rgba(34,197,94,0.32);
          background: rgba(34,197,94,0.08);
        }

        .player {
          border-color: rgba(168,85,247,0.32);
          background: rgba(168,85,247,0.08);
        }

        .revelation {
          border-color: rgba(249,115,22,0.34);
          background: rgba(249,115,22,0.08);
        }

        .disappointment {
          border-color: rgba(239,68,68,0.32);
          background: rgba(239,68,68,0.08);
        }

        .lockList {
          display: grid;
          gap: 10px;
        }

        .lockRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 18px;
          border-radius: 18px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .lockRow span {
          color: #cbd5e1;
          font-weight: 800;
        }

        .lockRow strong {
          color: #fef3c7;
          font-weight: 950;
          text-align: right;
        }

        .whyCard {
          background:
            linear-gradient(135deg, rgba(37,99,235,0.16), rgba(250,204,21,0.08)),
            rgba(15,23,42,0.78);
        }

        .whyTop {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .whyTop svg {
          color: #facc15;
        }

        .whyGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .whyItem {
          padding: 16px;
          border-radius: 18px;
          background: rgba(2,6,23,0.34);
          border: 1px solid rgba(255,255,255,0.06);
          color: #e2e8f0;
          font-weight: 900;
          text-align: center;
        }

        .comebackCard {
          display: flex;
          align-items: center;
          gap: 18px;
          background:
            linear-gradient(135deg, rgba(250,204,21,0.18), rgba(37,99,235,0.16)),
            rgba(15,23,42,0.78);
          border: 1px solid rgba(250,204,21,0.22);
        }

        .comebackIcon {
          width: 64px;
          height: 64px;
          border-radius: 24px;
          background: rgba(250,204,21,0.18);
          color: #fde68a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .comebackCard p {
          margin: 8px 0 0;
          color: #e2e8f0;
          line-height: 1.65;
          max-width: 850px;
        }

        @media (max-width: 1020px) {
          .summaryGrid,
          .oneXTwoGrid,
          .groupScoring,
          .whyGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 960px) {
          .rulesGrid,
          .bonusGrid,
          .specialGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .reglasPage {
            padding: 24px 12px 120px;
          }

          .hero {
            align-items: flex-start;
            gap: 14px;
          }

          .heroIcon {
            width: 62px;
            height: 62px;
            border-radius: 22px;
          }

          .hero h1 {
            font-size: 35px;
            letter-spacing: -1px;
          }

          .hero p {
            font-size: 15px;
          }

          .mainCard,
          .whyCard,
          .comebackCard {
            padding: 20px;
            border-radius: 26px;
          }

          .summaryCard,
          .ruleCard,
          .bonusItem,
          .specialItem,
          .choiceCard,
          .scoreLine {
            padding: 18px;
            border-radius: 22px;
          }

          .sectionHeader h2,
          .whyTop h2,
          .comebackCard h2 {
            font-size: 24px;
          }

          .ruleCard h3,
          .bonusItem h3,
          .specialItem h3,
          .tieCard h3 {
            font-size: 21px;
          }

          .exampleMatch {
            font-size: 18px;
          }

          .pointsBanner {
            align-items: flex-start;
            flex-direction: column;
          }

          .tieCard {
            flex-direction: column;
            padding: 18px;
          }

          .lockRow {
            align-items: flex-start;
            flex-direction: column;
            gap: 6px;
          }

          .lockRow strong {
            text-align: left;
          }

          .comebackCard {
            align-items: flex-start;
          }

          .comebackIcon {
            width: 54px;
            height: 54px;
            border-radius: 20px;
          }
        }
      `}</style>
    </main>
  );
}