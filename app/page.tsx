"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Trophy,
  CalendarDays,
  Target,
  Crown,
  ArrowRight,
  Zap,
  CheckCircle2,
  Users,
  Shield,
  Flag,
  Award,
  Sparkles,
  Medal,
  Gamepad2,
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

type Countdown = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  terminado: boolean;
};

const INICIO_MUNDIAL_2026 = new Date("2026-06-11T19:00:00+02:00");

function calcularCountdown(): Countdown {
  const diferencia = INICIO_MUNDIAL_2026.getTime() - Date.now();

  if (diferencia <= 0) {
    return {
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
      terminado: true,
    };
  }

  const segundosTotales = Math.floor(diferencia / 1000);
  const dias = Math.floor(segundosTotales / 86400);
  const horas = Math.floor((segundosTotales % 86400) / 3600);
  const minutos = Math.floor((segundosTotales % 3600) / 60);
  const segundos = segundosTotales % 60;

  return {
    dias,
    horas,
    minutos,
    segundos,
    terminado: false,
  };
}

function formatearNumeroCountdown(valor: number) {
  return valor.toString().padStart(2, "0");
}

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
  const [haySesion, setHaySesion] = useState(false);
  const [countdown, setCountdown] = useState<Countdown>({
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
    terminado: false,
  });

  useEffect(() => {
    cargarDatosHome();
  }, []);

  useEffect(() => {
    let activo = true;

    async function comprobarSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (activo) {
        setHaySesion(Boolean(session));
      }
    }

    comprobarSesion();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setHaySesion(Boolean(session));
      }
    );

    return () => {
      activo = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setCountdown(calcularCountdown());

    const intervalo = window.setInterval(() => {
      setCountdown(calcularCountdown());
    }, 1000);

    return () => {
      window.clearInterval(intervalo);
    };
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

  function rutaPrivada(ruta: string) {
    return haySesion ? ruta : "/login";
  }

  return (
    <main className="home">
      <section className="hero">
        <div className="stadium" />
        <div className="overlay" />

        <div className="heroContent">
          <div className="heroTextColumn">
<h1 className="heroTitle">
              Porra Mundial
              <br />
              <span>2026</span>
            </h1>

            <p className="heroText">
              Crea tu liga privada, haz tus pronósticos, elige tus bonus y
              demuestra quién sabe más de fútbol durante el Mundial.
            </p>

            <div className="buttonRow">
              <Link href={rutaPrivada("/ligas")} className="primaryButton">
                <Users size={20} />
                Crear o unirme a una liga
              </Link>

              <Link href={rutaPrivada("/mis-pronosticos")} className="secondaryButton">
                <Target size={20} />
                Hacer mi porra
              </Link>
            </div>

            <div className="countdownCard" aria-label="Cuenta atrás Mundial 2026">
              <div className="countdownIntro">
                <CalendarDays size={18} />
                <span>
                  {countdown.terminado
                    ? "El Mundial ya ha empezado"
                    : "Empieza el Mundial en"}
                </span>
              </div>

              <div className="countdownGrid">
                <CountdownItem value={countdown.dias} label="días" />
                <CountdownItem
                  value={formatearNumeroCountdown(countdown.horas)}
                  label="horas"
                />
                <CountdownItem
                  value={formatearNumeroCountdown(countdown.minutos)}
                  label="min"
                />
                <CountdownItem
                  value={formatearNumeroCountdown(countdown.segundos)}
                  label="seg"
                />
              </div>

              <p>Completa tu porra antes del primer partido.</p>
            </div>
          </div>

          <div className="logoScene" aria-label="Mundial 2026">
            <div className="logoGlow" />
            <img
              src="/worldcup-logo.png"
              alt="Mundial 2026"
              className="worldLogo"
            />
          </div>
        </div>

        <div className="heroStats">
          <StatCard
            icon={<CalendarDays size={28} />}
            title="Partidos cargados"
            value={valorStat(stats.partidos)}
            detail="Calendario oficial"
            color="#2563eb"
          />

          <StatCard
            icon={<Users size={28} />}
            title="Participantes"
            value={valorStat(stats.participantes)}
            detail="Usuarios registrados"
            color="#16a34a"
          />

          <StatCard
            icon={<Target size={28} />}
            title="Pronósticos"
            value={valorStat(stats.pronosticos)}
            detail="Predicciones realizadas"
            color="#7c3aed"
          />

          <StatCard
            icon={<Trophy size={28} />}
            title="Ligas activas"
            value={valorStat(stats.ligasActivas)}
            detail="Competiciones en marcha"
            color="#f59e0b"
          />
        </div>
      </section>

      <section className="contentWrap">
        <section className="versionPanel">
          <div>
            <div className="versionEyebrow">
              <Sparkles size={16} />
              Versión actual
            </div>

            <h2>V1.2 preparada para ligas privadas</h2>

            <p>
              Una sola porra por usuario que cuenta en todas sus ligas:
              pronósticos de partidos, clasificados de grupo y bonus oficiales.
            </p>
          </div>

          <Link href={rutaPrivada("/reglas")} className="outlineButton compact">
            Ver reglas
          </Link>
        </section>

        <h2 className="sectionTitle">Completa tu porra</h2>

        <div className="quickGrid">
          <QuickCard
            href={rutaPrivada("/mis-pronosticos")}
            icon={<Target size={36} />}
            title="Partidos"
            text="En fase de grupos pronosticas 1X2. En eliminatorias, marcador exacto."
            color="#2563eb"
          />

          <QuickCard
            href={rutaPrivada("/grupos")}
            icon={<Flag size={36} />}
            title="Clasificados de grupo"
            text="Elige las dos selecciones que crees que pasarán de cada grupo."
            color="#16a34a"
          />

          <QuickCard
            href={rutaPrivada("/bonus")}
            icon={<Award size={36} />}
            title="Bonus oficiales"
            text="Campeón, finalistas, Bota de Oro, MVP, mejor portero, revelación y decepción."
            color="#7c3aed"
          />

          <QuickCard
            href={rutaPrivada("/ligas")}
            icon={<Users size={36} />}
            title="Mis ligas"
            text="Crea una liga privada, únete con un código y compite con tus amigos."
            color="#f59e0b"
          />
        </div>

        <section className="howItWorks">
          <div className="stepCard">
            <div className="stepNumber">1</div>
            <h3>Crea o entra en una liga</h3>
            <p>Compite en grupos privados con tus amigos, familia o compañeros.</p>
          </div>

          <div className="stepCard">
            <div className="stepNumber">2</div>
            <h3>Completa tu porra</h3>
            <p>Partidos, clasificados de grupo y bonus oficiales del Mundial.</p>
          </div>

          <div className="stepCard">
            <div className="stepNumber">3</div>
            <h3>Sigue el ranking</h3>
            <p>Los puntos se van sumando y cada liga tiene su clasificación.</p>
          </div>
        </section>

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

              <Link href={rutaPrivada("/mis-pronosticos")} className="primaryButton">
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

            <Link href={rutaPrivada("/ligas")} className="outlineButton">
              Ir a mis ligas
            </Link>
          </div>

          <div className="panel">
            <h2 className="panelTitle">
              <Zap size={24} color="#facc15" />
              Sistema V1.2
            </h2>

            <InfoRow
              icon={<Gamepad2 size={22} />}
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
              icon={<Medal size={22} />}
              color="#7c3aed"
              title="Bonus oficiales"
              text="Campeón, finalistas, goleador, MVP, portero, revelación y decepción."
            />

            <Link href={rutaPrivada("/reglas")} className="outlineButton">
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
              <h2>Porra Mundial 2026 lista para jugar</h2>
              <p>
                Crea tu liga, invita a tus amigos y completa tu porra antes de
                que empiece el Mundial.
              </p>
            </div>
          </div>

          <Link href={rutaPrivada("/ligas")} className="primaryButton">
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
          overflow: hidden;
          min-height: calc(100vh - 84px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 34px 24px 34px;
        }

        .stadium {
          position: absolute;
          inset: 0;
          background-image: url('/stadium.jpg');
          background-size: cover;
          background-position: center;
          filter: brightness(0.86) saturate(1.16) contrast(1.07);
          transform: scale(1.02);
        }

        .overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 71% 50%, rgba(250,204,21,0.18), transparent 21%),
            radial-gradient(circle at 18% 24%, rgba(249,115,22,0.18), transparent 30%),
            radial-gradient(circle at 88% 19%, rgba(59,130,246,0.24), transparent 25%),
            linear-gradient(90deg, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.72) 38%, rgba(2,6,23,0.38) 69%, rgba(2,6,23,0.30) 100%),
            linear-gradient(180deg, rgba(2,6,23,0.00) 0%, rgba(2,6,23,0.36) 100%);
        }

        .heroContent {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1280px;
          margin: 12px auto 28px;
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(320px, 0.98fr);
          align-items: center;
          gap: 44px;
        }

        .heroTextColumn {
          min-width: 0;
        }

        .heroTitle {
          font-size: clamp(60px, 7.6vw, 102px);
          line-height: 0.92;
          letter-spacing: -0.075em;
          font-weight: 950;
          margin: 0;
          text-shadow: 0 24px 70px rgba(0,0,0,0.55);
        }

        .heroTitle span {
          display: block;
          color: #2563eb;
          text-shadow:
            0 16px 48px rgba(37,99,235,0.46),
            0 24px 70px rgba(0,0,0,0.40);
        }

        .heroText {
          margin-top: 24px;
          color: #f1f5f9;
          font-size: 22px;
          line-height: 1.48;
          max-width: 660px;
          text-shadow: 0 10px 30px rgba(0,0,0,0.55);
        }

        .buttonRow {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 36px;
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
          min-height: 56px;
          transition: transform 0.18s ease, filter 0.18s ease, border-color 0.18s ease;
        }

        .primaryButton {
          background: #2563eb;
          box-shadow: 0 18px 46px rgba(37,99,235,0.34);
        }

        .secondaryButton {
          background: rgba(15,23,42,0.54);
          border: 1px solid rgba(255,255,255,0.20);
          backdrop-filter: blur(10px);
        }

        .primaryButton:hover,
        .secondaryButton:hover,
        .outlineButton:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .countdownCard {
          width: min(100%, 620px);
          margin-top: 24px;
          border-radius: 26px;
          border: 1px solid rgba(250,204,21,0.24);
          background:
            radial-gradient(circle at top left, rgba(250,204,21,0.16), transparent 34%),
            rgba(15,23,42,0.58);
          backdrop-filter: blur(14px);
          box-shadow: 0 22px 60px rgba(0,0,0,0.28);
          padding: 18px;
        }

        .countdownIntro {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #fde68a;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 13px;
        }

        .countdownGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .countdownItem {
          border-radius: 18px;
          background: rgba(2,6,23,0.56);
          border: 1px solid rgba(255,255,255,0.11);
          padding: 12px 10px;
          text-align: center;
        }

        .countdownItem strong {
          display: block;
          font-size: clamp(28px, 3vw, 42px);
          line-height: 0.95;
          font-weight: 950;
          letter-spacing: -0.055em;
          color: white;
        }

        .countdownItem span {
          display: block;
          margin-top: 6px;
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.10em;
          text-transform: uppercase;
        }

        .countdownCard p {
          margin: 12px 0 0;
          color: #fde68a;
          font-size: 13px;
          line-height: 1.4;
          font-weight: 850;
          text-shadow: none;
        }

        .logoScene {
          position: relative;
          min-height: 585px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logoGlow {
          position: absolute;
          width: min(92%, 580px);
          aspect-ratio: 1 / 1;
          border-radius: 999px;
          background:
            radial-gradient(circle, rgba(250,204,21,0.20), transparent 44%),
            radial-gradient(circle, rgba(37,99,235,0.18), transparent 66%);
          filter: blur(2px);
          pointer-events: none;
        }

        .worldLogo {
          position: relative;
          z-index: 2;
          width: min(94%, 620px);
          max-height: 640px;
          object-fit: contain;
          filter:
            drop-shadow(0 34px 62px rgba(0,0,0,0.62))
            drop-shadow(0 0 42px rgba(250,204,21,0.26));
          transform: translateY(8px);
        }

        .heroStats {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1180px;
          margin: 54px auto 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(2,6,23,0.68);
          backdrop-filter: blur(18px);
          border-radius: 26px;
          overflow: hidden;
          box-shadow: 0 26px 80px rgba(0,0,0,0.32);
        }

        .statCard {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 22px 26px;
          min-width: 0;
          border-right: 1px solid rgba(255,255,255,0.12);
        }

        .statCard:last-child {
          border-right: none;
        }

        .iconBox {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 14px 36px rgba(0,0,0,0.25);
        }

        .statLabel {
          color: #e5e7eb;
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
          color: #cbd5e1;
          font-size: 14px;
          margin: 0;
        }

        .contentWrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 42px 24px 90px;
        }

        .versionPanel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
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
          grid-template-columns: repeat(4, minmax(0, 1fr));
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

        .howItWorks {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 26px;
        }

        .stepCard {
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(15,23,42,0.72);
          border-radius: 26px;
          padding: 22px;
        }

        .stepNumber {
          width: 38px;
          height: 38px;
          border-radius: 14px;
          background: rgba(37,99,235,0.22);
          border: 1px solid rgba(96,165,250,0.30);
          color: #bfdbfe;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 950;
          margin-bottom: 14px;
        }

        .stepCard h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 950;
        }

        .stepCard p {
          margin: 8px 0 0;
          color: #cbd5e1;
          line-height: 1.55;
          font-weight: 750;
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

        @media (max-width: 1180px) {
          .heroContent {
            grid-template-columns: 1fr 0.82fr;
          }

          .worldLogo {
            width: min(96%, 470px);
          }

          .logoScene {
            min-height: 480px;
          }

          .quickGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .hero {
            min-height: auto;
            padding: 34px 20px 28px;
          }

          .heroContent {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 24px;
          }

          .heroTitle {
            font-size: clamp(48px, 13vw, 70px);
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

          .logoScene {
            min-height: 300px;
          }

          .worldLogo {
            width: min(82%, 270px);
            transform: translateY(0);
          }

          .heroStats {
            margin-top: 22px;
            grid-template-columns: 1fr 1fr;
            border-radius: 22px;
          }

          .statCard {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.12);
          }

          .statCard:nth-child(odd) {
            border-right: 1px solid rgba(255,255,255,0.12);
          }

          .statCard:nth-child(3),
          .statCard:nth-child(4) {
            border-bottom: none;
          }

          .contentWrap {
            padding-top: 28px;
          }

          .versionPanel {
            flex-direction: column;
            align-items: stretch;
          }

          .howItWorks {
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

        @media (max-width: 560px) {
          .hero {
            min-height: calc(100svh - 84px);
            justify-content: flex-start;
            padding: 32px 18px 108px;
          }

          .stadium {
            background-position: center top;
          }

          .overlay {
            background:
              radial-gradient(circle at 50% 57%, rgba(250,204,21,0.22), transparent 22%),
              radial-gradient(circle at 18% 40%, rgba(249,115,22,0.18), transparent 28%),
              radial-gradient(circle at 88% 28%, rgba(59,130,246,0.25), transparent 26%),
              linear-gradient(180deg, rgba(2,6,23,0.94) 0%, rgba(2,6,23,0.74) 28%, rgba(2,6,23,0.42) 62%, rgba(2,6,23,0.70) 100%);
          }

          .heroContent {
            gap: 18px;
            min-height: calc(100svh - 224px);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }

          .heroTextColumn {
            width: 100%;
            padding-top: 24px;
          }

          .heroTitle {
            font-size: clamp(50px, 13.8vw, 62px);
            line-height: 0.95;
            letter-spacing: -0.07em;
          }

          .heroTitle span {
            margin-top: 4px;
          }

          .heroText {
            font-size: 17px;
            line-height: 1.52;
            max-width: 92%;
            margin-top: 18px;
          }

          .buttonRow {
            gap: 12px;
            margin-top: 26px;
          }

          .countdownCard {
            width: 100%;
            margin-top: 16px;
            border-radius: 24px;
            padding: 14px;
          }

          .countdownIntro {
            justify-content: center;
            width: 100%;
            font-size: 10px;
            margin-bottom: 10px;
          }

          .countdownGrid {
            gap: 7px;
          }

          .countdownItem {
            border-radius: 15px;
            padding: 10px 6px;
          }

          .countdownItem strong {
            font-size: clamp(24px, 8vw, 35px);
          }

          .countdownItem span {
            font-size: 9px;
          }

          .countdownCard p {
            text-align: center;
            font-size: 12px;
            margin-top: 10px;
          }

          .primaryButton,
          .secondaryButton {
            min-height: 64px;
            border-radius: 22px;
            font-size: 18px;
            padding: 16px 18px;
          }

          .logoScene {
            flex: 1;
            width: 100%;
            min-height: 0;
            margin-top: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logoGlow {
            width: min(100%, 360px);
            opacity: 0.9;
          }

          .worldLogo {
            width: min(96%, 360px);
            max-height: min(42svh, 420px);
            transform: translateY(-8px);
          }

          .heroStats {
            display: none;
          }

          .contentWrap {
            padding-left: 16px;
            padding-right: 16px;
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

          .matchTime {
            font-size: 34px;
          }

          .finalText {
            flex-direction: column;
          }
        }

        @media (max-width: 380px) {
          .hero {
            padding-left: 14px;
            padding-right: 14px;
          }

          .heroTextColumn {
            padding-top: 14px;
          }

          .heroTitle {
            font-size: 46px;
          }

          .heroText {
            font-size: 15px;
            max-width: 96%;
          }

          .countdownCard {
            padding: 12px;
          }

          .countdownItem strong {
            font-size: 23px;
          }

          .countdownCard p {
            display: none;
          }

          .primaryButton,
          .secondaryButton {
            min-height: 58px;
            font-size: 16px;
          }

          .worldLogo {
            width: min(92%, 310px);
            max-height: min(38svh, 360px);
          }
        }
      `}</style>
    </main>
  );
}

function CountdownItem({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="countdownItem">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
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
