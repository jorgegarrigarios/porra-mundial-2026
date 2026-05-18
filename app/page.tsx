import Link from "next/link";

import {
  Trophy,
  Star,
  CalendarDays,
  TrendingUp,
  Target,
  Crown,
  ArrowRight,
  Zap,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

export default function Home() {
  return (
    <main className="home">
      <section className="hero">
        <div className="stadium" />
        <div className="overlay" />

        <div className="heroContent">
          <div>
            <p className="eyebrow">La mejor porra del Mundial</p>

            <h1 className="heroTitle">
              Porra Mundial
              <br />
              <span>2026</span>
            </h1>

            <p className="heroText">
              Compite con tus amigos, haz tus pronósticos y demuestra quién sabe
              más de fútbol.
            </p>

            <div className="buttonRow">
              <Link href="/partidos" className="primaryButton">
                <CalendarDays size={20} />
                Ver Partidos
              </Link>

              <Link href="/mis-pronosticos" className="secondaryButton">
                <Target size={20} />
                Hacer Pronósticos
              </Link>
            </div>
          </div>

          <div className="logoWrap">
            <img
              src="/worldcup-logo.png"
              alt="Mundial 2026"
              className="worldLogo"
            />
          </div>
        </div>
      </section>

      <section className="contentWrap">
        <div className="statsGrid">
          <StatCard icon={<Trophy size={28} />} title="Mi posición" value="3º" detail="de 12 participantes" color="#2563eb" />
          <StatCard icon={<Star size={28} />} title="Mis puntos" value="245" detail="puntos totales" color="#16a34a" />
          <StatCard icon={<CalendarDays size={28} />} title="Partidos jugados" value="18" detail="de 64" color="#7c3aed" />
          <StatCard icon={<TrendingUp size={28} />} title="Acierto" value="68%" detail="promedio general" color="#f59e0b" />
        </div>

        <h2 className="sectionTitle">Accesos rápidos</h2>

        <div className="quickGrid">
          <QuickCard href="/partidos" icon={<CalendarDays size={36} />} title="Ver Partidos" text="Consulta todos los partidos del Mundial 2026." color="#2563eb" />
          <QuickCard href="/mis-pronosticos" icon={<Target size={36} />} title="Hacer Pronósticos" text="Realiza tus predicciones y suma puntos." color="#16a34a" />
          <QuickCard href="/ranking" icon={<Crown size={36} />} title="Ver Ranking" text="Compite por el primer puesto." color="#eab308" />
        </div>

        <h2 className="sectionTitle">Próximo partido destacado</h2>

        <div className="featuredMatch">
          <div className="matchMain">
            <Team code="ar" name="Argentina" />

            <div className="matchCenter">
              <div className="matchBadge">Fase de grupos · Grupo A</div>
              <p className="muted">Jue 12 Jun 2026</p>
              <p className="matchTime">21:00</p>
              <p className="vs">VS</p>
              <p className="muted">MetLife Stadium</p>
            </div>

            <Team code="mx" name="México" />
          </div>

          <div className="matchAside">
            <h3>¿Ya hiciste tu pronóstico?</h3>
            <p>Acumula puntos y sube posiciones en el ranking.</p>

            <Link href="/mis-pronosticos" className="primaryButton">
              <Target size={20} />
              Hacer Pronóstico
            </Link>
          </div>
        </div>

        <div className="bottomGrid">
          <div className="panel">
            <h2 className="panelTitle">
              <Trophy size={24} color="#facc15" />
              Top 5 del ranking
            </h2>

            {[
              ["1", "Diego", "312 pts"],
              ["2", "María", "278 pts"],
              ["3", "Jorge", "245 pts"],
              ["4", "Carlos", "231 pts"],
              ["5", "Ana", "211 pts"],
            ].map(([pos, name, points]) => (
              <div
                key={pos}
                className={`rankingRow ${name === "Jorge" ? "activeRow" : ""}`}
              >
                <span className="positionCircle">{pos}</span>
                <span className="rankingName">{name}</span>
                <span className="rankingPoints">{points}</span>
              </div>
            ))}

            <Link href="/ranking" className="outlineButton">
              Ver ranking completo
            </Link>
          </div>

          <div className="panel">
            <h2 className="panelTitle">
              <Zap size={24} color="#facc15" />
              Actividad reciente
            </h2>

            <Activity icon={<CheckCircle2 size={22} />} color="#16a34a" text="¡Buen acierto! Predijiste correctamente Brasil 2 - 1 Colombia" time="Hace 2 horas" />
            <Activity icon={<Star size={22} />} color="#7c3aed" text="Sumaste 15 puntos por tu pronóstico en España 3 - 0 Japón" time="Hace 1 día" />
            <Activity icon={<CalendarDays size={22} />} color="#2563eb" text="Realizaste pronósticos para 8 partidos de la jornada" time="Hace 2 días" />
            <Activity icon={<BarChart3 size={22} />} color="#f59e0b" text="Subiste al puesto 3 en el ranking" time="Hace 2 días" />

            <Link href="/ranking" className="outlineButton">
              Ver todas las actividades
            </Link>
          </div>
        </div>

        <div className="finalBanner">
          <div className="finalText">
            <div className="bigBlueIcon">
              <Trophy size={34} />
            </div>

            <div>
              <h2>¡Compite, diviértete y gana!</h2>
              <p>La Porra Mundial 2026 te espera.</p>
            </div>
          </div>

          <Link href="/mis-pronosticos" className="primaryButton">
            <Target size={20} />
            Hacer mis pronósticos
          </Link>
        </div>
      </section>

      <style>{`
        .home {
          min-height: 100vh;
          background: #020617;
          color: white;
        }

        .hero {
          position: relative;
          min-height: 88vh;
          overflow: hidden;
        }

        .stadium {
          position: absolute;
          inset: 0;
          background-image: url('/stadium.jpg');
          background-size: cover;
          background-position: center;
          filter: brightness(0.42);
          transform: scale(1.03);
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.68) 42%, rgba(2,6,23,0.18) 100%);
        }

        .heroContent {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
          padding: 90px 24px 40px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          align-items: center;
          gap: 50px;
        }

        .eyebrow {
          color: #3b82f6;
          font-weight: 900;
          letter-spacing: 5px;
          text-transform: uppercase;
          margin-bottom: 26px;
          font-size: 14px;
        }

        .heroTitle {
          font-size: 96px;
          line-height: 0.9;
          font-weight: 900;
          margin: 0;
        }

        .heroTitle span {
          color: #2563eb;
        }

        .heroText {
          margin-top: 28px;
          color: #d1d5db;
          font-size: 24px;
          line-height: 1.6;
          max-width: 650px;
        }

        .buttonRow {
          display: flex;
          gap: 18px;
          margin-top: 42px;
        }

        .primaryButton,
        .secondaryButton {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          padding: 16px 26px;
          border-radius: 16px;
          color: white;
          text-decoration: none;
          font-weight: 900;
          font-size: 17px;
        }

        .primaryButton {
          background: #2563eb;
        }

        .secondaryButton {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
        }

        .logoWrap {
          display: flex;
          justify-content: center;
        }

        .worldLogo {
          width: 100%;
          max-width: 560px;
          object-fit: contain;
          filter: drop-shadow(0 0 55px rgba(255,215,0,0.38));
        }

        .contentWrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px 90px;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-top: -70px;
          position: relative;
          z-index: 3;
        }

        .statCard {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(15,23,42,0.82);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(18px);
          border-radius: 24px;
          padding: 22px;
        }

        .iconBox {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .statLabel {
          color: #cbd5e1;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .statValue {
          font-size: 34px;
          font-weight: 900;
          margin-top: 4px;
        }

        .statDetail {
          color: #94a3b8;
          font-size: 14px;
        }

        .sectionTitle {
          font-size: 30px;
          font-weight: 900;
          margin-top: 38px;
          margin-bottom: 22px;
        }

        .quickGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .quickCard {
          background: linear-gradient(145deg, rgba(15,23,42,0.95), rgba(15,23,42,0.55));
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 28px;
          padding: 30px;
          min-height: 210px;
        }

        .quickIcon {
          width: 68px;
          height: 68px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .featuredMatch {
          display: grid;
          grid-template-columns: 1fr 290px;
          border: 1px solid rgba(37,99,235,0.75);
          border-radius: 24px;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(37,99,235,0.22), rgba(15,23,42,0.7));
        }

        .matchMain {
          padding: 30px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 24px;
        }

        .matchCenter {
          text-align: center;
        }

        .matchBadge {
          display: inline-block;
          background: rgba(255,255,255,0.10);
          color: #e5e7eb;
          border-radius: 10px;
          padding: 8px 14px;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 13px;
        }

        .muted {
          color: #cbd5e1;
          margin-top: 12px;
        }

        .matchTime {
          font-size: 42px;
          font-weight: 900;
          margin: 6px 0;
        }

        .vs {
          color: #2563eb;
          font-weight: 900;
          font-size: 22px;
        }

        .matchAside {
          border-left: 1px solid rgba(255,255,255,0.12);
          padding: 30px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 16px;
        }

        .matchAside h3 {
          font-size: 22px;
          font-weight: 900;
        }

        .matchAside p {
          color: #cbd5e1;
          line-height: 1.6;
        }

        .flagCircle {
          width: 96px;
          height: 96px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          border: 2px solid rgba(255,255,255,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          overflow: hidden;
        }

        .flagCircle img {
          width: 72px;
          height: 72px;
          border-radius: 999px;
          object-fit: cover;
        }

        .team {
          text-align: center;
        }

        .teamName {
          font-size: 20px;
          font-weight: 900;
          margin-top: 12px;
        }

        .bottomGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }

        .panel {
          background: rgba(15,23,42,0.82);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
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

        .rankingRow {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border-radius: 14px;
          margin-top: 8px;
          background: rgba(255,255,255,0.04);
        }

        .activeRow {
          background: rgba(37,99,235,0.34);
        }

        .positionCircle {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          background: rgba(255,255,255,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }

        .rankingName {
          font-weight: 800;
        }

        .rankingPoints {
          margin-left: auto;
          color: #dbeafe;
        }

        .activityRow {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.04);
          border-radius: 14px;
          padding: 14px;
          margin-top: 10px;
        }

        .smallIcon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activityText {
          color: #e5e7eb;
          line-height: 1.5;
        }

        .activityTime {
          margin-left: auto;
          color: #94a3b8;
          white-space: nowrap;
        }

        .outlineButton {
          display: block;
          margin-top: 18px;
          text-align: center;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(37,99,235,0.75);
          color: #3b82f6;
          text-decoration: none;
          font-weight: 900;
        }

        .finalBanner {
          margin-top: 24px;
          background: linear-gradient(135deg, rgba(37,99,235,0.22), rgba(15,23,42,0.9));
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          padding: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .finalText {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .finalText h2 {
          font-size: 26px;
          font-weight: 900;
        }

        .finalText p {
          color: #cbd5e1;
          margin-top: 6px;
        }

        .bigBlueIcon {
          width: 72px;
          height: 72px;
          border-radius: 24px;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        @media (max-width: 900px) {
          .hero {
            min-height: auto;
          }

          .heroContent {
            grid-template-columns: 1fr;
            padding: 56px 20px 90px;
            text-align: center;
          }

          .heroTitle {
            font-size: 58px;
          }

          .heroText {
            font-size: 18px;
            margin-left: auto;
            margin-right: auto;
          }

          .buttonRow {
            flex-direction: column;
          }

          .primaryButton,
          .secondaryButton {
            width: 100%;
          }

          .worldLogo {
            max-width: 280px;
          }

          .statsGrid {
            grid-template-columns: 1fr 1fr;
            margin-top: -46px;
          }

          .quickGrid {
            grid-template-columns: 1fr;
          }

          .featuredMatch {
            grid-template-columns: 1fr;
          }

          .matchMain {
            grid-template-columns: 1fr;
          }

          .matchAside {
            border-left: none;
            border-top: 1px solid rgba(255,255,255,0.12);
          }

          .bottomGrid {
            grid-template-columns: 1fr;
          }

          .finalBanner {
            flex-direction: column;
            align-items: stretch;
          }

          .finalText {
            align-items: flex-start;
          }
        }

        @media (max-width: 520px) {
          .heroTitle {
            font-size: 44px;
          }

          .eyebrow {
            font-size: 11px;
            letter-spacing: 3px;
          }

          .statsGrid {
            grid-template-columns: 1fr;
          }

          .statCard {
            padding: 18px;
          }

          .sectionTitle {
            font-size: 26px;
          }

          .activityRow {
            align-items: flex-start;
          }

          .activityTime {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}

function StatCard({
  icon,
  title,
  value,
  detail,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="statCard">
      <div className="iconBox" style={{ background: color }}>{icon}</div>
      <div>
        <p className="statLabel">{title}</p>
        <p className="statValue">{value}</p>
        <p className="statDetail">{detail}</p>
      </div>
    </div>
  );
}

function QuickCard({
  href,
  icon,
  title,
  text,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  color: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "white" }}>
      <div className="quickCard">
        <div className="quickIcon" style={{ background: color }}>{icon}</div>
        <h3 style={{ fontSize: "26px", fontWeight: 900, marginTop: "24px" }}>
          {title}
        </h3>
        <p style={{ color: "#cbd5e1", marginTop: "12px", lineHeight: 1.6 }}>
          {text}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <ArrowRight size={30} />
        </div>
      </div>
    </Link>
  );
}

function Team({ code, name }: { code: string; name: string }) {
  return (
    <div className="team">
      <div className="flagCircle">
        <img src={`https://flagcdn.com/w160/${code}.png`} alt={name} />
      </div>
      <p className="teamName">{name}</p>
    </div>
  );
}

function Activity({
  icon,
  color,
  text,
  time,
}: {
  icon: React.ReactNode;
  color: string;
  text: string;
  time: string;
}) {
  return (
    <div className="activityRow">
      <div className="smallIcon" style={{ background: color }}>{icon}</div>
      <p className="activityText">{text}</p>
      <span className="activityTime">{time}</span>
    </div>
  );
}