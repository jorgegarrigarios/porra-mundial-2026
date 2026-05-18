"use client";

import { useEffect, useState } from "react";

import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock3,
  Users,
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
  created_at: string;
};

export default function AdminLigasPage() {
  const [usuario, setUsuario] =
    useState<Participante | null>(null);

  const [ligas, setLigas] = useState<Liga[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      const participante =
        await obtenerParticipanteActual();

      setUsuario(participante);

      if (!participante || participante.role !== "admin") {
        setLoading(false);
        return;
      }

      cargarLigas();
    }

    cargar();
  }, []);

  async function cargarLigas() {
    const { data } = await supabase
      .from("ligas")
      .select("*")
      .order("created_at", { ascending: false });

    setLigas(data ?? []);

    setLoading(false);
  }

  async function actualizarEstado(
    ligaId: number,
    estado: string
  ) {
    await supabase
      .from("ligas")
      .update({
        estado,
      })
      .eq("id", ligaId);

    cargarLigas();
  }

  if (loading) {
    return (
      <main className="page">
        <div className="container">
          <div className="emptyBox">
            Cargando panel admin...
          </div>
        </div>

        <Styles />
      </main>
    );
  }

  if (!usuario || usuario.role !== "admin") {
    return (
      <main className="page">
        <div className="container">
          <div className="blockedCard">
            <Shield size={40} />

            <h1>Acceso restringido</h1>

            <p>
              Necesitas permisos de administrador.
            </p>
          </div>
        </div>

        <Styles />
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <div className="header">
          <div className="headerIcon">
            <Shield size={34} />
          </div>

          <div>
            <h1>Moderación de ligas</h1>

            <p>
              Gestiona solicitudes y aprobación de ligas privadas.
            </p>
          </div>
        </div>

        {ligas.length === 0 ? (
          <div className="emptyBox">
            No hay ligas registradas.
          </div>
        ) : (
          <div className="leagueList">
            {ligas.map((liga) => (
              <article key={liga.id} className="leagueCard">
                <div className="topRow">
                  <div>
                    <p className="label">Liga</p>

                    <h2>{liga.nombre}</h2>
                  </div>

                  <div className="codeBox">
                    {liga.codigo}
                  </div>
                </div>

                <div className="statusRow">
                  {liga.estado === "pendiente" && (
                    <div className="status pending">
                      <Clock3 size={16} />
                      Pendiente
                    </div>
                  )}

                  {liga.estado === "activa" && (
                    <div className="status active">
                      <CheckCircle2 size={16} />
                      Activa
                    </div>
                  )}

                  {liga.estado === "rechazada" && (
                    <div className="status rejected">
                      <XCircle size={16} />
                      Rechazada
                    </div>
                  )}
                </div>

                <div className="actions">
                  <button
                    className="approveButton"
                    onClick={() =>
                      actualizarEstado(
                        liga.id,
                        "activa"
                      )
                    }
                  >
                    <CheckCircle2 size={18} />
                    Aprobar
                  </button>

                  <button
                    className="rejectButton"
                    onClick={() =>
                      actualizarEstado(
                        liga.id,
                        "rechazada"
                      )
                    }
                  >
                    <XCircle size={18} />
                    Rechazar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Styles />
    </main>
  );
}

function Styles() {
  return (
    <style>{`
      .page {
        min-height: 100vh;

        background:
          radial-gradient(circle at top, rgba(220,38,38,0.18), transparent 30%),
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

        background: #dc2626;

        display: flex;
        align-items: center;
        justify-content: center;
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

      .leagueList {
        display: grid;
        gap: 18px;
      }

      .leagueCard {
        background:
          linear-gradient(
            145deg,
            rgba(15,23,42,0.98),
            rgba(15,23,42,0.65)
          );

        border: 1px solid rgba(255,255,255,0.12);

        border-radius: 28px;

        padding: 24px;
      }

      .topRow {
        display: flex;
        justify-content: space-between;
        align-items: center;

        gap: 20px;
      }

      .label {
        color: #94a3b8;

        font-size: 12px;

        text-transform: uppercase;

        letter-spacing: 1px;

        font-weight: 900;
      }

      .leagueCard h2 {
        font-size: 30px;
        font-weight: 900;

        margin-top: 8px;
      }

      .codeBox {
        background: rgba(255,255,255,0.08);

        border: 1px solid rgba(255,255,255,0.12);

        border-radius: 16px;

        padding: 14px 18px;

        font-weight: 900;

        letter-spacing: 2px;
      }

      .statusRow {
        margin-top: 18px;
      }

      .status {
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

      .actions {
        display: flex;
        gap: 14px;

        margin-top: 24px;
      }

      .approveButton,
      .rejectButton {
        flex: 1;

        border: none;

        border-radius: 16px;

        padding: 15px;

        font-weight: 900;

        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;

        cursor: pointer;
      }

      .approveButton {
        background: #16a34a;
        color: white;
      }

      .rejectButton {
        background: #dc2626;
        color: white;
      }

      .emptyBox,
      .blockedCard {
        background: rgba(255,255,255,0.06);

        border: 1px solid rgba(255,255,255,0.10);

        border-radius: 28px;

        padding: 28px;

        text-align: center;

        color: #94a3b8;

        font-weight: 900;
      }

      .blockedCard h1 {
        color: white;
        margin-top: 18px;
      }

      .blockedCard p {
        margin-top: 8px;
      }

      @media (max-width: 760px) {
        .topRow {
          flex-direction: column;
          align-items: flex-start;
        }

        .actions {
          flex-direction: column;
        }

        .header h1 {
          font-size: 34px;
        }
      }
    `}</style>
  );
}