"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Copy,
  Crown,
  Medal,
  ScrollText,
  Table2,
  Target,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { obtenerParticipanteActual } from "@/lib/participante";

type Props = {
  params: Promise<{ id: string }>;
};

type Liga = {
  id: number;
  nombre: string;
  codigo: string;
};

type MiembroRanking = {
  id: number;
  nombre: string;
  puntos: number;
  aciertos: number;
};

export default function LigaDetallePage({ params }: Props) {
  const resolvedParams = use(params);

  const [ligaId, setLigaId] = useState<number | null>(null);
  const [liga, setLiga] = useState<Liga | null>(null);
  const [ranking, setRanking] = useState<MiembroRanking[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sinAcceso, setSinAcceso] = useState(false);

  useEffect(() => {
    const id = Number(resolvedParams.id);

    setLigaId(id);
    cargarLiga(id);
  }, [resolvedParams.id]);

  async function cargarLiga(id: number) {
    setCargando(true);
    setSinAcceso(false);

    try {
      const usuario = await obtenerParticipanteActual();

      if (!usuario) {
        setSinAcceso(true);
        setCargando(false);
        return;
      }

      const { data: perteneceLiga } = await supabase
        .from("liga_participantes")
        .select("id")
        .eq("liga_id", id)
        .eq("participante_id", usuario.id)
        .maybeSingle();

      if (!perteneceLiga) {
        setSinAcceso(true);
        setCargando(false);
        return;
      }

      const { data: ligaData } = await supabase
        .from("ligas")
        .select("id, nombre, codigo")
        .eq("id", id)
        .single();

      setLiga(ligaData);

      const { data: miembrosData } = await supabase
        .from("liga_participantes")
        .select(
          `
          participante_id,
          participantes (
            id,
            nombre,
            nickname
          )
        `
        )
        .eq("liga_id", id);

      const miembros =
        miembrosData?.map((item: any) => item.participantes).filter(Boolean) ??
        [];

      const { data: pronosticosData } = await supabase
        .from("pronosticos")
        .select("participante_id, puntos");

      const rankingCalculado: MiembroRanking[] = miembros.map(
        (miembro: any) => {
          const nombreVisible =
            miembro.nickname || miembro.nombre || "Usuario";

          const pronosticosMiembro =
            pronosticosData?.filter(
              (p) => p.participante_id === miembro.id
            ) ?? [];

          const puntos = pronosticosMiembro.reduce(
            (total, p) => total + (p.puntos ?? 0),
            0
          );

          const aciertos = pronosticosMiembro.filter(
            (p) => (p.puntos ?? 0) > 0
          ).length;

          return {
            id: miembro.id,
            nombre: nombreVisible,
            puntos,
            aciertos,
          };
        }
      );

      rankingCalculado.sort((a, b) => b.puntos - a.puntos);

      setRanking(rankingCalculado);
    } catch (error) {
      console.error("Error cargando liga:", error);
      setLiga(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!ligaId) return;

    const channel = supabase
      .channel(`liga-${ligaId}-ranking`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pronosticos",
        },
        () => cargarLiga(ligaId)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "liga_participantes",
        },
        () => cargarLiga(ligaId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ligaId]);

  async function copiarCodigo() {
    if (!liga) return;

    await navigator.clipboard.writeText(liga.codigo);

    alert("Código copiado");
  }

  if (cargando) {
    return (
      <main className="page">
        <div className="container">
          <div className="emptyBox">Cargando liga...</div>
        </div>

        <Styles />
      </main>
    );
  }

  if (sinAcceso) {
    return (
      <main className="page">
        <div className="container">
          <Link href="/ligas" className="backLink">
            <ArrowLeft size={18} />
            Volver a ligas
          </Link>

          <div className="emptyBox">No tienes acceso a esta liga.</div>
        </div>

        <Styles />
      </main>
    );
  }

  if (!liga) {
    return (
      <main className="page">
        <div className="container">
          <Link href="/ligas" className="backLink">
            <ArrowLeft size={18} />
            Volver a ligas
          </Link>

          <div className="emptyBox">Liga no encontrada.</div>
        </div>

        <Styles />
      </main>
    );
  }

  const top3 = ranking.slice(0, 3);

  return (
    <main className="page">
      <div className="container">
        <Link href="/ligas" className="backLink">
          <ArrowLeft size={18} />
          Cambiar de liga
        </Link>

        <section className="hero">
          <div className="heroIcon">
            <Users size={34} />
          </div>

          <div className="heroText">
            <p className="eyebrow">Estás dentro de la liga</p>
            <h1>{liga.nombre}</h1>
            <p>Ranking privado entre los miembros de esta liga.</p>
          </div>

          <button onClick={copiarCodigo} className="codeButton">
            <Copy size={18} />
            {liga.codigo}
          </button>
        </section>

        <section className="contextActions">
          <Link href="/mis-pronosticos" className="contextAction primary">
            <Target size={22} />
            <div>
              <strong>Pronósticos</strong>
              <span>Haz o revisa tus apuestas</span>
            </div>
          </Link>

          <Link href="/partidos" className="contextAction">
            <CalendarDays size={22} />
            <div>
              <strong>Partidos</strong>
              <span>Calendario del Mundial</span>
            </div>
          </Link>

          <Link href="/clasificacion" className="contextAction">
            <Table2 size={22} />
            <div>
              <strong>Clasificación</strong>
              <span>Grupos y fases</span>
            </div>
          </Link>

          <Link href="/reglas" className="contextAction">
            <ScrollText size={22} />
            <div>
              <strong>Reglas</strong>
              <span>Sistema de puntos</span>
            </div>
          </Link>
        </section>

        <section className="statsGrid">
          <div className="statCard">
            <p>Miembros</p>
            <strong>{ranking.length}</strong>
          </div>

          <div className="statCard">
            <p>Líder</p>
            <strong>{ranking[0]?.nombre ?? "-"}</strong>
          </div>

          <div className="statCard">
            <p>Puntos líder</p>
            <strong>{ranking[0]?.puntos ?? 0}</strong>
          </div>
        </section>

        <h2 className="sectionTitle">Podio de la liga</h2>

        {top3.length === 0 ? (
          <div className="emptyBox">Aún no hay miembros en esta liga.</div>
        ) : (
          <div className="podiumGrid">
            {top3.map((miembro, index) => (
              <PodiumCard
                key={miembro.id}
                miembro={miembro}
                position={index + 1}
              />
            ))}
          </div>
        )}

        <h2 className="sectionTitle">Clasificación privada</h2>

        <div className="rankingList">
          {ranking.map((miembro, index) => (
            <article key={miembro.id} className="rankingRow">
              <div className={`position position-${index + 1}`}>
                {index + 1}
              </div>

              <div className="memberInfo">
                <h3>{miembro.nombre}</h3>
              </div>

              <div className="memberStats">
                <strong>{miembro.puntos}</strong>
                <span>puntos</span>
              </div>

              <div className="aciertosBadge">
                {miembro.aciertos} aciertos
              </div>
            </article>
          ))}
        </div>
      </div>

      <Styles />
    </main>
  );
}

function PodiumCard({
  miembro,
  position,
}: {
  miembro: MiembroRanking;
  position: number;
}) {
  const colors: Record<number, string> = {
    1: "#facc15",
    2: "#d1d5db",
    3: "#fb923c",
  };

  return (
    <article
      className="podiumCard"
      style={{
        border: `1px solid ${colors[position]}55`,
        boxShadow: `0 0 35px ${colors[position]}22`,
      }}
    >
      <div
        className="podiumIcon"
        style={{
          background: colors[position],
          color: position === 1 || position === 2 ? "black" : "white",
        }}
      >
        {position === 1 ? <Crown size={34} /> : <Medal size={34} />}
      </div>

      <p className="podiumPosition">#{position}</p>

      <h3>{miembro.nombre}</h3>

      <strong>{miembro.puntos}</strong>

      <span>puntos</span>
    </article>
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
        padding: 32px 16px 120px;
      }

      .container {
        max-width: 1120px;
        margin: 0 auto;
      }

      .backLink {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #bfdbfe;
        text-decoration: none;
        font-weight: 900;
        margin-bottom: 18px;
      }

      .hero {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 20px;
        background: linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.65));
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 32px;
        padding: 28px;
      }

      .heroIcon {
        width: 76px;
        height: 76px;
        border-radius: 24px;
        background: #2563eb;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .eyebrow {
        color: #93c5fd;
        font-size: 13px;
        text-transform: uppercase;
        font-weight: 900;
        letter-spacing: 1px;
        margin: 0;
      }

      .hero h1 {
        font-size: 42px;
        font-weight: 900;
        margin: 4px 0;
      }

      .hero p {
        color: #94a3b8;
        margin: 0;
      }

      .codeButton {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: none;
        border-radius: 16px;
        padding: 14px 18px;
        background: rgba(37,99,235,0.22);
        border: 1px solid rgba(37,99,235,0.55);
        color: white;
        font-weight: 900;
        cursor: pointer;
        font-family: inherit;
        font-size: 15px;
      }

      .contextActions {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-top: 20px;
      }

      .contextAction {
        display: flex;
        align-items: center;
        gap: 14px;
        text-decoration: none;
        color: white;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 22px;
        padding: 18px;
        transition: 0.2s ease;
      }

      .contextAction:hover {
        transform: translateY(-2px);
        background: rgba(255,255,255,0.09);
        border-color: rgba(147,197,253,0.35);
      }

      .contextAction.primary {
        background: rgba(37,99,235,0.20);
        border-color: rgba(96,165,250,0.40);
      }

      .contextAction strong {
        display: block;
        font-size: 16px;
        font-weight: 900;
      }

      .contextAction span {
        display: block;
        margin-top: 3px;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 800;
      }

      .statsGrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
        margin-top: 24px;
      }

      .statCard {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 24px;
        padding: 22px;
      }

      .statCard p {
        color: #94a3b8;
        font-weight: 900;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 1px;
        margin: 0;
      }

      .statCard strong {
        display: block;
        margin-top: 10px;
        font-size: 28px;
        font-weight: 900;
      }

      .sectionTitle {
        font-size: 32px;
        font-weight: 900;
        margin: 34px 0 18px;
      }

      .podiumGrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
      }

      .podiumCard {
        background: linear-gradient(145deg, rgba(15,23,42,0.95), rgba(15,23,42,0.62));
        border-radius: 30px;
        padding: 26px;
        text-align: center;
      }

      .podiumIcon {
        width: 72px;
        height: 72px;
        border-radius: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
      }

      .podiumPosition {
        color: #cbd5e1;
        font-weight: 900;
        margin: 0;
      }

      .podiumCard h3 {
        font-size: 26px;
        font-weight: 900;
        margin: 8px 0 0;
      }

      .podiumCard strong {
        display: block;
        font-size: 42px;
        font-weight: 900;
        margin-top: 18px;
      }

      .podiumCard span {
        color: #94a3b8;
      }

      .rankingList {
        display: grid;
        gap: 12px;
      }

      .rankingRow {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        gap: 16px;
        align-items: center;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 24px;
        padding: 18px;
      }

      .position {
        width: 48px;
        height: 48px;
        border-radius: 999px;
        background: #1e293b;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 20px;
      }

      .position-1 {
        background: #facc15;
        color: black;
      }

      .position-2 {
        background: #d1d5db;
        color: black;
      }

      .position-3 {
        background: #fb923c;
        color: black;
      }

      .memberInfo h3 {
        font-size: 22px;
        font-weight: 900;
        margin: 0;
      }

      .memberStats {
        text-align: right;
      }

      .memberStats strong {
        display: block;
        font-size: 30px;
        font-weight: 900;
      }

      .memberStats span {
        color: #94a3b8;
        font-size: 13px;
      }

      .aciertosBadge {
        background: rgba(22,163,74,0.16);
        border: 1px solid rgba(22,163,74,0.32);
        color: #86efac;
        border-radius: 999px;
        padding: 8px 12px;
        font-weight: 900;
        font-size: 13px;
      }

      .emptyBox {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 24px;
        padding: 26px;
        color: #94a3b8;
        font-weight: 900;
        text-align: center;
      }

      @media (max-width: 900px) {
        .contextActions {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 800px) {
        .hero {
          grid-template-columns: 1fr;
        }

        .statsGrid,
        .podiumGrid {
          grid-template-columns: 1fr;
        }

        .rankingRow {
          grid-template-columns: auto 1fr;
        }

        .memberStats,
        .aciertosBadge {
          grid-column: 1 / -1;
          text-align: center;
        }

        .hero h1 {
          font-size: 34px;
        }
      }

      @media (max-width: 560px) {
        .page {
          padding: 24px 12px 120px;
        }

        .hero {
          padding: 22px;
          border-radius: 26px;
        }

        .heroIcon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
        }

        .hero h1 {
          font-size: 30px;
        }

        .codeButton {
          width: 100%;
          justify-content: center;
        }

        .contextActions {
          grid-template-columns: 1fr;
        }

        .contextAction {
          padding: 16px;
        }

        .sectionTitle {
          font-size: 28px;
        }
      }
    `}</style>
  );
}