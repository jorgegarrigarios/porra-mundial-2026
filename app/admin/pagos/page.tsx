"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
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
  inscripcion_eur: number | null;
};

type Participante = {
  id: number;
  nombre: string | null;
  nickname: string | null;
};

type LigaParticipanteRow = {
  participante_id: number;
  participantes: Participante | Participante[] | null;
};

type PagoRow = {
  id: number;
  liga_id: number;
  participante_id: number;
  pagado: boolean;
  importe: number | null;
  fecha_pago: string | null;
  nota: string | null;
};

type MiembroPago = {
  participante: Participante;
  pago: PagoRow | null;
  importeInput: string;
  notaInput: string;
  guardando: boolean;
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

function normalizarParticipante(valor: LigaParticipanteRow["participantes"]) {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor;
}

function nombreVisible(participante: Participante) {
  return participante.nickname || participante.nombre || `Usuario ${participante.id}`;
}

function normalizarImporte(valor: string) {
  const numero = Number(valor.replace(",", "."));

  if (!Number.isFinite(numero) || numero < 0) {
    return 0;
  }

  return Math.round(numero * 100) / 100;
}

function formatearEuros(valor: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export default function AdminPagosPage() {
  const router = useRouter();

  const [cargandoPermisos, setCargandoPermisos] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [cargandoLigas, setCargandoLigas] = useState(true);
  const [cargandoMiembros, setCargandoMiembros] = useState(false);
  const [ligas, setLigas] = useState<Liga[]>([]);
  const [ligaSeleccionadaId, setLigaSeleccionadaId] = useState<number | null>(null);
  const [miembros, setMiembros] = useState<MiembroPago[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const ligaSeleccionada = useMemo(
    () => ligas.find((liga) => liga.id === ligaSeleccionadaId) ?? null,
    [ligas, ligaSeleccionadaId]
  );

  const miembrosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    if (!q) return miembros;

    return miembros.filter((item) =>
      nombreVisible(item.participante).toLowerCase().includes(q)
    );
  }, [busqueda, miembros]);

  const resumen = useMemo(() => {
    const total = miembros.length;
    const pagados = miembros.filter((item) => item.pago?.pagado).length;
    const pendientes = total - pagados;
    const importePendiente = miembros
      .filter((item) => !item.pago?.pagado)
      .reduce(
        (acc, item) =>
          acc + normalizarImporte(item.importeInput || String(ligaSeleccionada?.inscripcion_eur ?? 0)),
        0
      );

    return { total, pagados, pendientes, importePendiente };
  }, [miembros, ligaSeleccionada?.inscripcion_eur]);

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
      await cargarLigas();
    }

    validar();

    return () => {
      activo = false;
    };
  }, [router]);

  useEffect(() => {
    if (!ligaSeleccionadaId || !autorizado) return;
    cargarMiembrosYPagos(ligaSeleccionadaId);
  }, [ligaSeleccionadaId, autorizado]);

  async function cargarLigas() {
    setCargandoLigas(true);
    setError("");
    setMensaje("");

    try {
      const { data, error: ligasError } = await conTimeout(
        supabase
          .from("ligas")
          .select("id, nombre, codigo, estado, inscripcion_eur")
          .eq("estado", "activa")
          .order("nombre", { ascending: true }),
        10000,
        "No se han podido cargar las ligas."
      );

      if (ligasError) {
        throw new Error(ligasError.message);
      }

      const ligasData = (data ?? []) as Liga[];
      setLigas(ligasData);

      if (!ligaSeleccionadaId && ligasData.length > 0) {
        setLigaSeleccionadaId(ligasData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando ligas.");
    } finally {
      setCargandoLigas(false);
    }
  }

  async function cargarMiembrosYPagos(ligaId: number) {
    setCargandoMiembros(true);
    setError("");
    setMensaje("");

    try {
      const [{ data: relacionesData, error: relacionesError }, { data: pagosData, error: pagosError }] =
        await Promise.all([
          conTimeout(
            supabase
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
              .eq("liga_id", ligaId),
            10000,
            "No se han podido cargar los miembros."
          ),
          conTimeout(
            supabase
              .from("liga_pagos")
              .select("id, liga_id, participante_id, pagado, importe, fecha_pago, nota")
              .eq("liga_id", ligaId),
            10000,
            "No se han podido cargar los pagos."
          ),
        ]);

      if (relacionesError) {
        throw new Error(relacionesError.message);
      }

      if (pagosError) {
        throw new Error(pagosError.message);
      }

      const pagos = ((pagosData ?? []) as PagoRow[]).reduce<Record<number, PagoRow>>(
        (acc, pago) => {
          acc[pago.participante_id] = pago;
          return acc;
        },
        {}
      );

      const importeLiga = String(ligaSeleccionada?.inscripcion_eur ?? 0);

      const miembrosNormalizados = ((relacionesData ?? []) as LigaParticipanteRow[])
        .map((row) => normalizarParticipante(row.participantes))
        .filter((participante): participante is Participante => Boolean(participante))
        .sort((a, b) => nombreVisible(a).localeCompare(nombreVisible(b), "es"))
        .map((participante) => {
          const pago = pagos[participante.id] ?? null;

          return {
            participante,
            pago,
            importeInput: String(pago?.importe ?? ligaSeleccionada?.inscripcion_eur ?? importeLiga),
            notaInput: pago?.nota ?? "",
            guardando: false,
          };
        });

      setMiembros(miembrosNormalizados);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando pagos.");
      setMiembros([]);
    } finally {
      setCargandoMiembros(false);
    }
  }

  function actualizarMiembroLocal(
    participanteId: number,
    cambios: Partial<MiembroPago>
  ) {
    setMiembros((actual) =>
      actual.map((item) =>
        item.participante.id === participanteId ? { ...item, ...cambios } : item
      )
    );
  }

  async function guardarPago(item: MiembroPago, pagado: boolean) {
    if (!ligaSeleccionada) return;

    const participanteId = item.participante.id;
    const importe = normalizarImporte(item.importeInput);

    actualizarMiembroLocal(participanteId, { guardando: true });
    setError("");
    setMensaje("");

    try {
      const fila = {
        liga_id: ligaSeleccionada.id,
        participante_id: participanteId,
        pagado,
        importe,
        fecha_pago: pagado ? new Date().toISOString() : null,
        nota: item.notaInput.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error: upsertError } = await conTimeout(
        supabase
          .from("liga_pagos")
          .upsert(fila, { onConflict: "liga_id,participante_id" })
          .select("id, liga_id, participante_id, pagado, importe, fecha_pago, nota")
          .single(),
        10000,
        "No se ha podido guardar el pago."
      );

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      actualizarMiembroLocal(participanteId, {
        pago: data as PagoRow,
        importeInput: String((data as PagoRow).importe ?? importe),
        notaInput: (data as PagoRow).nota ?? "",
        guardando: false,
      });

      setMensaje(
        pagado
          ? `${nombreVisible(item.participante)} marcado como pagado.`
          : `${nombreVisible(item.participante)} marcado como pendiente.`
      );
    } catch (err) {
      actualizarMiembroLocal(participanteId, { guardando: false });
      setError(err instanceof Error ? err.message : "Error guardando pago.");
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
            <CreditCard size={34} />
          </div>

          <div>
            <p className="eyebrow">
              <ShieldCheck size={15} />
              Control privado
            </p>
            <h1>Pagos de ligas</h1>
            <p>
              Controla quién ha pagado la inscripción de cada liga. Los usuarios
              verán un aviso privado dentro de su liga si tienen el pago pendiente.
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
              <button type="button" onClick={cargarLigas}>
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
              value={ligaSeleccionadaId ?? ""}
              onChange={(event) => setLigaSeleccionadaId(Number(event.target.value))}
              disabled={cargandoLigas}
            >
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
              placeholder="Buscar participante..."
            />
          </div>
        </section>

        <section className="summaryGrid">
          <article className="summaryCard">
            <span>Participantes</span>
            <strong>{resumen.total}</strong>
          </article>
          <article className="summaryCard paid">
            <span>Pagados</span>
            <strong>{resumen.pagados}</strong>
          </article>
          <article className="summaryCard pending">
            <span>Pendientes</span>
            <strong>{resumen.pendientes}</strong>
          </article>
          <article className="summaryCard money">
            <span>Importe pendiente</span>
            <strong>{formatearEuros(resumen.importePendiente)}</strong>
          </article>
        </section>

        <section className="membersPanel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Gestión rápida</p>
              <h2>{ligaSeleccionada?.nombre ?? "Selecciona una liga"}</h2>
            </div>
            <div className="pill">
              <Users size={16} />
              {miembrosFiltrados.length} visibles
            </div>
          </div>

          {cargandoMiembros ? (
            <div className="loadingInline">
              <Loader2 className="spin" size={22} />
              Cargando pagos...
            </div>
          ) : miembrosFiltrados.length === 0 ? (
            <div className="emptyBox">
              <Users size={30} />
              <h3>No hay participantes para mostrar</h3>
              <p>Prueba otra búsqueda o selecciona otra liga.</p>
            </div>
          ) : (
            <div className="paymentList">
              {miembrosFiltrados.map((item) => {
                const pagado = Boolean(item.pago?.pagado);

                return (
                  <article
                    key={item.participante.id}
                    className={`paymentRow ${pagado ? "isPaid" : "isPending"}`}
                  >
                    <div className="statusIcon">
                      {pagado ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </div>

                    <div className="memberInfo">
                      <h3>{nombreVisible(item.participante)}</h3>
                      <p>{pagado ? "Inscripción confirmada" : "Pendiente de pago"}</p>
                    </div>

                    <div className="amountBox">
                      <label>Importe</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.importeInput}
                        onChange={(event) =>
                          actualizarMiembroLocal(item.participante.id, {
                            importeInput: event.target.value,
                          })
                        }
                        disabled={item.guardando}
                      />
                    </div>

                    <div className="noteBox">
                      <label>Nota</label>
                      <input
                        type="text"
                        value={item.notaInput}
                        onChange={(event) =>
                          actualizarMiembroLocal(item.participante.id, {
                            notaInput: event.target.value,
                          })
                        }
                        placeholder="Bizum, transferencia..."
                        disabled={item.guardando}
                      />
                    </div>

                    <div className="actions">
                      <button
                        type="button"
                        className="paidButton"
                        onClick={() => guardarPago(item, true)}
                        disabled={item.guardando}
                      >
                        {item.guardando && pagado ? (
                          <Loader2 className="spin" size={16} />
                        ) : (
                          <Save size={16} />
                        )}
                        Pagado
                      </button>

                      <button
                        type="button"
                        className="pendingButton"
                        onClick={() => guardarPago(item, false)}
                        disabled={item.guardando}
                      >
                        {item.guardando && !pagado ? (
                          <Loader2 className="spin" size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                        Pendiente
                      </button>
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
        max-width: 760px;
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
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-bottom: 16px;
      }

      .selectorBlock label,
      .amountBox label,
      .noteBox label {
        display: block;
        margin-bottom: 7px;
        color: #bfdbfe;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .selectorBlock select,
      .searchBox,
      .amountBox input,
      .noteBox input {
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

      .selectorBlock select,
      .amountBox input,
      .noteBox input {
        padding: 15px 16px;
      }

      .searchBox {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        align-self: end;
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

      .summaryGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
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

      .summaryCard.money {
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

      .paymentList {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .paymentRow {
        display: grid;
        grid-template-columns: auto 1.1fr 160px 1fr auto;
        gap: 14px;
        align-items: center;
        border-radius: 24px;
        padding: 16px;
        background: rgba(2,6,23,0.42);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .paymentRow.isPaid {
        border-color: rgba(34,197,94,0.26);
      }

      .paymentRow.isPending {
        border-color: rgba(250,204,21,0.22);
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

      .isPaid .statusIcon {
        color: #86efac;
        background: rgba(34,197,94,0.14);
      }

      .isPending .statusIcon {
        color: #fde68a;
        background: rgba(250,204,21,0.14);
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

      .actions {
        display: flex;
        gap: 8px;
      }

      .actions button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border: none;
        border-radius: 16px;
        padding: 13px 14px;
        color: white;
        font-family: inherit;
        font-weight: 950;
        cursor: pointer;
        white-space: nowrap;
      }

      .paidButton {
        background: #16a34a;
      }

      .pendingButton {
        background: rgba(239,68,68,0.18);
        border: 1px solid rgba(239,68,68,0.26) !important;
        color: #fecaca !important;
      }

      button:disabled,
      input:disabled,
      select:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      @media (max-width: 1080px) {
        .paymentRow {
          grid-template-columns: auto 1fr;
          align-items: start;
        }

        .amountBox,
        .noteBox,
        .actions {
          grid-column: 2;
        }

        .actions {
          flex-wrap: wrap;
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

        .paymentRow {
          grid-template-columns: 1fr;
        }

        .statusIcon,
        .amountBox,
        .noteBox,
        .actions {
          grid-column: auto;
        }

        .actions {
          flex-direction: column;
        }
      }
    `}</style>
  );
}
