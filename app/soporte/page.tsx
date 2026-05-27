import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Bug,
  HelpCircle,
  LifeBuoy,
  Lightbulb,
  Mail,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

const EMAIL_SOPORTE = "soporte@porrafutbol.futbol";

const asunto = "Soporte Porra Mundial 2026";
const cuerpo = `Hola equipo de Porra Mundial 2026,

Necesito ayuda con:

- Email de mi cuenta:
- Liga afectada, si aplica:
- Código de liga, si aplica:
- Qué problema o petición tengo:
- Captura o detalle adicional:

Gracias.`;

const mailtoSoporte = `mailto:${EMAIL_SOPORTE}?subject=${encodeURIComponent(
  asunto
)}&body=${encodeURIComponent(cuerpo)}`;

const motivos = [
  {
    icon: <ShieldCheck size={24} />,
    title: "Problemas para entrar",
    text: "Login, registro, confirmación de email o recuperación de contraseña.",
  },
  {
    icon: <Users size={24} />,
    title: "Problemas con una liga",
    text: "No puedes unirte, no ves tu liga o el código de invitación no funciona.",
  },
  {
    icon: <Trophy size={24} />,
    title: "Ranking o puntos",
    text: "Puntos que no cuadran, resultados pendientes o clasificación incorrecta.",
  },
  {
    icon: <Bug size={24} />,
    title: "Error técnico",
    text: "Pantalla bloqueada, carga infinita, error visual o problema en móvil.",
  },
  {
    icon: <Lightbulb size={24} />,
    title: "Sugerencias",
    text: "Ideas para mejorar la porra, nuevas funciones o mejoras de experiencia.",
  },
  {
    icon: <AlertCircle size={24} />,
    title: "Otros casos",
    text: "Cualquier petición importante relacionada con la Porra Mundial 2026.",
  },
];

export default function SoportePage() {
  return (
    <main className="supportPage">
      <section className="supportHero">
        <div className="heroGlow" />

        <Link href="/" className="backLink">
          <ArrowLeft size={18} />
          Volver al inicio
        </Link>

        <div className="heroIcon">
          <LifeBuoy size={42} />
        </div>

        <p className="eyebrow">Soporte</p>
        <h1>¿Necesitas ayuda?</h1>
        <p className="heroText">
          Si tienes algún problema con tu cuenta, una liga, tus pronósticos o el
          ranking, escríbenos y revisaremos tu caso lo antes posible.
        </p>

        <div className="mainActions">
          <a href={mailtoSoporte} className="primaryButton">
            <Mail size={20} />
            Contactar con soporte
          </a>

          <a href={`mailto:${EMAIL_SOPORTE}`} className="secondaryButton">
            {EMAIL_SOPORTE}
          </a>
        </div>
      </section>

      <section className="contentWrap">
        <div className="infoPanel">
          <div>
            <div className="panelIcon">
              <HelpCircle size={24} />
            </div>
          </div>

          <div>
            <h2>Para ayudarte más rápido</h2>
            <p>
              Incluye en el email tu cuenta, el nombre o código de la liga si el
              problema está relacionado con una competición, y una breve
              explicación de lo que ha ocurrido. Si puedes añadir una captura,
              mejor.
            </p>
          </div>
        </div>

        <h2 className="sectionTitle">Motivos habituales</h2>

        <div className="reasonGrid">
          {motivos.map((motivo) => (
            <article key={motivo.title} className="reasonCard">
              <div className="reasonIcon">{motivo.icon}</div>
              <h3>{motivo.title}</h3>
              <p>{motivo.text}</p>
            </article>
          ))}
        </div>

        <section className="finalPanel">
          <div>
            <p className="eyebrow">Consejo</p>
            <h2>Si el problema es urgente, envía el máximo detalle posible</h2>
            <p>
              Por ejemplo: dispositivo, navegador, pantalla donde ocurre, código
              de liga y qué estabas intentando hacer.
            </p>
          </div>

          <a href={mailtoSoporte} className="primaryButton compactButton">
            <Mail size={20} />
            Enviar email
          </a>
        </section>
      </section>

      <style>{`
        .supportPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% 0%, rgba(37,99,235,0.28), transparent 34%),
            radial-gradient(circle at 18% 24%, rgba(250,204,21,0.10), transparent 26%),
            linear-gradient(180deg, #020617 0%, #07111f 48%, #111827 100%);
          color: white;
          padding: 42px 16px 120px;
        }

        .supportHero {
          position: relative;
          overflow: hidden;
          width: min(100%, 960px);
          margin: 0 auto;
          border-radius: 34px;
          border: 1px solid rgba(255,255,255,0.12);
          background:
            linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.72)),
            radial-gradient(circle at top right, rgba(37,99,235,0.22), transparent 38%);
          box-shadow: 0 32px 100px rgba(0,0,0,0.30);
          padding: 34px;
          text-align: center;
        }

        .heroGlow {
          position: absolute;
          width: 280px;
          height: 280px;
          right: -110px;
          top: -130px;
          border-radius: 999px;
          background: rgba(250,204,21,0.16);
          filter: blur(20px);
          pointer-events: none;
        }

        .backLink,
        .heroIcon,
        .eyebrow,
        .supportHero h1,
        .heroText,
        .mainActions {
          position: relative;
          z-index: 1;
        }

        .backLink {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #bfdbfe;
          text-decoration: none;
          font-weight: 900;
          margin-bottom: 24px;
        }

        .heroIcon {
          width: 88px;
          height: 88px;
          border-radius: 30px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fef3c7;
          background: linear-gradient(135deg, rgba(37,99,235,0.36), rgba(250,204,21,0.16));
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 20px 60px rgba(37,99,235,0.20);
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #93c5fd;
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .supportHero h1 {
          margin: 0;
          font-size: clamp(44px, 8vw, 76px);
          line-height: 0.95;
          font-weight: 950;
          letter-spacing: -0.065em;
        }

        .heroText {
          max-width: 720px;
          margin: 20px auto 0;
          color: #cbd5e1;
          font-size: 19px;
          line-height: 1.6;
          font-weight: 750;
        }

        .mainActions {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 28px;
        }

        .primaryButton,
        .secondaryButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 56px;
          border-radius: 18px;
          padding: 15px 22px;
          color: white;
          text-decoration: none;
          font-weight: 950;
          font-size: 16px;
        }

        .primaryButton {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 18px 44px rgba(37,99,235,0.30);
        }

        .secondaryButton {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: #dbeafe;
        }

        .contentWrap {
          width: min(100%, 1120px);
          margin: 28px auto 0;
        }

        .infoPanel,
        .finalPanel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          border: 1px solid rgba(96,165,250,0.22);
          background: linear-gradient(135deg, rgba(37,99,235,0.18), rgba(15,23,42,0.82));
          border-radius: 28px;
          padding: 26px;
        }

        .panelIcon {
          width: 56px;
          height: 56px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(37,99,235,0.22);
          color: #bfdbfe;
          border: 1px solid rgba(96,165,250,0.28);
          flex-shrink: 0;
        }

        .infoPanel h2,
        .finalPanel h2 {
          margin: 0;
          font-size: 28px;
          line-height: 1.1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .infoPanel p,
        .finalPanel p {
          margin: 10px 0 0;
          color: #cbd5e1;
          line-height: 1.6;
          font-weight: 750;
        }

        .sectionTitle {
          font-size: 31px;
          font-weight: 950;
          margin: 34px 0 20px;
          letter-spacing: -0.03em;
        }

        .reasonGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .reasonCard {
          background: linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.62));
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 26px;
          padding: 22px;
          box-shadow: 0 22px 70px rgba(0,0,0,0.18);
        }

        .reasonIcon {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(37,99,235,0.18);
          color: #bfdbfe;
          border: 1px solid rgba(96,165,250,0.24);
        }

        .reasonCard h3 {
          margin: 16px 0 0;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.02em;
        }

        .reasonCard p {
          margin: 9px 0 0;
          color: #cbd5e1;
          line-height: 1.55;
          font-weight: 700;
        }

        .finalPanel {
          margin-top: 28px;
        }

        .compactButton {
          flex-shrink: 0;
        }

        @media (max-width: 860px) {
          .supportPage {
            padding: 30px 14px 110px;
          }

          .supportHero {
            border-radius: 28px;
            padding: 26px 20px;
          }

          .supportHero h1 {
            font-size: clamp(40px, 11vw, 58px);
          }

          .heroText {
            font-size: 17px;
          }

          .mainActions {
            flex-direction: column;
          }

          .primaryButton,
          .secondaryButton {
            width: 100%;
          }

          .infoPanel,
          .finalPanel {
            align-items: flex-start;
            flex-direction: column;
            border-radius: 24px;
            padding: 22px;
          }

          .reasonGrid {
            grid-template-columns: 1fr;
          }

          .compactButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
