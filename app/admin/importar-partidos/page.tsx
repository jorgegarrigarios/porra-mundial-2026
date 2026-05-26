"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Database,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { comprobarAdminActual } from "@/lib/admin";

type PartidoImportado = {
  local: string;
  visitante: string;
  local_code?: string;
  visitante_code?: string;
  fecha_inicio?: string;
  estadio?: string;
  ciudad?: string;
  fase?: string;
  grupo?: string;
  jornada?: number;
};

type ResumenImportacionApi = {
  fixturesEncontrados: number;
  mapeados: number;
  actualizados: number;
  ignorados: number;
  pronosticosActualizados: number;
};

type RespuestaImportacionApi = {
  ok: boolean;
  resumen?: ResumenImportacionApi;
  errores?: string[];
  error?: string;
  force?: boolean;
};

function traducirErrorFootballApi(mensaje: string) {
  const normalizado = mensaje.toLowerCase();

  if (
    normalizado.includes("free plans do not have access") ||
    normalizado.includes("do not have access to this season") ||
    normalizado.includes("plan")
  ) {
    return "Tu plan actual de Football API no permite consultar la temporada 2026. La integración está preparada, pero para usar resultados automáticos del Mundial 2026 necesitas un plan compatible de API-Football. Mientras tanto, puedes seguir usando la importación manual JSON como backup seguro.";
  }

  if (
    normalizado.includes("api_football_key") ||
    normalizado.includes("football api error")
  ) {
    return "No se ha podido consultar Football API. Revisa que API_FOOTBALL_KEY esté configurada correctamente en local y en Vercel.";
  }

  return mensaje;
}

export default function ImportarPartidosPage() {
  const router = useRouter();

  const [cargandoPermisos, setCargandoPermisos] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState("");
  const [resultadoApi, setResultadoApi] = useState("");
  const [error, setError] = useState("");
  const [importandoJson, setImportandoJson] = useState(false);
  const [importandoApi, setImportandoApi] = useState(false);

  useEffect(() => {
    let activo = true;

    async function validarAdmin() {
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
      setCargandoPermisos(false);
    }

    validarAdmin();

    return () => {
      activo = false;
    };
  }, [router]);

  async function importarPartidos() {
    setResultado("");
    setResultadoApi("");
    setError("");
    setImportandoJson(true);

    try {
      const partidos: PartidoImportado[] = JSON.parse(texto);

      if (!Array.isArray(partidos)) {
        setError("El JSON debe ser una lista de partidos.");
        return;
      }

      const partidosFormateados = partidos.map((p) => ({
        local: p.local,
        visitante: p.visitante,
        local_code: p.local_code ?? null,
        visitante_code: p.visitante_code ?? null,
        fecha_inicio: p.fecha_inicio ?? null,
        estadio: p.estadio ?? null,
        ciudad: p.ciudad ?? null,
        fase: p.fase ?? null,
        grupo: p.grupo ?? null,
        jornada: p.jornada ?? null,
      }));

      const { error: supabaseError } = await supabase
        .from("partidos")
        .upsert(partidosFormateados, {
          onConflict: "local,visitante,fecha_inicio",
          ignoreDuplicates: true,
        });

      if (supabaseError) {
        setError(supabaseError.message);
        return;
      }

      setResultado(
        `Importación manual completada. Procesados: ${partidos.length} partidos. Los duplicados se han ignorado.`
      );
      setTexto("");
    } catch {
      setError("JSON inválido. Revisa comas, comillas y corchetes.");
    } finally {
      setImportandoJson(false);
    }
  }

  async function importarResultadosApi() {
    setResultado("");
    setResultadoApi("");
    setError("");
    setImportandoApi(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError("No se ha podido obtener la sesión de administrador.");
        return;
      }

      const res = await fetch("/api/admin/importar-resultados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          force: false,
        }),
      });

      const data = (await res.json()) as RespuestaImportacionApi;

      if (!res.ok || !data.ok) {
        const errores = data.errores?.length ? data.errores.join(" | ") : "";
        const mensajeOriginal =
          data.error || errores || "No se pudo importar desde Football API.";

        throw new Error(traducirErrorFootballApi(mensajeOriginal));
      }

      const resumen = data.resumen;

      if (!resumen) {
        setResultadoApi("Football API respondió correctamente, pero sin resumen.");
        return;
      }

      const errores = data.errores?.length
        ? ` Errores: ${data.errores.join(" | ")}`
        : "";

      setResultadoApi(
        `Actualización desde Football API completada. Fixtures encontrados: ${resumen.fixturesEncontrados}. Mapeados: ${resumen.mapeados}. Partidos actualizados: ${resumen.actualizados}. Ignorados: ${resumen.ignorados}. Pronósticos recalculados: ${resumen.pronosticosActualizados}.${errores}`
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error desconocido importando resultados desde Football API.";

      setError(traducirErrorFootballApi(message));
    } finally {
      setImportandoApi(false);
    }
  }

  if (cargandoPermisos) {
    return (
      <main className="page">
        <div className="loadingBox">
          <Loader2 className="spin" size={34} />
          <p>Comprobando permisos de administrador...</p>
        </div>

        <style>{`
          .page{
            min-height:100vh;
            background:linear-gradient(180deg,#020617 0%,#111827 100%);
            color:white;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:32px 16px;
          }
          .loadingBox{
            display:flex;
            flex-direction:column;
            align-items:center;
            gap:14px;
            color:#cbd5e1;
            font-weight:800;
          }
          .spin{
            animation:spin 1s linear infinite;
          }
          @keyframes spin{
            from{transform:rotate(0deg);}
            to{transform:rotate(360deg);}
          }
        `}</style>
      </main>
    );
  }

  if (!autorizado) {
    return null;
  }

  const hayProcesoActivo = importandoJson || importandoApi;

  return (
    <main className="page">
      <div className="container">
        <div className="kicker">
          <Database size={16} />
          Administración
        </div>

        <div className="hero">
          <div>
            <h1>Importar partidos</h1>

            <p className="subtitle">
              Mantén la importación manual como backup y actualiza resultados
              automáticamente desde Football API cuando haya partidos jugados.
            </p>
          </div>
        </div>

        <section className="apiPanel">
          <div>
            <h2>Resultados desde Football API</h2>
            <p>
              Busca fixtures del Mundial 2026, los cruza con tus partidos por
              <strong> api_fixture_id</strong> o por equipos/fecha, actualiza
              resultados no existentes y recalcula pronósticos.
            </p>
          </div>

          <button
            className="apiButton"
            type="button"
            onClick={importarResultadosApi}
            disabled={hayProcesoActivo}
          >
            {importandoApi ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            Actualizar resultados desde Football API
          </button>

          <div className="safeNote">
            <AlertTriangle size={17} />
            Modo seguro: no pisa resultados manuales ya existentes. Si Football
            API no permite consultar 2026 con tu plan actual, podrás seguir
            usando el JSON manual.
          </div>
        </section>

        <section className="manualPanel">
          <h2>Importación manual JSON</h2>

          <p className="subtitle small">
            Pega un JSON con partidos completos. Si un partido ya existe, se
            ignorará automáticamente.
          </p>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`[
  {
    "local": "España",
    "visitante": "Uruguay",
    "local_code": "es",
    "visitante_code": "uy",
    "fecha_inicio": "2026-06-14T21:00:00.000Z",
    "estadio": "MetLife Stadium",
    "ciudad": "New York/New Jersey",
    "fase": "Fase de grupos",
    "grupo": "Grupo H",
    "jornada": 1
  }
]`}
          />

          <button
            className="manualButton"
            type="button"
            onClick={importarPartidos}
            disabled={hayProcesoActivo}
          >
            {importandoJson ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <Upload size={18} />
            )}
            Importar partidos manualmente
          </button>
        </section>

        {resultado && (
          <div className="result success">
            <CheckCircle2 size={18} />
            {resultado}
          </div>
        )}

        {resultadoApi && (
          <div className="result success">
            <CheckCircle2 size={18} />
            {resultadoApi}
          </div>
        )}

        {error && (
          <div className="result error">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}
      </div>

      <style>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(37, 99, 235, 0.18), transparent 34%),
            linear-gradient(180deg, #020617 0%, #111827 100%);
          color: white;
          padding: 40px 16px 120px;
        }

        .container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          background: rgba(15, 23, 42, 0.72);
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .hero {
          margin-bottom: 22px;
        }

        h1 {
          font-size: clamp(38px, 8vw, 58px);
          line-height: 0.95;
          letter-spacing: -0.06em;
          font-weight: 950;
          margin: 0;
        }

        h2 {
          font-size: 26px;
          font-weight: 950;
          letter-spacing: -0.04em;
          margin: 0 0 8px;
        }

        .subtitle {
          color: #cbd5e1;
          margin-top: 12px;
          margin-bottom: 0;
          max-width: 760px;
          line-height: 1.6;
          font-weight: 650;
          font-size: 17px;
        }

        .subtitle.small {
          font-size: 15px;
          margin-bottom: 16px;
          color: #94a3b8;
        }

        .apiPanel,
        .manualPanel {
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(15, 23, 42, 0.78);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
          padding: 22px;
          margin-bottom: 22px;
        }

        .apiPanel p {
          color: #94a3b8;
          line-height: 1.6;
          font-weight: 650;
          margin: 0 0 18px;
        }

        .apiButton,
        .manualButton {
          width: 100%;
          border: none;
          border-radius: 16px;
          color: white;
          font-weight: 900;
          padding: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
        }

        .apiButton {
          background: #16a34a;
        }

        .manualButton {
          margin-top: 18px;
          background: #2563eb;
        }

        .apiButton:disabled,
        .manualButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .safeNote {
          margin-top: 14px;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          border-radius: 16px;
          border: 1px solid rgba(245, 158, 11, 0.24);
          background: rgba(245, 158, 11, 0.10);
          color: #fde68a;
          padding: 12px;
          line-height: 1.45;
          font-size: 13px;
          font-weight: 850;
        }

        textarea {
          width: 100%;
          min-height: 420px;
          box-sizing: border-box;
          border-radius: 18px;
          background: #020617;
          border: 1px solid rgba(255,255,255,0.14);
          color: #e5e7eb;
          padding: 18px;
          font-family: monospace;
          font-size: 14px;
          outline: none;
          resize: vertical;
        }

        textarea:focus {
          border-color: rgba(37, 99, 235, 0.82);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
        }

        .result {
          margin-top: 18px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border-radius: 18px;
          padding: 16px;
          font-weight: 900;
          line-height: 1.5;
        }

        .success {
          background: rgba(22,163,74,0.16);
          border: 1px solid rgba(22,163,74,0.32);
          color: #86efac;
        }

        .error {
          background: rgba(239,68,68,0.16);
          border: 1px solid rgba(239,68,68,0.32);
          color: #fca5a5;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 760px) {
          .page {
            padding: 28px 14px 110px;
          }

          .apiPanel,
          .manualPanel {
            padding: 18px;
            border-radius: 24px;
          }

          h2 {
            font-size: 23px;
          }
        }
      `}</style>
    </main>
  );
}
