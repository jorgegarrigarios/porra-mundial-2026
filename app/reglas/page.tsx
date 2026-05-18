import {
  Trophy,
  Target,
  CheckCircle2,
  MinusCircle,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function ReglasPage() {
  return (
    <main className="reglasPage">
      <div className="container">
        <section className="hero">
          <div className="heroIcon">
            <Trophy size={34} />
          </div>

          <div>
            <h1>Reglas y sistema de puntos</h1>

            <p>
              Aprende cómo funciona la puntuación de la porra y cómo conseguir
              más puntos en cada jornada del Mundial 2026.
            </p>
          </div>
        </section>

        <section className="mainCard">
          <div className="sectionHeader">
            <Target size={22} />

            <h2>Sistema actual de puntuación</h2>
          </div>

          <div className="rulesGrid">
            <article className="ruleCard exact">
              <div className="ruleTop">
                <Sparkles size={22} />
                <span>5 puntos</span>
              </div>

              <h3>Marcador exacto</h3>

              <p>
                Aciertas exactamente el resultado del partido.
              </p>

              <div className="example">
                <strong>Ejemplo</strong>

                <div className="exampleMatch">
                  España 2 - 1 Brasil
                </div>

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

              <h3>Ganador correcto</h3>

              <p>
                No aciertas el marcador exacto, pero sí el ganador o empate.
              </p>

              <div className="example">
                <strong>Ejemplo</strong>

                <div className="exampleMatch">
                  Argentina 3 - 1 Japón
                </div>

                <div className="exampleResult partial">
                  Tu pronóstico: 2 - 0
                </div>
              </div>
            </article>

            <article className="ruleCard diff">
              <div className="ruleTop">
                <MinusCircle size={22} />
                <span>1 punto</span>
              </div>

              <h3>Diferencia de goles</h3>

              <p>
                Aciertas la diferencia de goles, aunque no el ganador exacto.
              </p>

              <div className="example">
                <strong>Ejemplo</strong>

                <div className="exampleMatch">
                  Francia 2 - 1 México
                </div>

                <div className="exampleResult neutral">
                  Tu pronóstico: 3 - 2
                </div>
              </div>
            </article>

            <article className="ruleCard fail">
              <div className="ruleTop">
                <ShieldCheck size={22} />
                <span>0 puntos</span>
              </div>

              <h3>Pronóstico incorrecto</h3>

              <p>
                No aciertas ni el resultado, ni el ganador, ni la diferencia.
              </p>

              <div className="example">
                <strong>Ejemplo</strong>

                <div className="exampleMatch">
                  Alemania 1 - 0 USA
                </div>

                <div className="exampleResult failResult">
                  Tu pronóstico: 0 - 2
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="futureCard">
          <div className="futureTop">
            <Sparkles size={24} />

            <h2>Configuración personalizada de ligas</h2>
          </div>

          <p>
            Próximamente, los creadores de ligas podrán personalizar el sistema
            de puntuación:
          </p>

          <div className="futureGrid">
            <div className="futureItem">
              Cambiar puntos por marcador exacto
            </div>

            <div className="futureItem">
              Activar bonus especiales
            </div>

            <div className="futureItem">
              Configurar reglas propias
            </div>

            <div className="futureItem">
              Sistema competitivo avanzado
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .reglasPage {
          min-height: 100vh;
          padding: 32px 16px 120px;
          background:
            radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 30%),
            linear-gradient(180deg, #020617 0%, #0f172a 100%);
          color: white;
        }

        .container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .hero {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 28px;
        }

        .heroIcon {
          width: 72px;
          height: 72px;
          border-radius: 24px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 40px rgba(37,99,235,0.45);
          flex-shrink: 0;
        }

        .hero h1 {
          margin: 0;
          font-size: 44px;
          font-weight: 900;
        }

        .hero p {
          margin-top: 8px;
          color: #94a3b8;
          font-size: 16px;
          line-height: 1.6;
          max-width: 720px;
        }

        .mainCard,
        .futureCard {
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 32px;
          padding: 28px;
          backdrop-filter: blur(14px);
        }

        .mainCard {
          margin-bottom: 26px;
        }

        .sectionHeader,
        .futureTop {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }

        .sectionHeader h2,
        .futureTop h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
        }

        .rulesGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .ruleCard {
          border-radius: 26px;
          padding: 22px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          transition: 0.25s ease;
        }

        .ruleCard:hover {
          transform: translateY(-3px);
        }

        .ruleCard.exact {
          border-color: rgba(250,204,21,0.34);
          background: rgba(250,204,21,0.08);
        }

        .ruleCard.winner {
          border-color: rgba(34,197,94,0.34);
          background: rgba(34,197,94,0.08);
        }

        .ruleCard.diff {
          border-color: rgba(59,130,246,0.34);
          background: rgba(59,130,246,0.08);
        }

        .ruleCard.fail {
          border-color: rgba(239,68,68,0.28);
          background: rgba(239,68,68,0.08);
        }

        .ruleTop {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 999px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.08);
          font-size: 14px;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .ruleCard h3 {
          margin: 0 0 10px;
          font-size: 24px;
          font-weight: 900;
        }

        .ruleCard p {
          margin: 0 0 18px;
          color: #cbd5e1;
          line-height: 1.6;
        }

        .example {
          background: rgba(2,6,23,0.45);
          border-radius: 18px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .example strong {
          display: block;
          margin-bottom: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 12px;
        }

        .exampleMatch {
          font-size: 20px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .exampleResult {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 900;
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

        .exampleResult.neutral {
          background: rgba(59,130,246,0.18);
          color: #93c5fd;
        }

        .failResult {
          background: rgba(239,68,68,0.18);
          color: #fca5a5;
        }

        .futureCard p {
          color: #cbd5e1;
          margin-bottom: 18px;
          line-height: 1.7;
        }

        .futureGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .futureItem {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 18px;
          font-weight: 800;
          color: #e2e8f0;
        }

        @media (max-width: 900px) {
          .rulesGrid,
          .futureGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .reglasPage {
            padding: 24px 12px 120px;
          }

          .hero {
            align-items: flex-start;
          }

          .hero h1 {
            font-size: 34px;
          }

          .heroIcon {
            width: 64px;
            height: 64px;
            border-radius: 20px;
          }

          .mainCard,
          .futureCard {
            padding: 20px;
            border-radius: 26px;
          }

          .ruleCard {
            padding: 18px;
          }

          .ruleCard h3 {
            font-size: 22px;
          }

          .exampleMatch {
            font-size: 18px;
          }
        }
      `}</style>
    </main>
  );
}