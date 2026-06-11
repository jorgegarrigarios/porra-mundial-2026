"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  Shield,
  Trophy,
} from "lucide-react";

import { comprobarAdminActual } from "@/lib/admin";
import { recalcularPuntos } from "@/lib/recalcularPuntos";
import { supabase } from "@/lib/supabase";

type Partido = {
  id: number;
  local: string;
  visitante: string;
  fase: string | null;
  resultado_local: number | null;
  resultado_visitante: number | null;
  fecha_inicio: string | null;
  clasificado_real: string | null;
};

type ValoresPartido = {
  local: string;
  visitante: string;
  fechaInicio: string;
  clasificadoReal: string;
};

type ResumenImportacionApi = {
  fixturesEncontrados?: number;
  mapeados?: number;
  actualizados?: number;
  ignorados?: number;
  pronosticosActualizados?: number;
};

type RespuestaImportacionApi = {
  ok?: boolean;
  error?: string;
  resumen?: ResumenImportacionApi;
  errores?: string[];
  force?: boolean;
};

function esEliminatoria(fase: string | null) {
  return fase?.trim().toLowerCase() !== "fase de grupos";
}

function normalizarTexto(valor: string) {
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

function tieneResultadoGuardado(partido: Partido) {
  return partido.resultado_local !== null && partido.resultado_visitante !== null;
}

function formatearMensajeImportacion(data: RespuestaImportacionApi) {
  const resumen = data.resumen;

  if (!resumen) {
    return data.ok
      ? "Resultados importados desde API correctamente."
      : data.error || "No se pudieron importar resultados desde API.";
  }

  return [
    `API resultados: ${resumen.actualizados ?? 0} partidos actualizados`,
    `${resumen.mapeados ?? 0}/${resumen.fixturesEncontrados ?? 0} fixtures mapeados`,
    `${resumen.pronosticosActualizados ?? 0} pronósticos recalculados`,
  ].join(" · ");
}

export default function AdminResultadosPage() {
  const router = useRouter();

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [autorizado, setAutorizado] = useState(false);

  const [valores, setValores] = useState<Record<number, ValoresPartido>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [importandoApi, setImportandoApi] = useState(false);

  async function cargarPartidos() {
    const { data, error: errorPartidos } = await supabase
      .from("partidos")
      .select("*")
      .order("fecha_inicio", { ascending: true, nullsFirst: false });

    if (errorPartidos) {
      throw new Error(errorPartidos.message);
    }

    const partidosCargados = (data ?? []) as Partido[];
    setPartidos(partidosCargados);

    const iniciales: Record<number, ValoresPartido> = {};

    partidosCargados.forEach((p) => {
      iniciales[p.id] = {
        local: p.resultado_local !== null ? p.resultado_local.toString() : "",
        visitante:
          p.resultado_visitante !== null
            ? p.resultado_visitante.toString()
            : "",
        fechaInicio: p.fecha_inicio
          ? new Date(p.fecha_inicio).toISOString().slice(0, 16)
          : "",
        clasificadoReal: p.clasificado_real ?? "",
      };
    });

    setValores(iniciales);
  }

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        setCargando(true);
        setMensaje(null);
        setError(null);

        const admin = await comprobarAdminActual();

        if (!activo) return;

        if (!admin.isAdmin) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            router.replace("/login");
            return;
          }

          router.replace("/");
          return;
        }

        setAutorizado(true);
        await cargarPartidos();
      } catch (err) {
        console.error("Error cargando partidos:", err);
        if (activo) {
          setError(
            err instanceof Error
              ? `Error cargando partidos: ${err.message}`
              : "Error cargando partidos."
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [router]);

  async function importarResultadosDesdeApi(force = false) {
    try {
      setImportandoApi(true);
      setMensaje(null);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError("No se ha podido recuperar tu sesión de administrador. Cierra sesión y vuelve a entrar.");
        return;
      }

      const response = await fetch("/api/admin/importar-resultados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ force }),
      });

      const data = (await response.json().catch(() => ({}))) as RespuestaImportacionApi;

      if (!response.ok || !data.ok) {
        const errores = data.errores?.length ? ` ${data.errores.join(" | ")}` : "";
        throw new Error(data.error || `Error HTTP ${response.status}.${errores}`);
      }

      await cargarPartidos();
      setMensaje(formatearMensajeImportacion(data));
    } catch (err) {
      console.error("Error importando resultados desde API:", err);
      setError(
        err instanceof Error
          ? err.message
          : "No se han podido importar resultados desde API."
      );
    } finally {
      setImportandoApi(false);
    }
  }

  async function guardarResultado(partido: Partido) {
    setGuardandoId(partido.id);
    setMensaje(null);
    setError(null);

    try {
      const local = valores[partido.id]?.local ?? "";
      const visitante = valores[partido.id]?.visitante ?? "";
      const fechaInicio = valores[partido.id]?.fechaInicio ?? "";
      const clasificadoReal = valores[partido.id]?.clasificadoReal ?? "";

      const resultadoLocal = local === "" ? null : Number(local);
      const resultadoVisitante = visitante === "" ? null : Number(visitante);
      const clasificadoRealLimpio = normalizarTexto(clasificadoReal);

      if (
        resultadoLocal !== null &&
        (!Number.isInteger(resultadoLocal) || resultadoLocal < 0)
      ) {
        setError("Resultado local no válido.");
        return;
      }

      if (
        resultadoVisitante !== null &&
        (!Number.isInteger(resultadoVisitante) || resultadoVisitante < 0)
      ) {
        setError("Resultado visitante no válido.");
        return;
      }

      if (
        esEliminatoria(partido.fase) &&
        resultadoLocal !== null &&
        resultadoVisitante !== null &&
        resultadoLocal === resultadoVisitante &&
        !clasificadoRealLimpio
      ) {
        setError("En una eliminatoria empatada debes indicar quién se clasifica.");
        return;
      }

      const { error: errorPartido } = await supabase
        .from("partidos")
        .update({
          resultado_local: resultadoLocal,
          resultado_visitante: resultadoVisitante,
          fecha_inicio: fechaInicio ? new Date(fechaInicio).toISOString() : null,
          clasificado_real: clasificadoRealLimpio,
        })
        .eq("id", partido.id);

      if (errorPartido) {
        console.error("Error guardando partido:", errorPartido.message);
        setError("Error guardando partido: " + errorPartido.message);
        return;
      }

      await recalcularPuntos();

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
                clasificado_real: clasificadoRealLimpio,
              }
            : p
        )
      );

      setMensaje(
        `${partido.local} vs ${partido.visitante}: partido guardado y ranking V1.2 recalculado.`
      );
    } catch (error) {
      console.error("Error inesperado:", error);
      setError("Error inesperado guardando el partido.");
    } finally {
      setGuardandoId(null);
    }
  }

  if (cargando) {
    return (
      <main className="adminPage">
        <div className="container">
          <div className="loadingBox">
            <Loader2 className="spin" size={28} />
            <span>Comprobando permisos de administrador...</span>
          </div>
        </div>
        <Styles />
      </main>
    );
  }

  if (!autorizado) {
    return null;
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
            <p>
              Actualiza resultados desde API-FOOTBALL o manualmente, y recalcula puntos V1.2 automáticamente.
            </p>
          </div>
        </div>

        <section className="apiPanel">
          <div>
            <p className="apiEyebrow">API-FOOTBALL</p>
            <h2>Actualizar resultados automáticamente</h2>
            <p>
              Importa resultados finalizados desde API, guarda marcadores oficiales y recalcula el ranking.
              Durante el partido puede actualizar el estado, pero los puntos se consolidan al finalizar.
            </p>
          </div>

          <button
            type="button"
            className="apiButton"
            disabled={importandoApi}
            onClick={() => importarResultadosDesdeApi(false)}
          >
            {importandoApi ? (
              <Loader2 className="spin" size={20} />
            ) : (
              <RefreshCw size={20} />
            )}
            {importandoApi ? "Actualizando..." : "Actualizar desde API"}
          </button>
        </section>

        {mensaje && (
          <div className="successBox">
            <CheckCircle2 size={20} />
            <span>{mensaje}</span>
          </div>
        )}

        {error && (
          <div className="errorBox">
            <Shield size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="cards">
          {partidos.map((partido) => {
            const eliminatoria = esEliminatoria(partido.fase);
            const resultadoLocal = valores[partido.id]?.local ?? "";
            const resultadoVisitante = valores[partido.id]?.visitante ?? "";
            const resultadoGuardado = tieneResultadoGuardado(partido);
            const hayEmpateEliminatoria =
              eliminatoria &&
              resultadoLocal !== "" &&
              resultadoVisitante !== "" &&
              Number(resultadoLocal) === Number(resultadoVisitante);

            return (
              <section
                key={partido.id}
                className={`card ${resultadoGuardado ? "cardSaved" : ""}`}
              >
                <div className="matchInfo">
                  <div className="matchTop">
                    <p className="label">{partido.fase || "Partido"}</p>

                    {resultadoGuardado && (
                      <span className="savedBadge">
                        <CheckCircle2 size={15} />
                        Resultado guardado
                      </span>
                    )}
                  </div>

                  <h2>
                    {partido.local} vs {partido.visitante}
                  </h2>

                  {resultadoGuardado && (
                    <p className="savedResult">
                      Marcador actual: {partido.resultado_local} -{" "}
                      {partido.resultado_visitante}
                      {partido.clasificado_real && (
                        <span> · Clasifica: {partido.clasificado_real}</span>
                      )}
                    </p>
                  )}
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

                {eliminatoria && (
                  <div className="qualifiedBlock">
                    <label>
                      <Award size={16} />
                      Clasificado real
                    </label>

                    <select
                      value={valores[partido.id]?.clasificadoReal ?? ""}
                      onChange={(e) =>
                        setValores({
                          ...valores,
                          [partido.id]: {
                            ...valores[partido.id],
                            clasificadoReal: e.target.value,
                          },
                        })
                      }
                      className={hayEmpateEliminatoria ? "requiredSelect" : ""}
                    >
                      <option value="">Sin definir</option>
                      <option value={partido.local}>{partido.local}</option>
                      <option value={partido.visitante}>{partido.visitante}</option>
                    </select>

                    {hayEmpateEliminatoria && (
                      <p>Obligatorio si la eliminatoria termina empatada.</p>
                    )}
                  </div>
                )}

                <button
                  disabled={guardandoId === partido.id || importandoApi}
                  onClick={() => guardarResultado(partido)}
                >
                  {resultadoGuardado ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {guardandoId === partido.id
                    ? "Guardando..."
                    : resultadoGuardado
                    ? "Actualizar partido"
                    : "Guardar partido"}
                </button>
              </section>
            );
          })}
        </div>

        <div className="note">
          <Trophy size={20} />
          Al guardar un partido manualmente o importar desde API se recalculan automáticamente partidos, grupos,
          bonus y ranking V1.2.
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
        max-width: 1180px;
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
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
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

      .apiPanel {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 18px;
        border-radius: 28px;
        border: 1px solid rgba(34,197,94,0.26);
        background: linear-gradient(135deg, rgba(34,197,94,0.14), rgba(15,23,42,0.84));
        padding: 24px;
      }

      .apiEyebrow {
        margin: 0 0 8px;
        color: #86efac;
        font-size: 12px;
        text-transform: uppercase;
        font-weight: 950;
        letter-spacing: 1px;
      }

      .apiPanel h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 950;
      }

      .apiPanel p:not(.apiEyebrow) {
        margin: 8px 0 0;
        color: #cbd5e1;
        line-height: 1.55;
        font-weight: 750;
        max-width: 720px;
      }

      .apiButton {
        background: #16a34a;
        min-width: 230px;
      }

      .apiButton:hover {
        background: #15803d;
      }

      .successBox,
      .errorBox {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
        border-radius: 22px;
        padding: 16px 18px;
        font-weight: 900;
      }

      .successBox {
        background: rgba(34,197,94,0.12);
        border: 1px solid rgba(34,197,94,0.28);
        color: #bbf7d0;
      }

      .errorBox {
        background: rgba(248,113,113,0.12);
        border: 1px solid rgba(248,113,113,0.30);
        color: #fecaca;
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
        grid-template-columns: minmax(220px, 1fr) 230px auto 220px auto;
        gap: 20px;
        align-items: center;
      }

      .cardSaved {
        border-color: rgba(34,197,94,0.28);
        box-shadow: 0 0 0 1px rgba(34,197,94,0.06);
      }

      .matchTop {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }

      .label {
        color: #94a3b8;
        font-size: 12px;
        text-transform: uppercase;
        font-weight: 900;
        letter-spacing: 1px;
        margin: 0;
      }

      .savedBadge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        background: rgba(34,197,94,0.12);
        border: 1px solid rgba(34,197,94,0.25);
        color: #bbf7d0;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 900;
      }

      .card h2 {
        font-size: 24px;
        font-weight: 900;
        margin: 8px 0 0;
      }

      .savedResult {
        margin: 8px 0 0;
        color: #bbf7d0;
        font-size: 13px;
        font-weight: 850;
      }

      .dateBlock label,
      .qualifiedBlock label {
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

      .dateBlock input,
      .qualifiedBlock select {
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

      .qualifiedBlock p {
        margin: 8px 0 0;
        color: #fde68a;
        font-size: 12px;
        font-weight: 800;
      }

      .requiredSelect {
        border-color: #facc15 !important;
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

      @media (max-width: 1180px) {
        .card {
          grid-template-columns: 1fr 230px auto;
        }

        .qualifiedBlock {
          grid-column: 1 / 3;
        }
      }

      @media (max-width: 900px) {
        .apiPanel {
          flex-direction: column;
          align-items: stretch;
        }

        .apiButton {
          width: 100%;
        }

        .card {
          grid-template-columns: 1fr;
        }

        .qualifiedBlock {
          grid-column: auto;
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
          padding: 84px 12px 110px;
        }
      }
    `}</style>
  );
}
