"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  AlertCircle,
  RefreshCw,
  Target,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { obtenerParticipanteActual } from "@/lib/participante";

type Participante = {
  id: number;
  nombre: string | null;
  nickname?: string | null;
  role?: string | null;
};

type Liga = {
  id: number;
  nombre: string;
  codigo: string;
  estado: string;
};

type LigaParticipanteRow = {
  liga_id: number;
  ligas: Liga | Liga[] | null;
};

async function conTimeout<T>(
  operacion: PromiseLike<T>,
  ms: number,
  mensaje = "La operación ha tardado demasiado."
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(mensaje));
    }, ms);
  });

  try {
    return await Promise.race([Promise.resolve(operacion), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function normalizarLigaRelacion(ligas: Liga | Liga[] | null): Liga | null {
  if (!ligas) return null;
  if (Array.isArray(ligas)) return ligas[0] ?? null;
  return ligas;
}

export default function LigasPage() {
  const router = useRouter();
  const yaRedirigio = useRef(false);

  const [participante, setParticipante] = useState<Participante | null>(null);
  const [misLigas, setMisLigas] = useState<Liga[]>([]);
  const [ligasPendientes, setLigasPendientes] = useState<Liga[]>([]);

  const [nombreLiga, setNombreLiga] = useState("");
  const [codigoLiga, setCodigoLiga] = useState("");

  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [sinSesion, setSinSesion] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  function limpiarMensajes() {
    setError("");
    setMensaje("");
  }

  async function cargar() {
    setLoadingInicial(true);
    setSinSesion(false);
    limpiarMensajes();

    try {
      const { data: sessionData, error: sessionError } = await conTimeout(
        supabase.auth.getSession(),
        10000,
        "No se ha podido comprobar tu sesión."
      );

      if (sessionError) {
        console.error("Error comprobando sesión:", sessionError);
        setError("No se ha podido comprobar tu sesión. Inténtalo de nuevo.");
        return;
      }

      if (!sessionData.session) {
        setParticipante(null);
        setMisLigas([]);
        setLigasPendientes([]);
        setSinSesion(true);
        return;
      }

      const participanteActual = await conTimeout(
        obtenerParticipanteActual(),
        10000,
        "No se ha podido cargar tu perfil de participante."
      );

      setParticipante(participanteActual);

      if (!participanteActual) {
        setMisLigas([]);
        setLigasPendientes([]);
        setError("Has iniciado sesión, pero no se ha podido cargar tu perfil. Cierra sesión y vuelve a entrar.");
        return;
      }

      const { data: relaciones, error: relacionesError } = await conTimeout(
        supabase
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
          .eq("participante_id", participanteActual.id),
        10000,
        "La carga de tus ligas ha tardado demasiado."
      );

      if (relacionesError) {
        console.error("Error cargando ligas del participante:", relacionesError);
        setError("No se han podido cargar tus ligas. Inténtalo de nuevo.");
        return;
      }

      const ligasMiembro =
        ((relaciones ?? []) as LigaParticipanteRow[])
          .map((item) => normalizarLigaRelacion(item.ligas))
          .filter((liga): liga is Liga => Boolean(liga)) ?? [];

      const ligasActivas = ligasMiembro.filter((liga) => liga.estado === "activa");

      setMisLigas(ligasActivas);

      if (ligasActivas.length === 1 && !yaRedirigio.current) {
        yaRedirigio.current = true;
        router.replace(`/ligas/${ligasActivas[0].id}`);
        return;
      }

      const { data: pendientes } = await conTimeout(
        supabase
          .from("ligas")
          .select("id, nombre, codigo, estado")
          .eq("creador_id", participanteActual.id)
          .eq("estado", "pendiente"),
        10000,
        "La carga de ligas pendientes ha tardado demasiado."
      );

      setLigasPendientes((pendientes ?? []) as Liga[]);
    } catch (err) {
      console.error("Error cargando pantalla de ligas:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error cargando tus ligas."
      );
    } finally {
      setLoadingInicial(false);
    }
  }

  function generarCodigo() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function crearLiga() {
    limpiarMensajes();

    if (!participante) {
      setError("Debes iniciar sesión para crear una liga.");
      return;
    }

    if (!nombreLiga.trim()) {
      setError("Introduce un nombre para la liga.");
      return;
    }

    if (participante.role !== "admin") {
      setError("Solo un administrador puede crear ligas.");
      return;
    }

    setLoadingAccion(true);

    try {
      const codigoGenerado = generarCodigo();

      const { data: ligaCreada, error: insertError } = await conTimeout(
        supabase
          .from("ligas")
          .insert({
            nombre: nombreLiga.trim(),
            codigo: codigoGenerado,
            creador_id: participante.id,
            estado: "activa",
          })
          .select("id, nombre, codigo, estado")
          .single(),
        10000,
        "La creación de la liga ha tardado demasiado."
      );

      if (insertError || !ligaCreada) {
        console.error("Error creando liga:", insertError);
        setError("No se ha podido crear la liga. Inténtalo de nuevo.");
        return;
      }

      const { error: relacionError } = await conTimeout(
        supabase.from("liga_participantes").insert({
          liga_id: ligaCreada.id,
          participante_id: participante.id,
        }),
        10000,
        "La asignación del administrador a la liga ha tardado demasiado."
      );

      if (relacionError) {
        console.error("Error asignando admin a la liga:", relacionError);
        setError("La liga se ha creado, pero no se ha podido asignar correctamente. Revísala desde administración.");
        return;
      }

      setNombreLiga("");
      setMensaje(`Liga "${ligaCreada.nombre}" creada correctamente.`);
      window.alert(`✅ Liga creada correctamente: ${ligaCreada.nombre}`);
      router.push(`/ligas/${ligaCreada.id}`);
    } catch (err) {
      console.error("Error creando liga:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error creando la liga."
      );
    } finally {
      setLoadingAccion(false);
    }
  }

  async function unirseLiga() {
    limpiarMensajes();

    if (!participante) {
      setError("Debes iniciar sesión para unirte a una liga.");
      return;
    }

    if (!codigoLiga.trim()) {
      setError("Introduce un código de liga.");
      return;
    }

    setLoadingAccion(true);

    try {
      const codigoNormalizado = codigoLiga.trim().toUpperCase();

      const { data: liga, error: ligaError } = await conTimeout(
        supabase
          .from("ligas")
          .select("id, nombre, codigo, estado")
          .eq("codigo", codigoNormalizado)
          .eq("estado", "activa")
          .maybeSingle(),
        10000,
        "La búsqueda de la liga ha tardado demasiado."
      );

      if (ligaError) {
        console.error("Error buscando liga:", ligaError);
        setError("No se ha podido buscar la liga. Inténtalo de nuevo.");
        return;
      }

      if (!liga) {
        setError("Liga no encontrada o todavía no activa.");
        return;
      }

      if (misLigas.some((ligaActual) => ligaActual.id === liga.id)) {
        window.alert(`✅ Ya perteneces a ${liga.nombre}. Te llevamos a la liga.`);
        router.push(`/ligas/${liga.id}`);
        return;
      }

      const { error: insertError } = await conTimeout(
        supabase.from("liga_participantes").insert({
          liga_id: liga.id,
          participante_id: participante.id,
        }),
        10000,
        "La unión a la liga ha tardado demasiado."
      );

      if (insertError) {
        console.error("Error uniéndose a liga:", insertError);
        setError("No se ha podido unir a la liga. Puede que ya pertenezcas a ella.");
        return;
      }

      setCodigoLiga("");
      setMensaje(`Te has unido correctamente a ${liga.nombre}.`);
      window.alert(`✅ Te has unido correctamente a ${liga.nombre}`);
      router.push(`/ligas/${liga.id}`);
    } catch (err) {
      console.error("Error uniéndose a liga:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error uniéndote a la liga."
      );
    } finally {
      setLoadingAccion(false);
    }
  }

  async function copiarCodigo(codigo: string) {
    limpiarMensajes();

    try {
      await navigator.clipboard.writeText(codigo);
      setMensaje("Código copiado al portapapeles.");
    } catch {
      setError("No se ha podido copiar el código.");
    }
  }

  const tieneLigasActivas = misLigas.length > 0;
  const esAdmin = participante?.role === "admin";

  return (
    <main className="ligasPage">
      <div className="ligasContainer">
        <div className="ligasHeader">
          <div className="ligasHeaderIcon">
            <Users size={34} />
          </div>

          <div>
            <p className="eyebrow">Centro de competición</p>
            <h1>Ligas privadas</h1>
            <p>
              {tieneLigasActivas
                ? "Entra en tu liga y continúa haciendo tus pronósticos."
                : "Únete con el código que te haya enviado el administrador para empezar a competir."}
            </p>
          </div>
        </div>

        {(error || mensaje) && (
          <div className={`feedbackBox ${error ? "feedbackError" : "feedbackSuccess"}`}>
            <div className="feedbackContent">
              {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{error || mensaje}</span>
            </div>

            {error && (
              <button
                type="button"
                className="retryButton"
                onClick={cargar}
                disabled={loadingInicial || loadingAccion}
              >
                <RefreshCw size={16} />
                Reintentar
              </button>
            )}
          </div>
        )}

        {loadingInicial ? (
          <section className="loadingCard">
            <div className="spinner" />
            <p>Cargando tus ligas...</p>
          </section>
        ) : (
          <>
            {sinSesion ? (
              <section className="authRequiredCard">
                <div className="authRequiredIcon">
                  <LogIn size={34} />
                </div>

                <h2>Inicia sesión para acceder a tus ligas</h2>

                <p>
                  Las ligas son privadas. Para unirte con código, ver tus competiciones
                  o hacer tus pronósticos, primero tienes que entrar con tu cuenta.
                </p>

                <div className="authActions">
                  <Link href="/login" className="authPrimaryButton">
                    <LogIn size={20} />
                    Iniciar sesión
                  </Link>

                  <Link href="/" className="authSecondaryButton">
                    Volver al inicio
                  </Link>
                </div>
              </section>
            ) : (
              <>
                {tieneLigasActivas && (
                  <section className="continueSection">
                <div className="sectionHeader">
                  <div className="sectionTitle">
                    <Trophy size={25} />
                    <h2>Continúa tu competición</h2>
                  </div>

                  <span className="countPill">
                    {misLigas.length}{" "}
                    {misLigas.length === 1 ? "liga activa" : "ligas activas"}
                  </span>
                </div>

                <div className="leaguesGrid priorityGrid">
                  {misLigas.map((liga) => (
                    <article key={liga.id} className="leagueCard priorityCard">
                      <div className="leagueCardTop">
                        <div>
                          <p className="leagueLabel">Tu liga</p>
                          <h3>{liga.nombre}</h3>
                        </div>

                        <EstadoLiga estado={liga.estado} />
                      </div>

                      <div className="leagueBottom">
                        <div>
                          <p className="leagueCodeLabel">Código para invitar</p>
                          <p className="leagueCode">{liga.codigo}</p>
                        </div>

                        <button
                          type="button"
                          className="copyButton"
                          onClick={() => copiarCodigo(liga.codigo)}
                          aria-label="Copiar código de liga"
                        >
                          <Copy size={18} />
                        </button>
                      </div>

                      <Link href={`/ligas/${liga.id}`} className="mainLeagueButton">
                        <Target size={19} />
                        Entrar y hacer pronósticos
                        <ArrowRight size={18} />
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {!tieneLigasActivas && (
              <section className="emptyHero">
                <Trophy size={34} />
                <h2>Aún no estás en ninguna liga</h2>
                <p>
                  Introduce el código que te haya enviado el administrador de la
                  liga. Cuando te unas correctamente, te llevaremos directamente
                  dentro de la competición.
                </p>
              </section>
            )}

            <div className={`actionsGrid ${tieneLigasActivas ? "secondaryActions" : ""} ${!esAdmin ? "singleAction" : ""}`}>
              <section className="actionCard featuredCard">
                <div className="cardTop">
                  <div className="smallIcon">
                    <LogIn size={23} />
                  </div>

                  <h2>Unirse por código</h2>
                </div>

                <p className="cardText">
                  Introduce el código de una liga aprobada para unirte.
                </p>

                <input
                  className="leagueInput codeInput"
                  type="text"
                  placeholder="ABC123"
                  value={codigoLiga}
                  onChange={(e) => setCodigoLiga(e.target.value.toUpperCase())}
                  disabled={loadingAccion}
                />

                <button
                  type="button"
                  className="primaryButton"
                  onClick={unirseLiga}
                  disabled={loadingAccion}
                >
                  {loadingAccion ? "Procesando..." : "Unirse a liga"}
                </button>
              </section>

              {esAdmin && (
                <section className="actionCard">
                  <div className="cardTop">
                    <div className="smallIcon">
                      <Plus size={23} />
                    </div>

                    <h2>Crear liga</h2>
                  </div>

                  <p className="cardText">
                    Solo los administradores pueden crear ligas nuevas.
                  </p>

                  <input
                    className="leagueInput"
                    type="text"
                    placeholder="Liga Familia"
                    value={nombreLiga}
                    onChange={(e) => setNombreLiga(e.target.value)}
                    disabled={loadingAccion}
                  />

                  <button
                    type="button"
                    className="primaryButton secondaryButton"
                    onClick={crearLiga}
                    disabled={loadingAccion}
                  >
                    {loadingAccion ? "Procesando..." : "Crear liga"}
                  </button>
                </section>
              )}
            </div>

                {ligasPendientes.length > 0 && (
                  <section className="pendingSection">
                <div className="sectionHeader">
                  <div className="sectionTitle">
                    <Clock3 size={24} />
                    <h2>Pendientes de aprobación</h2>
                  </div>
                </div>

                <div className="leaguesGrid">
                  {ligasPendientes.map((liga) => (
                    <article key={liga.id} className="leagueCard" >
                      <div className="leagueCardTop">
                        <div>
                          <p className="leagueLabel">Liga</p>
                          <h3>{liga.nombre}</h3>
                        </div>

                        <EstadoLiga estado={liga.estado} />
                      </div>

                      <div className="pendingInfo">
                        Tu solicitud está pendiente de revisión por un administrador.
                      </div>
                    </article>
                  ))}
                </div>
              </section>
                )}
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        .ligasPage {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% 0%, rgba(37,99,235,0.22), transparent 32%),
            radial-gradient(circle at 15% 18%, rgba(14,165,233,0.12), transparent 28%),
            linear-gradient(180deg, #020617 0%, #07111f 48%, #111827 100%);
          color: white;
          padding: 54px 16px 120px;
        }

        .ligasContainer {
          max-width: 1220px;
          margin: 0 auto;
        }

        .ligasHeader {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 28px;
        }

        .ligasHeaderIcon {
          width: 78px;
          height: 78px;
          border-radius: 28px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 22px 55px rgba(37,99,235,0.28);
        }

        .eyebrow {
          margin: 0 0 5px;
          color: #60a5fa;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .ligasHeader h1 {
          font-size: clamp(36px, 5vw, 56px);
          line-height: 1;
          font-weight: 950;
          margin: 0;
          letter-spacing: -0.04em;
        }

        .ligasHeader p {
          color: #94a3b8;
          margin: 10px 0 0;
          font-size: 18px;
          line-height: 1.5;
        }

        .feedbackBox {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-radius: 22px;
          padding: 16px 18px;
          margin-bottom: 24px;
          border: 1px solid rgba(255,255,255,0.12);
        }

        .feedbackContent {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 850;
          line-height: 1.45;
        }

        .feedbackError {
          background: rgba(239,68,68,0.12);
          border-color: rgba(239,68,68,0.28);
          color: #fecaca;
        }

        .feedbackSuccess {
          background: rgba(22,163,74,0.12);
          border-color: rgba(22,163,74,0.28);
          color: #bbf7d0;
        }

        .retryButton {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 14px;
          background: rgba(255,255,255,0.10);
          color: white;
          font-weight: 950;
          padding: 11px 14px;
          cursor: pointer;
          font-family: inherit;
        }



        .authRequiredCard {
          min-height: 330px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.68));
          border: 1px solid rgba(96,165,250,0.20);
          border-radius: 32px;
          padding: 34px 24px;
          margin-bottom: 34px;
          text-align: center;
          box-shadow: 0 26px 80px rgba(0,0,0,0.24);
        }

        .authRequiredIcon {
          width: 78px;
          height: 78px;
          border-radius: 28px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 22px 55px rgba(37,99,235,0.28);
        }

        .authRequiredCard h2 {
          color: white;
          font-size: clamp(30px, 4vw, 42px);
          line-height: 1.05;
          font-weight: 950;
          margin: 0;
          letter-spacing: -0.04em;
        }

        .authRequiredCard p {
          max-width: 720px;
          color: #94a3b8;
          line-height: 1.6;
          font-size: 17px;
          font-weight: 750;
          margin: 0;
        }

        .authActions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .authPrimaryButton,
        .authSecondaryButton {
          min-height: 54px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 18px;
          padding: 15px 22px;
          color: white;
          text-decoration: none;
          font-weight: 950;
        }

        .authPrimaryButton {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 18px 40px rgba(37,99,235,0.24);
        }

        .authSecondaryButton {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
        }

        .loadingCard,
        .emptyHero {
          min-height: 230px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 30px;
          color: #94a3b8;
          text-align: center;
          margin-bottom: 28px;
          padding: 26px;
        }

        .emptyHero h2 {
          color: white;
          font-size: 30px;
          font-weight: 950;
          margin: 0;
        }

        .emptyHero p {
          max-width: 650px;
          margin: 0;
          line-height: 1.55;
          font-weight: 750;
        }

        .spinner {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 3px solid rgba(255,255,255,0.16);
          border-top-color: #60a5fa;
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .continueSection {
          margin-bottom: 34px;
        }

        .sectionHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }

        .sectionTitle {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sectionTitle h2 {
          font-size: clamp(30px, 4vw, 40px);
          font-weight: 950;
          margin: 0;
          letter-spacing: -0.03em;
        }

        .countPill {
          border-radius: 999px;
          padding: 9px 13px;
          color: #bfdbfe;
          background: rgba(37,99,235,0.13);
          border: 1px solid rgba(96,165,250,0.22);
          font-weight: 900;
          font-size: 13px;
        }

        .actionsGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 24px;
          margin-bottom: 46px;
        }

        .secondaryActions {
          opacity: 0.92;
        }

        .singleAction {
          grid-template-columns: minmax(0, 1fr);
          max-width: 680px;
        }

        .actionCard,
        .leagueCard {
          background: linear-gradient(
            145deg,
            rgba(15,23,42,0.98),
            rgba(15,23,42,0.68)
          );
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 30px;
          padding: 28px;
          box-shadow: 0 22px 70px rgba(0,0,0,0.22);
        }

        .priorityCard {
          border-color: rgba(96,165,250,0.28);
          box-shadow: 0 28px 90px rgba(37,99,235,0.18);
        }

        .featuredCard {
          border-color: rgba(96,165,250,0.18);
        }

        .cardTop {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 16px;
        }

        .smallIcon {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background: rgba(37,99,235,0.14);
          border: 1px solid rgba(96,165,250,0.20);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #bfdbfe;
          flex-shrink: 0;
        }

        .cardTop h2 {
          font-size: clamp(25px, 3vw, 34px);
          font-weight: 950;
          margin: 0;
          letter-spacing: -0.03em;
        }

        .cardText {
          color: #94a3b8;
          line-height: 1.65;
          margin: 0 0 20px;
          font-size: 17px;
        }

        .leagueInput {
          width: 100%;
          box-sizing: border-box;
          background: rgba(2,6,23,0.55);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
          padding: 17px 18px;
          color: white;
          font-size: 16px;
          outline: none;
          font-family: inherit;
        }

        .leagueInput:focus {
          border-color: rgba(96,165,250,0.65);
          box-shadow: 0 0 0 4px rgba(37,99,235,0.14);
        }

        .leagueInput::placeholder {
          color: #64748b;
        }

        .codeInput {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 900;
        }

        .primaryButton {
          margin-top: 18px;
          width: 100%;
          border: none;
          border-radius: 18px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 950;
          padding: 16px;
          cursor: pointer;
          font-family: inherit;
          font-size: 16px;
          box-shadow: 0 18px 40px rgba(37,99,235,0.24);
        }

        .secondaryButton {
          background: rgba(37,99,235,0.18);
          border: 1px solid rgba(96,165,250,0.22);
          box-shadow: none;
        }

        .primaryButton:disabled,
        .retryButton:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .leaguesGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(285px, 1fr));
          gap: 20px;
        }

        .priorityGrid {
          grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
        }

        .leagueCard {
          position: relative;
          overflow: hidden;
        }

        .leagueCard::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at top right,
            rgba(37,99,235,0.12),
            transparent 38%
          );
          pointer-events: none;
        }

        .leagueCardTop,
        .leagueBottom,
        .mainLeagueButton,
        .pendingInfo {
          position: relative;
          z-index: 1;
        }

        .leagueCardTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .leagueLabel,
        .leagueCodeLabel {
          color: #94a3b8;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 950;
          margin: 0;
        }

        .leagueCard h3 {
          font-size: 31px;
          line-height: 1.15;
          font-weight: 950;
          margin: 8px 0 0;
          letter-spacing: -0.03em;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 950;
          white-space: nowrap;
          flex-shrink: 0;
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
          margin-top: 26px;
          gap: 16px;
        }

        .leagueCode {
          font-size: 23px;
          font-weight: 950;
          letter-spacing: 0.12em;
          margin: 5px 0 0;
        }

        .copyButton {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          border: none;
          background: rgba(37,99,235,0.18);
          color: #bfdbfe;
          cursor: pointer;
          flex-shrink: 0;
        }

        .mainLeagueButton {
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 16px 18px;
          border-radius: 18px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-weight: 950;
          text-decoration: none;
          box-shadow: 0 18px 42px rgba(37,99,235,0.28);
        }

        .pendingInfo {
          color: #94a3b8;
          font-weight: 800;
          line-height: 1.55;
          margin-top: 24px;
        }

        @media (max-width: 860px) {
          .ligasPage {
            padding: 36px 14px 110px;
          }

          .ligasHeader {
            align-items: flex-start;
            gap: 14px;
            margin-bottom: 24px;
          }

          .ligasHeaderIcon {
            width: 62px;
            height: 62px;
            border-radius: 22px;
          }

          .ligasHeader h1 {
            font-size: 36px;
          }

          .ligasHeader p {
            font-size: 16px;
          }

          .actionsGrid {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .actionCard,
          .leagueCard {
            border-radius: 26px;
            padding: 22px;
          }

          .sectionHeader {
            align-items: flex-start;
            flex-direction: column;
          }

          .feedbackBox {
            align-items: flex-start;
            flex-direction: column;
          }

          .retryButton,
          .authPrimaryButton,
          .authSecondaryButton {
            width: 100%;
          }

          .authActions {
            width: 100%;
          }
        }

        @media (max-width: 430px) {
          .ligasPage {
            padding-top: 32px;
          }

          .ligasHeader h1 {
            font-size: 32px;
          }

          .cardTop h2 {
            font-size: 25px;
          }

          .sectionTitle h2 {
            font-size: 28px;
          }

          .leagueCardTop {
            flex-direction: column;
          }

          .status {
            align-self: flex-start;
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