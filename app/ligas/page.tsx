"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Users,
  Plus,
  Clock3,
  Trophy,
  Copy,
  CheckCircle2,
  XCircle,
  LogIn,
  ArrowRight,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { obtenerParticipanteActual } from "@/lib/participante";

type Participante = {
  id: number;
  nombre: string;
  role?: string | null;
};

type Liga = {
  id: number;
  nombre: string;
  codigo: string;
  estado: string;
};

export default function LigasPage() {
  const [participante, setParticipante] = useState<Participante | null>(null);

  const [misLigas, setMisLigas] = useState<Liga[]>([]);

  const [ligasPendientes, setLigasPendientes] = useState<Liga[]>([]);

  const [nombreLiga, setNombreLiga] = useState("");

  const [codigoLiga, setCodigoLiga] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const participanteActual = await obtenerParticipanteActual();

    setParticipante(participanteActual);

    if (!participanteActual) return;

    const { data } = await supabase
      .from("liga_participantes")
      .select(`
        liga_id,
        ligas (
          id,
          nombre,
          codigo,
          estado
        )
      `)
      .eq("participante_id", participanteActual.id);

    const ligasMiembro =
      data?.map((item: any) => item.ligas).filter(Boolean) ?? [];

    const activas = ligasMiembro.filter(
      (liga: Liga) => liga.estado === "activa"
    );

    setMisLigas(activas);

    const { data: pendientes } = await supabase
      .from("ligas")
      .select("*")
      .eq("creador_id", participanteActual.id)
      .eq("estado", "pendiente");

    setLigasPendientes(pendientes ?? []);
  }

  function generarCodigo() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function solicitarLiga() {
    if (!participante) {
      alert("Debes iniciar sesión");
      return;
    }

    if (!nombreLiga.trim()) {
      alert("Introduce un nombre");
      return;
    }

    setLoading(true);

    const codigo = generarCodigo();

    const { error } = await supabase.from("ligas").insert({
      nombre: nombreLiga,
      codigo,
      creador_id: participante.id,
      estado: "pendiente",
    });

    if (error) {
      alert("Error solicitando liga");
      setLoading(false);
      return;
    }

    setNombreLiga("");

    await cargar();

    alert("Solicitud enviada correctamente");

    setLoading(false);
  }

  async function unirseLiga() {
    if (!participante) {
      alert("Debes iniciar sesión");
      return;
    }

    if (!codigoLiga.trim()) {
      alert("Introduce un código");
      return;
    }

    setLoading(true);

    const { data: liga } = await supabase
      .from("ligas")
      .select("*")
      .eq("codigo", codigoLiga.trim().toUpperCase())
      .eq("estado", "activa")
      .single();

    if (!liga) {
      alert("Liga no encontrada o no activa");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("liga_participantes").insert({
      liga_id: liga.id,
      participante_id: participante.id,
    });

    if (error) {
      alert("Ya perteneces a esta liga");
      setLoading(false);
      return;
    }

    setCodigoLiga("");

    await cargar();

    alert("Te has unido correctamente");

    setLoading(false);
  }

  async function copiarCodigo(codigo: string) {
    await navigator.clipboard.writeText(codigo);

    alert("Código copiado");
  }

  return (
    <main className="page">
      <div className="container">
        <div className="header">
          <div className="headerIcon">
            <Users size={34} />
          </div>

          <div>
            <h1>Ligas privadas</h1>

            <p>
              Crea ligas privadas o únete a una liga activa mediante código.
            </p>
          </div>
        </div>

        <div className="actionsGrid">
          <section className="card">
            <div className="cardTop">
              <Plus size={24} />

              <h2>Solicitar liga</h2>
            </div>

            <p className="cardText">
              La liga quedará pendiente hasta que un administrador la apruebe.
            </p>

            <input
              type="text"
              placeholder="Liga Familia"
              value={nombreLiga}
              onChange={(e) => setNombreLiga(e.target.value)}
            />

            <button onClick={solicitarLiga} disabled={loading}>
              Solicitar liga
            </button>
          </section>

          <section className="card">
            <div className="cardTop">
              <LogIn size={24} />

              <h2>Unirse por código</h2>
            </div>

            <p className="cardText">
              Introduce el código de una liga aprobada para unirte.
            </p>

            <input
              type="text"
              placeholder="ABC123"
              value={codigoLiga}
              onChange={(e) => setCodigoLiga(e.target.value)}
            />

            <button onClick={unirseLiga} disabled={loading}>
              Unirse a liga
            </button>
          </section>
        </div>

        <section className="myLeagues">
          <div className="myLeaguesHeader">
            <Trophy size={26} />

            <h2>Mis ligas</h2>
          </div>

          {misLigas.length === 0 ? (
            <div className="emptyBox">
              Aún no perteneces a ninguna liga activa.
            </div>
          ) : (
            <div className="leaguesGrid">
              {misLigas.map((liga) => (
                <article key={liga.id} className="leagueCard">
                  <div>
                    <p className="leagueLabel">Liga</p>

                    <h3>{liga.nombre}</h3>
                  </div>

                  <EstadoLiga estado={liga.estado} />

                  <div className="leagueBottom">
                    <div>
                      <p className="leagueCodeLabel">Código</p>

                      <p className="leagueCode">{liga.codigo}</p>
                    </div>

                    <button
                      className="copyButton"
                      onClick={() => copiarCodigo(liga.codigo)}
                    >
                      <Copy size={18} />
                    </button>
                  </div>

                  <Link
                    href={`/ligas/${liga.id}`}
                    className="ligaDetailButton"
                  >
                    Ver liga
                    <ArrowRight size={18} />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {ligasPendientes.length > 0 && (
          <section className="pendingSection">
            <div className="myLeaguesHeader">
              <Clock3 size={24} />

              <h2>Pendientes de aprobación</h2>
            </div>

            <div className="leaguesGrid">
              {ligasPendientes.map((liga) => (
                <article key={liga.id} className="leagueCard">
                  <div>
                    <p className="leagueLabel">Liga</p>

                    <h3>{liga.nombre}</h3>
                  </div>

                  <EstadoLiga estado={liga.estado} />

                  <div className="pendingInfo">
                    Tu solicitud está pendiente de revisión por un administrador.
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

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
          max-width: 1100px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 30px;
        }

        .headerIcon {
          width: 74px;
          height: 74px;
          border-radius: 24px;
          background: #2563eb;
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
          margin-top: 6px;
        }

        .actionsGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 22px;
          margin-bottom: 42px;
        }

        .card,
        .leagueCard {
          background:
            linear-gradient(
              145deg,
              rgba(15,23,42,0.98),
              rgba(15,23,42,0.65)
            );
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 28px;
          padding: 26px;
        }

        .cardTop {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .cardTop h2 {
          font-size: 28px;
          font-weight: 900;
          margin: 0;
        }

        .cardText {
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 18px;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          padding: 16px;
          color: white;
          font-size: 16px;
          outline: none;
        }

        input::placeholder {
          color: #64748b;
        }

        button {
          margin-top: 18px;
          width: 100%;
          border: none;
          border-radius: 16px;
          background: #2563eb;
          color: white;
          font-weight: 900;
          padding: 15px;
          cursor: pointer;
        }

        .myLeagues {
          margin-bottom: 42px;
        }

        .myLeaguesHeader {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .myLeaguesHeader h2 {
          font-size: 34px;
          font-weight: 900;
          margin: 0;
        }

        .emptyBox {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 24px;
          padding: 26px;
          text-align: center;
          color: #94a3b8;
          font-weight: 800;
        }

        .leaguesGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .leagueLabel {
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 900;
        }

        .leagueCard h3 {
          font-size: 28px;
          font-weight: 900;
          margin-top: 8px;
        }

        .status {
          margin-top: 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 900;
        }

        .status.active {
          background: rgba(22,163,74,0.18);
          border: 1px solid rgba(22,163,74,0.35);
          color: #86efac;
        }

        .status.pending {
          background: rgba(250,204,21,0.16);
          border: 1px solid rgba(250,204,21,0.28);
          color: #fde68a;
        }

        .status.rejected {
          background: rgba(239,68,68,0.16);
          border: 1px solid rgba(239,68,68,0.28);
          color: #fca5a5;
        }

        .leagueBottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 24px;
          gap: 16px;
        }

        .leagueCodeLabel {
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 900;
        }

        .leagueCode {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-top: 4px;
        }

        .copyButton {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          margin-top: 0;
          flex-shrink: 0;
        }

        .pendingInfo {
          color: #94a3b8;
          font-weight: 800;
          line-height: 1.5;
          margin-top: 22px;
        }

        .ligaDetailButton {
          margin-top: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 16px;
          background: rgba(37,99,235,0.18);
          border: 1px solid rgba(37,99,235,0.32);
          color: #bfdbfe;
          font-weight: 900;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .ligaDetailButton:hover {
          background: rgba(37,99,235,0.28);
          transform: translateY(-1px);
        }

        @media (max-width: 760px) {
          .actionsGrid {
            grid-template-columns: 1fr;
          }

          .header {
            align-items: flex-start;
          }

          .header h1 {
            font-size: 34px;
          }

          .myLeaguesHeader h2 {
            font-size: 28px;
          }
        }
      `}</style>
    </main>
  );
}

function EstadoLiga({ estado }: { estado: string }) {
  if (estado === "activa") {
    return (
      <div className="status active">
        <CheckCircle2 size={16} />
        Activa
      </div>
    );
  }

  if (estado === "rechazada") {
    return (
      <div className="status rejected">
        <XCircle size={16} />
        Rechazada
      </div>
    );
  }

  return (
    <div className="status pending">
      <Clock3 size={16} />
      Pendiente
    </div>
  );
}