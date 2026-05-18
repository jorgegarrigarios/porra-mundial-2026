"use client";

import { useEffect, useState } from "react";
import { Save, Shield, Trophy, Lock, CalendarDays } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { calcularPuntos } from "@/lib/puntos";
import { obtenerParticipanteActual } from "@/lib/participante";

type Partido = {
  id: number;
  local: string;
  visitante: string;
  resultado_local: number | null;
  resultado_visitante: number | null;
  fecha_inicio: string | null;
};

type Pronostico = {
  id: number;
  partido_id: number;
  goles_local: number | null;
  goles_visitante: number | null;
};

type Participante = {
  id: number;
  nombre: string;
  role?: string | null;
};

export default function AdminResultadosPage() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [usuario, setUsuario] = useState<Participante | null>(null);

  const [valores, setValores] = useState<
    Record<number, { local: string; visitante: string; fechaInicio: string }>
  >({});

  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);

    const participante = await obtenerParticipanteActual();
    setUsuario(participante);

    if (!participante || participante.role !== "admin") {
      setCargando(false);
      return;
    }

    const { data, error } = await supabase
      .from("partidos")
      .select("*")
      .order("fecha_inicio", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error cargando partidos:", error.message);
      alert("Error cargando partidos: " + error.message);
      setCargando(false);
      return;
    }

    setPartidos(data ?? []);

    const iniciales: Record<
      number,
      { local: string; visitante: string; fechaInicio: string }
    > = {};

    (data ?? []).forEach((p: Partido) => {
      iniciales[p.id] = {
        local: p.resultado_local !== null ? p.resultado_local.toString() : "",
        visitante:
          p.resultado_visitante !== null
            ? p.resultado_visitante.toString()
            : "",
        fechaInicio: p.fecha_inicio
          ? new Date(p.fecha_inicio).toISOString().slice(0, 16)
          : "",
      };
    });

    setValores(iniciales);
    setCargando(false);
  }

  async function guardarResultado(partido: Partido) {
    setGuardandoId(partido.id);

    try {
      const local = valores[partido.id]?.local ?? "";
      const visitante = valores[partido.id]?.visitante ?? "";
      const fechaInicio = valores[partido.id]?.fechaInicio ?? "";

      const resultadoLocal = local === "" ? null : Number(local);
      const resultadoVisitante = visitante === "" ? null : Number(visitante);

      if (
        resultadoLocal !== null &&
        (Number.isNaN(resultadoLocal) || resultadoLocal < 0)
      ) {
        alert("Resultado local no válido.");
        return;
      }

      if (
        resultadoVisitante !== null &&
        (Number.isNaN(resultadoVisitante) || resultadoVisitante < 0)
      ) {
        alert("Resultado visitante no válido.");
        return;
      }

      const { error: errorPartido } = await supabase
        .from("partidos")
        .update({
          resultado_local: resultadoLocal,
          resultado_visitante: resultadoVisitante,
          fecha_inicio: fechaInicio ? new Date(fechaInicio).toISOString() : null,
        })
        .eq("id", partido.id);

      if (errorPartido) {
        console.error("Error guardando partido:", errorPartido.message);
        alert("Error guardando partido: " + errorPartido.message);
        return;
      }

      const { data: pronosticos, error: errorPronosticos } = await supabase
        .from("pronosticos")
        .select("id, partido_id, goles_local, goles_visitante")
        .eq("partido_id", partido.id);

      if (errorPronosticos) {
        console.error("Error cargando pronósticos:", errorPronosticos.message);
        alert(
          "Resultado guardado, pero no se pudieron cargar pronósticos: " +
            errorPronosticos.message
        );
        return;
      }

      let actualizados = 0;
      let errores = 0;

      if (resultadoLocal !== null && resultadoVisitante !== null) {
        for (const pronostico of (pronosticos ?? []) as Pronostico[]) {
          if (
            pronostico.goles_local === null ||
            pronostico.goles_visitante === null
          ) {
            continue;
          }

          const puntos = calcularPuntos(
            pronostico.goles_local,
            pronostico.goles_visitante,
            resultadoLocal,
            resultadoVisitante
          );

          const { error: errorUpdate } = await supabase
            .from("pronosticos")
            .update({ puntos })
            .eq("id", pronostico.id);

          if (errorUpdate) {
            errores++;
            console.error(
              `Error actualizando pronóstico ${pronostico.id}:`,
              errorUpdate.message
            );
          } else {
            actualizados++;
          }
        }
      }

      setPartidos((prev) =>
        prev.map((p) =>
          p.id === partido.id
            ? {
                ...p,
                resultado_local: resultadoLocal,
                resultado_visitante: resultadoVisitante,
                fecha_inicio: fechaInicio
                  ? new Date(fechaInicio).toISOString()
                  : null,
              }
            : p
        )
      );

      if (errores > 0) {
        alert(
          `Partido guardado, pero hubo ${errores} error(es) actualizando puntos.`
        );
        return;
      }

      alert(`Partido guardado. Pronósticos actualizados: ${actualizados}`);
    } catch (error) {
      console.error("Error inesperado:", error);
      alert("Error inesperado guardando el partido.");
    } finally {
      setGuardandoId(null);
    }
  }

  if (cargando) {
    return (
      <main className="adminPage">
        <div className="container">
          <div className="loadingBox">Cargando panel admin...</div>
        </div>
        <Styles />
      </main>
    );
  }

  if (!usuario || usuario.role !== "admin") {
    return (
      <main className="adminPage">
        <div className="container">
          <section className="blockedCard">
            <div className="blockedIcon">
              <Lock size={36} />
            </div>

            <h1>Acceso restringido</h1>
            <p>Necesitas permisos de administrador para acceder a esta zona.</p>

            <a href="/" className="backButton">
              Volver al inicio
            </a>
          </section>
        </div>
        <Styles />
      </main>
    );
  }

  return (
    <main className="adminPage">
      <div className="container">
        <div className="header">
          <div className="headerIcon">
            <Shield size={30} />
          </div>

          <div>
            <h1>Admin resultados</h1>
            <p>Actualiza inicio, resultados y recalcula puntos automáticamente.</p>
          </div>
        </div>

        <div className="cards">
          {partidos.map((partido) => (
            <section key={partido.id} className="card">
              <div className="matchInfo">
                <p className="label">Partido</p>
                <h2>
                  {partido.local} vs {partido.visitante}
                </h2>
              </div>

              <div className="dateBlock">
                <label>
                  <CalendarDays size={16} />
                  Inicio real
                </label>

                <input
                  type="datetime-local"
                  value={valores[partido.id]?.fechaInicio ?? ""}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [partido.id]: {
                        ...valores[partido.id],
                        fechaInicio: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="scoreRow">
                <input
                  type="number"
                  min="0"
                  value={valores[partido.id]?.local ?? ""}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [partido.id]: {
                        ...valores[partido.id],
                        local: e.target.value,
                      },
                    })
                  }
                />

                <span>-</span>

                <input
                  type="number"
                  min="0"
                  value={valores[partido.id]?.visitante ?? ""}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [partido.id]: {
                        ...valores[partido.id],
                        visitante: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <button
                disabled={guardandoId === partido.id}
                onClick={() => guardarResultado(partido)}
              >
                <Save size={18} />
                {guardandoId === partido.id
                  ? "Guardando..."
                  : "Guardar partido"}
              </button>
            </section>
          ))}
        </div>

        <div className="note">
          <Trophy size={20} />
          La fecha de inicio bloqueará automáticamente los pronósticos cuando el
          partido empiece.
        </div>
      </div>

      <Styles />
    </main>
  );
}

function Styles() {
  return (
    <style>{`
      .adminPage {
        min-height: 100vh;
        background: linear-gradient(180deg, #020617 0%, #111827 100%);
        color: white;
        padding: 32px 16px 110px;
      }

      .container {
        max-width: 980px;
        margin: 0 auto;
      }

      .loadingBox {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 22px;
        padding: 28px;
        text-align: center;
        color: #94a3b8;
        font-weight: 800;
      }

      .blockedCard {
        max-width: 520px;
        margin: 80px auto 0;
        text-align: center;
        background: linear-gradient(
          145deg,
          rgba(15,23,42,0.98),
          rgba(15,23,42,0.65)
        );
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 32px;
        padding: 34px;
      }

      .blockedIcon {
        width: 74px;
        height: 74px;
        border-radius: 24px;
        background: #dc2626;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      }

      .blockedCard h1 {
        font-size: 32px;
        font-weight: 900;
        margin: 0;
      }

      .blockedCard p {
        color: #94a3b8;
        line-height: 1.6;
        margin-top: 12px;
      }

      .backButton {
        margin-top: 24px;
        display: inline-flex;
        justify-content: center;
        background: #2563eb;
        color: white;
        text-decoration: none;
        padding: 15px 22px;
        border-radius: 16px;
        font-weight: 900;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 28px;
      }

      .headerIcon {
        width: 62px;
        height: 62px;
        border-radius: 20px;
        background: #dc2626;
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

      .cards {
        display: grid;
        gap: 18px;
      }

      .card {
        background: linear-gradient(
          145deg,
          rgba(15,23,42,0.98),
          rgba(15,23,42,0.65)
        );
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 28px;
        padding: 24px;
        display: grid;
        grid-template-columns: 1fr 230px auto auto;
        gap: 20px;
        align-items: center;
      }

      .label {
        color: #94a3b8;
        font-size: 12px;
        text-transform: uppercase;
        font-weight: 900;
        letter-spacing: 1px;
      }

      .card h2 {
        font-size: 24px;
        font-weight: 900;
        margin-top: 6px;
      }

      .dateBlock label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #94a3b8;
        font-size: 12px;
        text-transform: uppercase;
        font-weight: 900;
        letter-spacing: 1px;
        margin-bottom: 8px;
      }

      .dateBlock input {
        width: 100%;
        box-sizing: border-box;
        border-radius: 14px;
        background: #111827;
        border: 2px solid #374151;
        color: white;
        padding: 12px;
        font-weight: 800;
        outline: none;
      }

      .scoreRow {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .scoreRow input {
        width: 66px;
        height: 66px;
        border-radius: 20px;
        text-align: center;
        font-size: 30px;
        font-weight: 900;
        color: white;
        background: #111827;
        border: 2px solid #374151;
        outline: none;
      }

      .scoreRow span {
        font-size: 30px;
        font-weight: 900;
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: none;
        border-radius: 16px;
        padding: 14px 18px;
        background: #2563eb;
        color: white;
        font-weight: 900;
        cursor: pointer;
        white-space: nowrap;
      }

      button:hover {
        background: #1d4ed8;
      }

      button:disabled {
        background: rgba(148,163,184,0.25);
        color: #94a3b8;
        cursor: not-allowed;
      }

      .note {
        margin-top: 22px;
        background: rgba(250,204,21,0.10);
        border: 1px solid rgba(250,204,21,0.24);
        color: #fde68a;
        border-radius: 22px;
        padding: 18px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 800;
      }

      @media (max-width: 900px) {
        .card {
          grid-template-columns: 1fr;
        }

        .scoreRow input {
          width: 100%;
        }

        .scoreRow {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
        }
      }

      @media (max-width: 520px) {
        .header h1 {
          font-size: 34px;
        }

        .adminPage {
          padding: 24px 12px 110px;
        }
      }
    `}</style>
  );
}