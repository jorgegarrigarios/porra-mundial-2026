"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  Users,
  XCircle,
} from "lucide-react";

import { comprobarAdminActual } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

type Liga = {
  id: number;
  nombre: string;
  codigo: string;
  estado: string;
};

type Participante = {
  id: number;
  nombre: string | null;
  nickname: string | null;
};

type LigaParticipanteRow = {
  liga_id: number;
  participante_id: number;
  participantes: Participante | Participante[] | null;
};

type PartidoRow = {
  id: number;
};

type PronosticoRow = {
  participante_id: number;
  partido_id: number;
};

type SeguimientoUsuario = {
  ligaId: number;
  ligaNombre: string;
  ligaCodigo: string;
  participante: Participante;
  pronosticados: number;
  total: number;
  porcentaje: number;
};

async function conTimeout<T>(
  operacion: PromiseLike<T>,
  ms: number,
  mensaje = "La operación ha tardado demasiado."
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(mensaje)), ms);
  });

  try {
    return await Promise.race([Promise.resolve(operacion), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function cargarTodasLasPaginas<T>(
  consultaBase: (desde: number, hasta: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
  tamanoPagina = 1000
): Promise<T[]> {
  const filas: T[] = [];
  let desde = 0;

  while (true) {
    const hasta = desde + tamanoPagina - 1;
    const { data, error } = await conTimeout(
      consultaBase(desde, hasta),
      12000,
      "La consulta ha tardado demasiado."
    );

    if (error) {
      throw new Error(error.message);
    }

    const pagina = data ?? [];
    filas.push(...pagina);

    if (pagina.length < tamanoPagina) {
      break;
    }

    desde += tamanoPagina;
  }

  return filas;
}

function normalizarParticipante(valor: LigaParticipanteRow["participantes"]) {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor;
}

function nombreVisible(participante: Participante) {
  return participante.nickname || participante.nombre || `Usuario ${participante.id}`;
}

function textoEstado(porcentaje: number) {
  if (porcentaje >= 100) return "Completo";
  if (porcentaje <= 0) return "Sin empezar";
  return "Pendiente";
}

function crearMensajeAviso(
  usuarios: SeguimientoUsuario[],
  ligaNombre: string | null
) {
  const pendientes = usuarios.filter((usuario) => usuario.porcentaje < 100);

  if (pendientes.length === 0) {
    return "Todos los participantes tienen el 100% de los pronósticos completados. No hace falta avisar a nadie.";
  }

  const tituloLiga = ligaNombre ? ` de la liga ${ligaNombre}` : "";

  const lineas = pendientes
    .map(
      (usuario) =>
        `- ${nombreVisible(usuario.participante)}: ${usuario.pronosticados}/${usuario.total} (${usuario.porcentaje}%)`
    )
    .join("\n");

  return `Recordatorio Porra Mundial 2026${tituloLiga}:\n\nEstos usuarios todavía no tienen el 100% de los pronósticos completados:\n\n${lineas}\n\nPor favor, revisadlo antes de que empiece el Mundial o antes de que se bloqueen los partidos.`;
}

export default function AdminSeguimientoPronosticosPage() {
  const router = useRouter();

  const [cargandoPermisos, setCargandoPermisos] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [ligas, setLigas] = useState<Liga[]>([]);
  const [ligaSeleccionadaId, setLigaSeleccionadaId] = useState<number | "todas">("todas");
  const [usuarios, setUsuarios] = useState<SeguimientoUsuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const ligaSeleccionada = useMemo(() => {
    if (ligaSeleccionadaId === "todas") return null;
    return ligas.find((liga) => liga.id === ligaSeleccionadaId) ?? null;
  }, [ligaSeleccionadaId, ligas]);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return usuarios
      .filter((usuario) =>
        ligaSeleccionadaId === "todas" ? true : usuario.ligaId === ligaSeleccionadaId
      )
      .filter((usuario) => (soloPendientes ? usuario.porcentaje < 100 : true))
      .filter((usuario) => {
        if (!q) return true;

        return (
          nombreVisible(usuario.participante).toLowerCase().includes(q) ||
          usuario.ligaNombre.toLowerCase().includes(q) ||
          usuario.ligaCodigo.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.porcentaje !== b.porcentaje) return a.porcentaje - b.porcentaje;
        return nombreVisible(a.participante).localeCompare(
          nombreVisible(b.participante),
          "es"
        );
      });
  }, [busqueda, ligaSeleccionadaId, soloPendientes, usuarios]);

  const resumen = useMemo(() => {
    const totalUsuarios = usuariosFiltrados.length;
    const completos = usuariosFiltrados.filter((usuario) => usuario.porcentaje >= 100).length;
    const pendientes = usuariosFiltrados.filter((usuario) => usuario.porcentaje < 100).length;
    const sinEmpezar = usuariosFiltrados.filter((usuario) => usuario.porcentaje <= 0).length;
    const media =
      totalUsuarios > 0
        ? Math.round(
            usuariosFiltrados.reduce((acc, usuario) => acc + usuario.porcentaje, 0) /
              totalUsuarios
          )
        : 0;

    return { totalUsuarios, completos, pendientes, sinEmpezar, media };
  }, [usuariosFiltrados]);

  useEffect(() => {
    let activo = true;

    async function validar() {
      setCargandoPermisos(true);

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
      await cargarSeguimiento();
    }

    validar();

    return () => {
      activo = false;
    };
  }, [router]);

  async function cargarSeguimiento() {
    setCargandoDatos(true);
    setError("");
    setMensaje("");

    try {
      const [ligasData, partidosData, relacionesData, pronosticosData] =
        await Promise.all([
          cargarTodasLasPaginas<Liga>((desde, hasta) =>
            supabase
              .from("ligas")
              .select("id, nombre, codigo, estado")
              .eq("estado", "activa")
              .order("nombre", { ascending: true })
              .range(desde, hasta)
          ),
          cargarTodasLasPaginas<PartidoRow>((desde, hasta) =>
            supabase.from("partidos").select("id").range(desde, hasta)
          ),
          cargarTodasLasPaginas<LigaParticipanteRow>((desde, hasta) =>
            supabase
              .from("liga_participantes")
              .select(
                `
                liga_id,
                participante_id,
                participantes (
                  id,
                  nombre,
                  nickname
                )
              `
              )
              .range(desde, hasta)
          ),
          cargarTodasLasPaginas<PronosticoRow>((desde, hasta) =>
            supabase
              .from("pronosticos")
              .select("participante_id, partido_id")
              .range(desde, hasta)
          ),
        ]);

      const ligasActivas = ligasData;
      const ligasPorId = new Map(ligasActivas.map((liga) => [liga.id, liga]));
      const totalPartidos = new Set(partidosData.map((partido) => partido.id)).size;

      const pronosticosPorParticipante = new Map<number, Set<number>>();

      pronosticosData.forEach((pronostico) => {
        if (!pronosticosPorParticipante.has(pronostico.participante_id)) {
          pronosticosPorParticipante.set(pronostico.participante_id, new Set<number>());
        }

        pronosticosPorParticipante
          .get(pronostico.participante_id)
          ?.add(pronostico.partido_id);
      });

      const seguimiento = relacionesData
        .map((row) => {
          const liga = ligasPorId.get(row.liga_id);
          const participante = normalizarParticipante(row.participantes);

          if (!liga || !participante) return null;

          const pronosticados =
            pronosticosPorParticipante.get(row.participante_id)?.size ?? 0;

          const porcentaje =
            totalPartidos > 0
              ? Math.min(100, Math.round((pronosticados / totalPartidos) * 100))
              : 0;

          return {
            ligaId: liga.id,
            ligaNombre: liga.nombre,
            ligaCodigo: liga.codigo,
            participante,
            pronosticados,
            total: totalPartidos,
            porcentaje,
          };
        })
        .filter((usuario): usuario is SeguimientoUsuario => Boolean(usuario));

      setLigas(ligasActivas);
      setUsuarios(seguimiento);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error cargando el seguimiento de pronósticos."
      );
      setLigas([]);
      setUsuarios([]);
    } finally {
      setCargandoDatos(false);
    }
  }

  async function copiarAvisoPendientes() {
    const texto = crearMensajeAviso(usuariosFiltrados, ligaSeleccionada?.nombre ?? null);

    try {
      await navigator.clipboard.writeText(texto);
      setMensaje("Mensaje copiado. Ya puedes pegarlo en WhatsApp, email o Discord.");
      setError("");
    } catch {
      setError("No se ha podido copiar el mensaje automáticamente.");
      setMensaje("");
    }
  }

  if (cargandoPermisos) {
    return (
      <main className="page centerPage">
        <div className="loadingBox">
          <Loader2 className="spin" size={34} />
          <p>Comprobando permisos de administrador...</p>
        </div>
        <Styles />
      </main>
    );
  }

  if (!autorizado) {
    return null;
  }

  return (
    <main className="page">
      <div className="container">
        <Link href="/admin" className="backLink">
          <ArrowLeft size={18} />
          Volver al panel admin
        </Link>

        <section className="hero">
          <div className="heroIcon">
            <ClipboardCheck size={34} />
          </div>

          <div>
            <p className="eyebrow">
              <ShieldCheck size={15} />
              Control privado
            </p>
            <h1>Seguimiento pronósticos</h1>
            <p>
              Revisa qué porcentaje de pronósticos lleva cada usuario por liga y
              detecta rápido a quién tienes que avisar antes de que empiece el Mundial.
            </p>
          </div>
        </section>

        {(error || mensaje) && (
          <section className={`feedback ${error ? "error" : "success"}`}>
            <div>
              {error ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{error || mensaje}</span>
            </div>

            {error && (
              <button type="button" onClick={cargarSeguimiento}>
                <RefreshCw size={16} />
                Reintentar
              </button>
            )}
          </section>
        )}

        <section className="controlPanel">
          <div className="selectorBlock">
            <label htmlFor="ligaSelector">Liga</label>
            <select
              id="ligaSelector"
              value={ligaSeleccionadaId}
              onChange={(event) => {
                const valor = event.target.value;
                setLigaSeleccionadaId(valor === "todas" ? "todas" : Number(valor));
              }}
              disabled={cargandoDatos}
            >
              <option value="todas">Todas las ligas activas</option>
              {ligas.map((liga) => (
                <option key={liga.id} value={liga.id}>
                  {liga.nombre} · {liga.codigo}
                </option>
              ))}
            </select>
          </div>

          <div className="searchBox">
            <Search size={18} />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar usuario o liga..."
            />
          </div>

          <button
            type="button"
            className={`toggleButton ${soloPendientes ? "active" : ""}`}
            onClick={() => setSoloPendientes((actual) => !actual)}
          >
            <Target size={18} />
            Solo pendientes
          </button>

          <button
            type="button"
            className="copyButton"
            onClick={copiarAvisoPendientes}
            disabled={usuariosFiltrados.length === 0}
          >
            <Clipboard size={18} />
            Copiar aviso
          </button>
        </section>

        <section className="summaryGrid">
          <article className="summaryCard">
            <span>Usuarios visibles</span>
            <strong>{resumen.totalUsuarios}</strong>
          </article>
          <article className="summaryCard paid">
            <span>100% completo</span>
            <strong>{resumen.completos}</strong>
          </article>
          <article className="summaryCard pending">
            <span>Pendientes</span>
            <strong>{resumen.pendientes}</strong>
          </article>
          <article className="summaryCard danger">
            <span>Sin empezar</span>
            <strong>{resumen.sinEmpezar}</strong>
          </article>
          <article className="summaryCard average">
            <span>Media completada</span>
            <strong>{resumen.media}%</strong>
          </article>
        </section>

        <section className="membersPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Control de avance</p>
              <h2>
                {ligaSeleccionada
                  ? ligaSeleccionada.nombre
                  : "Todas las ligas activas"}
              </h2>
            </div>
            <div className="pill">
              <Users size={16} />
              {usuariosFiltrados.length} visibles
            </div>
          </div>

          {cargandoDatos ? (
            <div className="loadingInline">
              <Loader2 className="spin" size={22} />
              Cargando seguimiento...
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="emptyBox">
              <Users size={30} />
              <h3>No hay usuarios para mostrar</h3>
              <p>Prueba otra búsqueda, otra liga o quita el filtro de pendientes.</p>
            </div>
          ) : (
            <div className="progressList">
              {usuariosFiltrados.map((usuario) => {
                const completo = usuario.porcentaje >= 100;
                const sinEmpezar = usuario.porcentaje <= 0;

                return (
                  <article
                    key={`${usuario.ligaId}-${usuario.participante.id}`}
                    className={`progressRow ${
                      completo ? "isComplete" : sinEmpezar ? "isZero" : "isPending"
                    }`}
                  >
                    <div className="statusIcon">
                      {completo ? (
                        <CheckCircle2 size={24} />
                      ) : sinEmpezar ? (
                        <XCircle size={24} />
                      ) : (
                        <AlertTriangle size={24} />
                      )}
                    </div>

                    <div className="memberInfo">
                      <h3>{nombreVisible(usuario.participante)}</h3>
                      <p>
                        {usuario.ligaNombre} · Código {usuario.ligaCodigo}
                      </p>
                    </div>

                    <div className="progressBlock">
                      <div className="progressTop">
                        <strong>{usuario.porcentaje}%</strong>
                        <span>
                          {usuario.pronosticados}/{usuario.total}
                        </span>
                      </div>
                      <div className="bar">
                        <div
                          className="barFill"
                          style={{ width: `${usuario.porcentaje}%` }}
                        />
                      </div>
                    </div>

                    <div className="statusText">
                      <span>{textoEstado(usuario.porcentaje)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
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
          radial-gradient(circle at 50% 0%, rgba(37,99,235,0.24), transparent 32%),
          radial-gradient(circle at 12% 18%, rgba(250,204,21,0.10), transparent 25%),
          linear-gradient(180deg, #020617 0%, #07111f 46%, #111827 100%);
        color: white;
        padding: 34px 16px 125px;
      }

      .centerPage {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .container {
        max-width: 1180px;
        margin: 0 auto;
      }

      .backLink {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #bfdbfe;
        text-decoration: none;
        font-weight: 950;
        margin-bottom: 18px;
      }

      .hero {
        display: flex;
        align-items: center;
        gap: 18px;
        margin-bottom: 22px;
      }

      .heroIcon {
        width: 78px;
        height: 78px;
        border-radius: 28px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 24px 58px rgba(37,99,235,0.32);
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin: 0 0 6px;
        color: #60a5fa;
        font-size: 13px;
        font-weight: 950;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .hero h1 {
        margin: 0;
        font-size: clamp(38px, 6vw, 62px);
        line-height: 0.95;
        letter-spacing: -0.055em;
        font-weight: 950;
      }

      .hero p {
        margin: 12px 0 0;
        color: #cbd5e1;
        font-size: 17px;
        line-height: 1.5;
        max-width: 780px;
      }

      .loadingBox,
      .loadingInline,
      .emptyBox {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: #cbd5e1;
        font-weight: 850;
      }

      .loadingInline,
      .emptyBox {
        min-height: 220px;
        border-radius: 28px;
        background: rgba(15,23,42,0.64);
        border: 1px solid rgba(255,255,255,0.10);
        text-align: center;
      }

      .emptyBox h3 {
        margin: 0;
        color: white;
        font-size: 26px;
        font-weight: 950;
      }

      .emptyBox p {
        margin: 0;
        color: #94a3b8;
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .feedback {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        border-radius: 22px;
        padding: 16px 18px;
        margin-bottom: 20px;
        font-weight: 850;
      }

      .feedback div,
      .feedback button {
        display: inline-flex;
        align-items: center;
        gap: 9px;
      }

      .feedback button {
        border: none;
        border-radius: 14px;
        background: rgba(255,255,255,0.10);
        color: white;
        padding: 10px 12px;
        font-family: inherit;
        font-weight: 950;
        cursor: pointer;
      }

      .feedback.error {
        background: rgba(239,68,68,0.12);
        border: 1px solid rgba(239,68,68,0.28);
        color: #fecaca;
      }

      .feedback.success {
        background: rgba(22,163,74,0.12);
        border: 1px solid rgba(22,163,74,0.28);
        color: #bbf7d0;
      }

      .controlPanel,
      .membersPanel {
        border-radius: 30px;
        padding: 22px;
        background: rgba(15,23,42,0.76);
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow: 0 24px 80px rgba(0,0,0,0.20);
      }

      .controlPanel {
        display: grid;
        grid-template-columns: 1.2fr 1fr auto auto;
        gap: 14px;
        margin-bottom: 16px;
        align-items: end;
      }

      .selectorBlock label {
        display: block;
        margin-bottom: 7px;
        color: #bfdbfe;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .selectorBlock select,
      .searchBox {
        width: 100%;
        box-sizing: border-box;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(2,6,23,0.55);
        color: white;
        font-family: inherit;
        font-weight: 850;
        outline: none;
      }

      .selectorBlock select {
        padding: 15px 16px;
      }

      .searchBox {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
      }

      .searchBox input {
        width: 100%;
        border: none;
        background: transparent;
        color: white;
        outline: none;
        padding: 16px 0;
        font-family: inherit;
        font-weight: 850;
      }

      .toggleButton,
      .copyButton {
        min-height: 50px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 18px;
        padding: 0 16px;
        border: 1px solid rgba(255,255,255,0.12);
        color: white;
        font-family: inherit;
        font-weight: 950;
        cursor: pointer;
        white-space: nowrap;
      }

      .toggleButton {
        background: rgba(255,255,255,0.06);
      }

      .toggleButton.active {
        color: #fde68a;
        border-color: rgba(250,204,21,0.32);
        background: rgba(250,204,21,0.12);
      }

      .copyButton {
        border: none;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        box-shadow: 0 16px 32px rgba(37,99,235,0.22);
      }

      .summaryGrid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 16px;
      }

      .summaryCard {
        border-radius: 24px;
        padding: 18px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .summaryCard span {
        display: block;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-bottom: 7px;
      }

      .summaryCard strong {
        display: block;
        font-size: 32px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.04em;
      }

      .summaryCard.paid {
        border-color: rgba(34,197,94,0.28);
        background: rgba(34,197,94,0.10);
      }

      .summaryCard.pending {
        border-color: rgba(250,204,21,0.28);
        background: rgba(250,204,21,0.10);
      }

      .summaryCard.danger {
        border-color: rgba(239,68,68,0.28);
        background: rgba(239,68,68,0.10);
      }

      .summaryCard.average {
        border-color: rgba(96,165,250,0.28);
        background: rgba(37,99,235,0.12);
      }

      .panelHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      .panelHeader h2 {
        margin: 0;
        font-size: clamp(30px, 4vw, 42px);
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.04em;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 10px 14px;
        color: #bfdbfe;
        background: rgba(37,99,235,0.13);
        border: 1px solid rgba(96,165,250,0.22);
        font-weight: 950;
        white-space: nowrap;
      }

      .progressList {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .progressRow {
        display: grid;
        grid-template-columns: auto 1fr minmax(230px, 0.9fr) auto;
        gap: 14px;
        align-items: center;
        border-radius: 24px;
        padding: 16px;
        background: rgba(2,6,23,0.42);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .progressRow.isComplete {
        border-color: rgba(34,197,94,0.26);
      }

      .progressRow.isPending {
        border-color: rgba(250,204,21,0.22);
      }

      .progressRow.isZero {
        border-color: rgba(239,68,68,0.26);
      }

      .statusIcon {
        width: 48px;
        height: 48px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.08);
      }

      .isComplete .statusIcon {
        color: #86efac;
        background: rgba(34,197,94,0.14);
      }

      .isPending .statusIcon {
        color: #fde68a;
        background: rgba(250,204,21,0.14);
      }

      .isZero .statusIcon {
        color: #fecaca;
        background: rgba(239,68,68,0.14);
      }

      .memberInfo h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 950;
      }

      .memberInfo p {
        margin: 5px 0 0;
        color: #94a3b8;
        font-weight: 750;
      }

      .progressTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }

      .progressTop strong {
        font-size: 24px;
        font-weight: 950;
        letter-spacing: -0.04em;
      }

      .progressTop span {
        color: #cbd5e1;
        font-weight: 900;
      }

      .bar {
        height: 11px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,0.10);
      }

      .barFill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #2563eb, #22c55e);
      }

      .statusText {
        display: flex;
        justify-content: flex-end;
      }

      .statusText span {
        border-radius: 999px;
        padding: 9px 12px;
        background: rgba(255,255,255,0.08);
        color: #e5e7eb;
        font-size: 13px;
        font-weight: 950;
        white-space: nowrap;
      }

      button:disabled,
      input:disabled,
      select:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      @media (max-width: 1080px) {
        .controlPanel {
          grid-template-columns: 1fr 1fr;
        }

        .summaryGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .progressRow {
          grid-template-columns: auto 1fr;
          align-items: start;
        }

        .progressBlock,
        .statusText {
          grid-column: 2;
        }

        .statusText {
          justify-content: flex-start;
        }
      }

      @media (max-width: 820px) {
        .hero {
          align-items: flex-start;
        }

        .heroIcon {
          width: 62px;
          height: 62px;
          border-radius: 22px;
        }

        .controlPanel,
        .summaryGrid {
          grid-template-columns: 1fr;
        }

        .panelHeader {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 560px) {
        .page {
          padding: 28px 14px 115px;
        }

        .hero h1 {
          font-size: 38px;
        }

        .controlPanel,
        .membersPanel {
          border-radius: 26px;
          padding: 18px;
        }

        .progressRow {
          grid-template-columns: 1fr;
        }

        .statusIcon,
        .progressBlock,
        .statusText {
          grid-column: auto;
        }
      }
    `}</style>
  );
}
