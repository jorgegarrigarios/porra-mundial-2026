"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Trophy,
  CalendarDays,
  TrendingUp,
  Target,
  Crown,
  ArrowRight,
  Zap,
  CheckCircle2,
  Users,
  Shield,
  Flag,
  Award,
  Lock,
  Sparkles,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type HomeStats = {
  partidos: number | null;
  participantes: number | null;
  pronosticos: number | null;
  ligasActivas: number | null;
};

type PartidoDestacado = {
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
};

export default function Home() {
  const [stats, setStats] = useState<HomeStats>({
    partidos: null,
    participantes: null,
    pronosticos: null,
    ligasActivas: null,
  });

  const [partidoDestacado, setPartidoDestacado] =
    useState<PartidoDestacado | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatosHome();
  }, []);

  async function cargarDatosHome() {
    setLoading(true);

    try {
      const [
        partidosResponse,
        participantesResponse,
        pronosticosResponse,
        ligasResponse,
        proximoPartidoResponse,
      ] = await Promise.all([
        supabase.from("partidos").select("*", { count: "exact", head: true }),
        supabase
          .from("participantes")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("pronosticos")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("ligas")
          .select("*", { count: "exact", head: true })
          .eq("estado", "activa"),
        supabase
          .from("partidos")
          .select(
            "id, local, visitante, local_code, visitante_code, fecha_inicio, estadio, ciudad, grupo, fase"
          )
          .gte("fecha_inicio", new Date().toISOString())
          .order("fecha_inicio", { ascending: true, nullsFirst: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setStats({
        partidos: partidosResponse.count ?? 0,
        participantes: participantesResponse.count ?? 0,
        pronosticos: pronosticosResponse.count ?? 0,
        ligasActivas: ligasResponse.count ?? 0,
      });

      setPartidoDestacado(proximoPartidoResponse.data ?? null);
    } catch (error) {
      console.error("Error cargando datos de inicio:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatearFecha(fechaInicio: string | null) {
    if (!fechaInicio) return "Fecha pendiente";

    const fecha = new Date(fechaInicio);

    if (Number.isNaN(fecha.getTime())) return "Fecha pendiente";

    return fecha.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatearHora(fechaInicio: string | null) {
    if (!fechaInicio) return "--:--";

    const fecha = new Date(fechaInicio);

    if (Number.isNaN(fecha.getTime())) return "--:--";

    return fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function valorStat(valor: number | null) {
    if (loading) return "…";
    return valor !== null ? valor.toString() : "0";
  }

  return (
    <main className="home">
      <section className="hero">
        <div className="stadium" />
        <div className="overlay" />

        <div className="heroContent">
          <div>
            <p className="eyebrow">Porra Mundial 2026 · V1.2 Beta</p>

            <h1 className="heroTitle">
              Compite con tus amigos
              <br />
              <span>en el Mundial</span>
            </h1>

            <p className="heroText">
              Crea una liga privada, haz tus pronósticos, elige tus bonus y
              demuestra quién sabe más de fútbol durante todo el Mundial 2026.
            </p>

            <div className="buttonRow">
              <Link href="/ligas" className="primaryButton">
                <Users size={20} />
                Crear o unirme a una liga
              </Link>

              <Link href="/mis-pronosticos" className="secondaryButton">
                <Target size={20} />
                Hacer mi porra
              </Link>
            </div>

            <div className="heroBadges">
              <span>
                <Lock size={15} />
                Ligas privadas
              </span>
              <span>
                <Flag size={15} />
                Grupos 1X2
              </span>
              <span>
                <Award size={15} />
                Bonus oficiales
              </span>
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
          <StatCard
            icon={<CalendarDays size={28} />}
            title="Partidos cargados"
            value={valorStat(stats.partidos)}
            detail="calendario del Mundial"
            color="#2563eb"
          />

          <StatCard
            icon={<Users size={28} />}
            title="Participantes"
            value={valorStat(stats.participantes)}
            detail="usuarios registrados"
            color="#16a34a"
          />

          <StatCard
            icon={<Target size={28} />}
            title="Pronósticos"
            value={valorStat(stats.pronosticos)}
            detail="predicciones de partidos"
            color="#7c3aed"
          />

          <StatCard
            icon={<Trophy size={28} />}
            title="Ligas activas"
            value={valorStat(stats.ligasActivas)}
            detail="competiciones privadas"
            color="#f59e0b"
          />
        </div>

        <section className="versionPanel">
          <div>
            <div className="versionEyebrow">
              <Sparkles size={16} />
              Versión actual
            </div>

            <h2>V1.2 Beta preparada para ligas privadas</h2>

            <p>
              Una sola porra por usuario que cuenta en todas sus ligas:
              pronósticos de partidos, clasificados de grupo y bonus oficiales.
            </p>
          </div>

          <Link href="/reglas" className="outlineButton compact">
            Ver reglas
          </Link>
        </section>

        <h2 className="sectionTitle">Completa tu porra</h2>

        <div className="quickGrid">
          <QuickCard
            href="/mis-pronosticos"
            icon={<Target size={36} />}
            title="Partidos"
            text="En fase de grupos pronosticas 1X2. En eliminatorias, marcador exacto."
            color="#2563eb"
          />

          <QuickCard
            href="/grupos"
            icon={<Flag size={36} />}
            title="Clasificados de grupo"
            text="Elige las dos selecciones que crees que pasarán de cada grupo."
            color="#16a34a"
          />

          <QuickCard
            href="/bonus"
            icon={<Award size={36} />}
            title="Bonus oficiales"
            text="Campeón, finalistas, Bota de Oro, MVP, mejor portero, revelación y decepción."
            color="#7c3aed"
          />

          <QuickCard
            href="/ligas"
            icon={<Users size={36} />}
            title="Mis ligas"
            text="Crea una liga privada, únete con un código y compite con tus amigos."
            color="#f59e0b"
          />
        </div>

        <h2 className="sectionTitle">Próximo partido destacado</h2>

        {partidoDestacado ? (
          <div className="featuredMatch">
            <div className="matchMain">
              <Team
                code={partidoDestacado.local_code}
                name={partidoDestacado.local}
              />

              <div className="matchCenter">
                <div className="matchBadge">
                  {partidoDestacado.fase ?? "Fase pendiente"}
                  {partidoDestacado.grupo
                    ? ` · ${partidoDestacado.grupo}`
                    : ""}
                </div>

                <p className="muted">
                  {formatearFecha(partidoDestacado.fecha_inicio)}
                </p>

                <p className="matchTime">
                  {formatearHora(partidoDestacado.fecha_inicio)}
                </p>

                <p className="vs">VS</p>

                <p className="muted">
                  {partidoDestacado.estadio ?? "Estadio pendiente"}
                  {partidoDestacado.ciudad
                    ? ` · ${partidoDestacado.ciudad}`
                    : ""}
                </p>
              </div>

              <Team
                code={partidoDestacado.visitante_code}
                name={partidoDestacado.visitante}
              />
            </div>

            <div className="matchAside">
              <h3>¿Ya hiciste tu pronóstico?</h3>

              <p>Guarda tu predicción antes de que empiece el partido.</p>

              <Link href="/mis-pronosticos" className="primaryButton">
                <Target size={20} />
                Hacer Pronóstico
              </Link>
            </div>
          </div>
        ) : (
          <div className="emptyFeatured">
            No hay próximos partidos disponibles ahora mismo.
          </div>
        )}

        <div className="bottomGrid">
          <div className="panel">
            <h2 className="panelTitle">
              <Crown size={24} color="#facc15" />
              Cómo funciona
            </h2>

            <InfoRow
              icon={<CheckCircle2 size={22} />}
              color="#16a34a"
              title="Una porra por usuario"
              text="Tus pronósticos, grupos y bonus aplican a todas las ligas donde participes."
            />

            <InfoRow
              icon={<Users size={22} />}
              color="#2563eb"
              title="Ligas privadas"
              text="Solo ves las ligas donde participas o aquellas a las que entras con invitación/código."
            />

            <InfoRow
              icon={<Trophy size={22} />}
              color="#f59e0b"
              title="Ranking por liga"
              text="Cada liga ordena únicamente a sus participantes, usando la porra de cada usuario."
            />

            <Link href="/ligas" className="outlineButton">
              Ir a mis ligas
            </Link>
          </div>

          <div className="panel">
            <h2 className="panelTitle">
              <Zap size={24} color="#facc15" />
              Sistema V1.2
            </h2>

            <InfoRow
              icon={<Flag size={22} />}
              color="#2563eb"
              title="Fase de grupos"
              text="Pronóstico 1X2. Acierto del signo: 3 puntos."
            />

            <InfoRow
              icon={<Target size={22} />}
              color="#16a34a"
              title="Eliminatorias"
              text="Marcador exacto: 5 puntos. Clasificado/ganador correcto: 3 puntos."
            />

            <InfoRow
              icon={<Award size={22} />}
              color="#7c3aed"
              title="Bonus oficiales"
              text="Campeón, finalistas, goleador, MVP, portero, revelación y decepción."
            />

            <Link href="/reglas" className="outlineButton">
              Ver reglas completas
            </Link>
          </div>
        </div>

        <div className="finalBanner">
          <div className="finalText">
            <div className="bigBlueIcon">
              <Shield size={34} />
            </div>

            <div>
              <h2>V1.2 Beta lista para probar</h2>
              <p>
                Crea tu liga, invita a tus amigos y completa tu porra antes de
                que empiece el Mundial.
              </p>
            </div>
          </div>

          <Link href="/ligas" className="primaryButton">
            <Users size={20} />
            Crear o unirme a una liga
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
          background:
            radial-gradient(circle at 75% 15%, rgba(37,99,235,0.34), transparent 28%),
            linear-gradient(90deg, rgba(2,6,23,0.94) 0%, rgba(2,6,23,0.72) 42%, rgba(2,6,23,0.24) 100%);
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
          color: #93c5fd;
          font-weight: 950;
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-bottom: 26px;
          font-size: 13px;
        }

        .heroTitle {
          font-size: clamp(54px, 8vw, 96px);
          line-height: 0.92;
          letter-spacing: -0.06em;
          font-weight: 950;
          margin: 0;
        }

        .heroTitle span {
          color: #60a5fa;
        }

        .heroText {
          margin-top: 28px;
          color: #d1d5db;
          font-size: 23px;
          line-height: 1.55;
          max-width: 690px;
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
          font-weight: 950;
          font-size: 17px;
        }

        .primaryButton {
          background: #2563eb;
          box-shadow: 0 18px 46px rgba(37,99,235,0.32);
        }

        .secondaryButton {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
        }

        .heroBadges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 22px;
        }

        .heroBadges span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(15,23,42,0.62);
          color: #dbeafe;
          border-radius: 999px;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 900;
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
          background: rgba(15,23,42,0.86);
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
          font-weight: 950;
          letter-spacing: 1px;
          margin: 0;
        }

        .statValue {
          font-size: 34px;
          font-weight: 950;
          margin: 4px 0 0;
        }

        .statDetail {
          color: #94a3b8;
          font-size: 14px;
          margin: 0;
        }

        .versionPanel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          margin-top: 28px;
          border: 1px solid rgba(96,165,250,0.24);
          background: linear-gradient(135deg, rgba(37,99,235,0.20), rgba(15,23,42,0.82));
          border-radius: 28px;
          padding: 26px;
        }

        .versionEyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .versionPanel h2 {
          margin: 0;
          font-size: 30px;
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .versionPanel p {
          max-width: 760px;
          color: #cbd5e1;
          line-height: 1.55;
          font-weight: 750;
          margin: 10px 0 0;
        }

        .sectionTitle {
          font-size: 30px;
          font-weight: 950;
          margin-top: 38px;
          margin-bottom: 22px;
          letter-spacing: -0.03em;
        }

        .quickGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .quickCard {
          background: linear-gradient(145deg, rgba(15,23,42,0.95), rgba(15,23,42,0.55));
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 28px;
          padding: 26px;
          min-height: 230px;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }

        .quickCard:hover {
          transform: translateY(-2px);
          border-color: rgba(147,197,253,0.42);
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

        .emptyFeatured {
          background: rgba(15,23,42,0.82);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          padding: 30px;
          text-align: center;
          color: #94a3b8;
          font-weight: 800;
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
          font-weight: 950;
          text-transform: uppercase;
          font-size: 13px;
        }

        .muted {
          color: #cbd5e1;
          margin-top: 12px;
        }

        .matchTime {
          font-size: 42px;
          font-weight: 950;
          margin: 6px 0;
        }

        .vs {
          color: #60a5fa;
          font-weight: 950;
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
          font-weight: 950;
          margin: 0;
        }

        .matchAside p {
          color: #cbd5e1;
          line-height: 1.6;
          margin: 0;
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

        .flagFallback {
          color: #94a3b8;
          font-size: 28px;
          font-weight: 950;
        }

        .team {
          text-align: center;
        }

        .teamName {
          font-size: 20px;
          font-weight: 950;
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
          font-weight: 950;
          margin-bottom: 18px;
        }

        .infoRow {
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

        .infoTitle {
          color: white;
          font-weight: 950;
          margin: 0 0 4px;
        }

        .infoText {
          color: #cbd5e1;
          line-height: 1.5;
          margin: 0;
        }

        .outlineButton {
          display: block;
          margin-top: 18px;
          text-align: center;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(37,99,235,0.75);
          color: #93c5fd;
          text-decoration: none;
          font-weight: 950;
        }

        .outlineButton.compact {
          margin-top: 0;
          white-space: nowrap;
          padding: 14px 18px;
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
          font-weight: 950;
          margin: 0;
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

        @media (max-width: 1080px) {
          .quickGrid {
            grid-template-columns: repeat(2, 1fr);
          }
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

          .heroBadges {
            justify-content: center;
          }

          .worldLogo {
            max-width: 280px;
          }

          .statsGrid {
            grid-template-columns: 1fr 1fr;
            margin-top: -46px;
          }

          .versionPanel {
            flex-direction: column;
            align-items: stretch;
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

        @media (max-width: 560px) {
          .contentWrap {
            padding-left: 16px;
            padding-right: 16px;
          }

          .eyebrow {
            font-size: 11px;
            letter-spacing: 3px;
          }

          .heroTitle {
            font-size: 44px;
          }

          .statsGrid {
            grid-template-columns: 1fr;
          }

          .quickGrid {
            grid-template-columns: 1fr;
          }

          .statCard {
            padding: 18px;
          }

          .sectionTitle {
            font-size: 26px;
          }

          .versionPanel h2 {
            font-size: 25px;
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
      <div className="iconBox" style={{ background: color }}>
        {icon}
      </div>

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
        <div className="quickIcon" style={{ background: color }}>
          {icon}
        </div>

        <h3 style={{ fontSize: "24px", fontWeight: 950, marginTop: "22px" }}>
          {title}
        </h3>

        <p style={{ color: "#cbd5e1", marginTop: "12px", lineHeight: 1.6 }}>
          {text}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "20px",
          }}
        >
          <ArrowRight size={30} />
        </div>
      </div>
    </Link>
  );
}

function Team({ code, name }: { code: string | null; name: string }) {
  const normalizedCode = code?.trim().toLowerCase();

  return (
    <div className="team">
      <div className="flagCircle">
        {normalizedCode ? (
          <img src={`https://flagcdn.com/w160/${normalizedCode}.png`} alt={name} />
        ) : (
          <span className="flagFallback">—</span>
        )}
      </div>

      <p className="teamName">{name}</p>
    </div>
  );
}

function InfoRow({
  icon,
  color,
  title,
  text,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  text: string;
}) {
  return (
    <div className="infoRow">
      <div className="smallIcon" style={{ background: color }}>
        {icon}
      </div>

      <div>
        <p className="infoTitle">{title}</p>
        <p className="infoText">{text}</p>
      </div>
    </div>
  );
}
