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
  Flag,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  XCircle,
} from "lucide-react";

import { comprobarAdminActual } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

type Liga = { id: number; nombre: string; codigo: string; estado: string };
type Participante = { id: number; nombre: string | null; nickname: string | null };

type LigaParticipanteRow = {
  liga_id: number;
  participante_id: number;
  participantes: Participante | Participante[] | null;
};

type PartidoRow = {
  id: number;
  local: string;
  visitante: string;
  fase: string | null;
  grupo: string | null;
};

type PronosticoRow = { participante_id: number; partido_id: number };

type PronosticoBonusRow = {
  participante_id: number;
  campeon: string | null;
  finalista_1: string | null;
  finalista_2: string | null;
  bota_oro: string | null;
  mejor_jugador: string | null;
  mejor_portero: string | null;
  seleccion_revelacion: string | null;
  seleccion_decepcion: string | null;
};

type PronosticoGrupoRow = {
  participante_id: number;
  grupo: string;
  clasificado_1: string | null;
  clasificado_2: string | null;
};

type Progreso = { completados: number; total: number; porcentaje: number };
type FaseProgreso = Progreso & { fase: string };

type SeguimientoUsuario = {
  ligaId: number;
  ligaNombre: string;
  ligaCodigo: string;
  participante: Participante;
  partidosTotal: Progreso;
  fases: FaseProgreso[];
  bonus: Progreso;
  grupos: Progreso;
  global: Progreso;
};

type FiltroEstado = "todos" | "pendientes" | "completos";

const TOTAL_BONUS = 8;
const ORDEN_FASES = [
  "Fase de grupos",
  "Dieciseisavos",
  "Octavos",
  "Cuartos",
  "Semifinales",
  "Tercer puesto",
  "Final",
];

async function conTimeout<T>(operacion: PromiseLike<T>, ms: number, mensaje = "La operación ha tardado demasiado."): Promise<T> {
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
  consultaBase: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  tamanoPagina = 1000
): Promise<T[]> {
  const filas: T[] = [];
  let desde = 0;

  while (true) {
    const hasta = desde + tamanoPagina - 1;
    const { data, error } = await conTimeout(consultaBase(desde, hasta), 12000, "La consulta ha tardado demasiado.");
    if (error) throw new Error(error.message);
    const pagina = data ?? [];
    filas.push(...pagina);
    if (pagina.length < tamanoPagina) break;
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

function normalizarTexto(texto: string | null) {
  return (texto ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function nombreFase(fase: string | null) {
  const limpia = fase?.trim();
  return limpia && limpia.length > 0 ? limpia : "Sin fase";
}

function faseOrdenada(fase: string) {
  const indice = ORDEN_FASES.findIndex((item) => normalizarTexto(item) === normalizarTexto(fase));
  return indice === -1 ? 999 : indice;
}

function esFaseGrupos(fase: string | null) {
  return normalizarTexto(fase) === "fase de grupos";
}

function esPlaceholderEquipo(equipo: string | null) {
  const limpio = equipo?.trim();
  if (!limpio) return true;
  const valor = limpio.toLowerCase();
  return /^[12][a-l]$/i.test(limpio) || /^3[a-l](\/[a-l])+$/i.test(limpio) || valor.startsWith("ganador ") || valor.startsWith("perdedor ");
}

function partidoTieneEquiposPendientes(partido: PartidoRow) {
  if (esFaseGrupos(partido.fase)) return false;
  return esPlaceholderEquipo(partido.local) || esPlaceholderEquipo(partido.visitante);
}

function calcularPorcentaje(completados: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completados / total) * 100));
}

function crearProgreso(completados: number, total: number): Progreso {
  return { completados, total, porcentaje: calcularPorcentaje(completados, total) };
}

function contarBonusCompletados(bonus: PronosticoBonusRow | undefined) {
  if (!bonus) return 0;
  return [
    bonus.campeon,
    bonus.finalista_1,
    bonus.finalista_2,
    bonus.bota_oro,
    bonus.mejor_jugador,
    bonus.mejor_portero,
    bonus.seleccion_revelacion,
    bonus.seleccion_decepcion,
  ].filter((valor) => valor && valor.trim().length > 0).length;
}

function estadoGlobal(usuario: SeguimientoUsuario) {
  if (usuario.global.porcentaje >= 100) return "Completo";
  if (usuario.global.porcentaje <= 0) return "Sin empezar";
  return "Pendiente";
}

function crearMensajeAviso(usuarios: SeguimientoUsuario[], ligaNombre: string | null) {
  const pendientes = usuarios.filter((usuario) => usuario.global.porcentaje < 100);

  if (pendientes.length === 0) {
    return "Todos los participantes tienen partidos, bonus y clasificados de grupo completados. No hace falta avisar a nadie.";
  }

  const tituloLiga = ligaNombre ? ` de la liga ${ligaNombre}` : "";
  const lineas = pendientes
    .map((usuario) => `- ${nombreVisible(usuario.participante)}: global ${usuario.global.porcentaje}% · partidos ${usuario.partidosTotal.completados}/${usuario.partidosTotal.total} · bonus ${usuario.bonus.completados}/${usuario.bonus.total} · grupos ${usuario.grupos.completados}/${usuario.grupos.total}`)
    .join("\n");

  return `Recordatorio Porra Mundial 2026${tituloLiga}:\n\nEstos usuarios todavía no tienen completados todos los apartados:\n\n${lineas}\n\nImportante: bonus y clasificados de grupo se cierran al empezar el Mundial. Los partidos se cierran individualmente cuando empieza cada partido.`;
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
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>("todos");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const ligaSeleccionada = useMemo(() => {
    if (ligaSeleccionadaId === "todas") return null;
    return ligas.find((liga) => liga.id === ligaSeleccionadaId) ?? null;
  }, [ligaSeleccionadaId, ligas]);

  const fasesDisponibles = useMemo(() => {
    const fases = new Set<string>();
    usuarios.forEach((usuario) => usuario.fases.forEach((fase) => fase.total > 0 && fases.add(fase.fase)));
    return Array.from(fases).sort((a, b) => {
      const ordenA = faseOrdenada(a);
      const ordenB = faseOrdenada(b);
      if (ordenA !== ordenB) return ordenA - ordenB;
      return a.localeCompare(b, "es", { numeric: true });
    });
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios
      .filter((usuario) => (ligaSeleccionadaId === "todas" ? true : usuario.ligaId === ligaSeleccionadaId))
      .filter((usuario) => {
        if (estadoFiltro === "pendientes") return usuario.global.porcentaje < 100;
        if (estadoFiltro === "completos") return usuario.global.porcentaje >= 100;
        return true;
      })
      .filter((usuario) => {
        if (!q) return true;
        return nombreVisible(usuario.participante).toLowerCase().includes(q) || usuario.ligaNombre.toLowerCase().includes(q) || usuario.ligaCodigo.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.global.porcentaje !== b.global.porcentaje) return a.global.porcentaje - b.global.porcentaje;
        return nombreVisible(a.participante).localeCompare(nombreVisible(b.participante), "es");
      });
  }, [busqueda, estadoFiltro, ligaSeleccionadaId, usuarios]);

  const resumen = useMemo(() => {
    const totalUsuarios = usuariosFiltrados.length;
    const completos = usuariosFiltrados.filter((usuario) => usuario.global.porcentaje >= 100).length;
    const pendientes = usuariosFiltrados.filter((usuario) => usuario.global.porcentaje < 100).length;
    const partidosPendientes = usuariosFiltrados.filter((usuario) => usuario.partidosTotal.porcentaje < 100).length;
    const bonusPendientes = usuariosFiltrados.filter((usuario) => usuario.bonus.porcentaje < 100).length;
    const gruposPendientes = usuariosFiltrados.filter((usuario) => usuario.grupos.porcentaje < 100).length;
    const media = totalUsuarios > 0 ? Math.round(usuariosFiltrados.reduce((acc, usuario) => acc + usuario.global.porcentaje, 0) / totalUsuarios) : 0;
    return { totalUsuarios, completos, pendientes, partidosPendientes, bonusPendientes, gruposPendientes, media };
  }, [usuariosFiltrados]);

  useEffect(() => {
    let activo = true;
    async function validar() {
      setCargandoPermisos(true);
      const admin = await comprobarAdminActual();
      if (!activo) return;
      if (!admin.isAdmin) {
        const { data: { session } } = await supabase.auth.getSession();
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
    return () => { activo = false; };
  }, [router]);

  async function cargarSeguimiento() {
    setCargandoDatos(true);
    setError("");
    setMensaje("");

    try {
      const [ligasData, partidosData, relacionesData, pronosticosData, bonusData, gruposData] = await Promise.all([
        cargarTodasLasPaginas<Liga>((desde, hasta) => supabase.from("ligas").select("id, nombre, codigo, estado").eq("estado", "activa").order("nombre", { ascending: true }).range(desde, hasta)),
        cargarTodasLasPaginas<PartidoRow>((desde, hasta) => supabase.from("partidos").select("id, local, visitante, fase, grupo").range(desde, hasta)),
        cargarTodasLasPaginas<LigaParticipanteRow>((desde, hasta) => supabase.from("liga_participantes").select(`liga_id, participante_id, participantes ( id, nombre, nickname )`).range(desde, hasta)),
        cargarTodasLasPaginas<PronosticoRow>((desde, hasta) => supabase.from("pronosticos").select("participante_id, partido_id").range(desde, hasta)),
        cargarTodasLasPaginas<PronosticoBonusRow>((desde, hasta) => supabase.from("pronosticos_bonus").select("participante_id, campeon, finalista_1, finalista_2, bota_oro, mejor_jugador, mejor_portero, seleccion_revelacion, seleccion_decepcion").range(desde, hasta)),
        cargarTodasLasPaginas<PronosticoGrupoRow>((desde, hasta) => supabase.from("pronosticos_grupos").select("participante_id, grupo, clasificado_1, clasificado_2").range(desde, hasta)),
      ]);

      const ligasPorId = new Map(ligasData.map((liga) => [liga.id, liga]));
      const partidosPronosticables = partidosData.filter((partido) => !partidoTieneEquiposPendientes(partido));
      const partidosPorFase = partidosPronosticables.reduce<Record<string, PartidoRow[]>>((acc, partido) => {
        const fase = nombreFase(partido.fase);
        if (!acc[fase]) acc[fase] = [];
        acc[fase].push(partido);
        return acc;
      }, {});
      const fases = Object.keys(partidosPorFase).sort((a, b) => {
        const ordenA = faseOrdenada(a);
        const ordenB = faseOrdenada(b);
        if (ordenA !== ordenB) return ordenA - ordenB;
        return a.localeCompare(b, "es", { numeric: true });
      });
      const gruposMundial = Array.from(new Set(partidosData.filter((partido) => esFaseGrupos(partido.fase)).map((partido) => partido.grupo?.trim()).filter((grupo): grupo is string => Boolean(grupo))));

      const pronosticosPorParticipante = new Map<number, Set<number>>();
      pronosticosData.forEach((pronostico) => {
        if (!pronosticosPorParticipante.has(pronostico.participante_id)) pronosticosPorParticipante.set(pronostico.participante_id, new Set<number>());
        pronosticosPorParticipante.get(pronostico.participante_id)?.add(pronostico.partido_id);
      });

      const bonusPorParticipante = new Map<number, PronosticoBonusRow>();
      bonusData.forEach((bonus) => bonusPorParticipante.set(bonus.participante_id, bonus));

      const gruposPorParticipante = new Map<number, Set<string>>();
      gruposData.forEach((grupo) => {
        if (!grupo.clasificado_1 || !grupo.clasificado_2) return;
        if (!gruposPorParticipante.has(grupo.participante_id)) gruposPorParticipante.set(grupo.participante_id, new Set<string>());
        gruposPorParticipante.get(grupo.participante_id)?.add(grupo.grupo);
      });

      const seguimiento = relacionesData
        .map((row) => {
          const liga = ligasPorId.get(row.liga_id);
          const participante = normalizarParticipante(row.participantes);
          if (!liga || !participante) return null;

          const pronosticosParticipante = pronosticosPorParticipante.get(row.participante_id) ?? new Set<number>();
          const fasesProgreso = fases.map((fase) => {
            const partidosFase = partidosPorFase[fase] ?? [];
            const completados = partidosFase.filter((partido) => pronosticosParticipante.has(partido.id)).length;
            const total = partidosFase.length;
            return { fase, completados, total, porcentaje: calcularPorcentaje(completados, total) };
          });
          const partidosCompletados = partidosPronosticables.filter((partido) => pronosticosParticipante.has(partido.id)).length;
          const partidosTotal = crearProgreso(partidosCompletados, partidosPronosticables.length);
          const bonus = crearProgreso(contarBonusCompletados(bonusPorParticipante.get(row.participante_id)), TOTAL_BONUS);
          const grupos = crearProgreso(gruposPorParticipante.get(row.participante_id)?.size ?? 0, gruposMundial.length);
          const global = crearProgreso(partidosTotal.completados + bonus.completados + grupos.completados, partidosTotal.total + bonus.total + grupos.total);

          return { ligaId: liga.id, ligaNombre: liga.nombre, ligaCodigo: liga.codigo, participante, partidosTotal, fases: fasesProgreso, bonus, grupos, global };
        })
        .filter((usuario): usuario is SeguimientoUsuario => Boolean(usuario));

      setLigas(ligasData);
      setUsuarios(seguimiento);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando el seguimiento de pronósticos.");
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

  function obtenerFaseUsuario(usuario: SeguimientoUsuario, fase: string) {
    return usuario.fases.find((faseUsuario) => faseUsuario.fase === fase) ?? { fase, completados: 0, total: 0, porcentaje: 0 };
  }

  if (cargandoPermisos) {
    return <main className="page centerPage"><div className="loadingBox"><Loader2 className="spin" size={34} /><p>Comprobando permisos de administrador...</p></div><Styles /></main>;
  }

  if (!autorizado) return null;

  return (
    <main className="page">
      <div className="container">
        <Link href="/admin" className="backLink"><ArrowLeft size={18} />Volver al panel admin</Link>

        <section className="hero">
          <div className="heroIcon"><ClipboardCheck size={34} /></div>
          <div>
            <p className="eyebrow"><ShieldCheck size={15} />Control privado</p>
            <h1>Seguimiento pronósticos</h1>
            <p>Controla por separado partidos, bonus y clasificados de grupo. Los bonus y grupos se cierran al empezar el Mundial; cada partido se cierra cuando empieza ese partido.</p>
          </div>
        </section>

        {(error || mensaje) && (
          <section className={`feedback ${error ? "error" : "success"}`}>
            <div>{error ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}<span>{error || mensaje}</span></div>
            {error && <button type="button" onClick={cargarSeguimiento}><RefreshCw size={16} />Reintentar</button>}
          </section>
        )}

        <section className="controlPanel">
          <div className="selectorBlock">
            <label htmlFor="ligaSelector">Liga</label>
            <select id="ligaSelector" value={ligaSeleccionadaId} onChange={(event) => { const valor = event.target.value; setLigaSeleccionadaId(valor === "todas" ? "todas" : Number(valor)); }} disabled={cargandoDatos}>
              <option value="todas">Todas las ligas activas</option>
              {ligas.map((liga) => <option key={liga.id} value={liga.id}>{liga.nombre} · {liga.codigo}</option>)}
            </select>
          </div>

          <div className="searchBox"><Search size={18} /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar usuario o liga..." /></div>

          <div className="selectorBlock">
            <label htmlFor="estadoSelector">Estado</label>
            <select id="estadoSelector" value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value as FiltroEstado)} disabled={cargandoDatos}>
              <option value="todos">Todos</option>
              <option value="pendientes">Solo pendientes</option>
              <option value="completos">Solo completos</option>
            </select>
          </div>

          <button type="button" className="copyButton" onClick={copiarAvisoPendientes} disabled={usuariosFiltrados.length === 0}><Clipboard size={18} />Copiar aviso</button>
        </section>

        <section className="summaryGrid">
          <article className="summaryCard"><span>Usuarios visibles</span><strong>{resumen.totalUsuarios}</strong></article>
          <article className="summaryCard paid"><span>100% completo</span><strong>{resumen.completos}</strong></article>
          <article className="summaryCard pending"><span>Global pendientes</span><strong>{resumen.pendientes}</strong></article>
          <article className="summaryCard partidos"><span>Partidos pendientes</span><strong>{resumen.partidosPendientes}</strong></article>
          <article className="summaryCard bonus"><span>Bonus pendientes</span><strong>{resumen.bonusPendientes}</strong></article>
          <article className="summaryCard grupos"><span>Grupos pendientes</span><strong>{resumen.gruposPendientes}</strong></article>
          <article className="summaryCard average"><span>Media global</span><strong>{resumen.media}%</strong></article>
        </section>

        <section className="infoPanel">
          <div><Target size={20} /><p><strong>Partidos:</strong> se separan por fase y se cierran individualmente.</p></div>
          <div><Sparkles size={20} /><p><strong>Bonus:</strong> 8 campos, cierre al inicio del Mundial.</p></div>
          <div><Flag size={20} /><p><strong>Clasificados de grupo:</strong> 1 bloque por grupo, cierre al inicio del Mundial.</p></div>
        </section>

        <section className="membersPanel">
          <div className="panelHeader"><div><p className="eyebrow">Control de avance</p><h2>{ligaSeleccionada ? ligaSeleccionada.nombre : "Todas las ligas activas"}</h2></div><div className="pill"><Users size={16} />{usuariosFiltrados.length} visibles</div></div>

          {cargandoDatos ? (
            <div className="loadingInline"><Loader2 className="spin" size={22} />Cargando seguimiento...</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="emptyBox"><Users size={30} /><h3>No hay usuarios para mostrar</h3><p>Prueba otra búsqueda, otra liga o cambia el filtro.</p></div>
          ) : (
            <div className="tableScroller">
              <table className="trackingTable">
                <thead><tr><th>Usuario</th><th>Liga</th><th>Global</th><th>Partidos total</th>{fasesDisponibles.map((fase) => <th key={fase}>{fase}</th>)}<th>Bonus</th><th>Clasificados grupo</th><th>Estado</th></tr></thead>
                <tbody>
                  {usuariosFiltrados.map((usuario) => {
                    const completo = usuario.global.porcentaje >= 100;
                    const sinEmpezar = usuario.global.porcentaje <= 0;
                    return (
                      <tr key={`${usuario.ligaId}-${usuario.participante.id}`}>
                        <td className="stickyUser"><div className="userCell"><div className={`statusDot ${completo ? "ok" : sinEmpezar ? "zero" : "pending"}`}>{completo ? <CheckCircle2 size={17} /> : sinEmpezar ? <XCircle size={17} /> : <AlertTriangle size={17} />}</div><div><strong>{nombreVisible(usuario.participante)}</strong><span>ID {usuario.participante.id}</span></div></div></td>
                        <td><div className="ligaCell"><strong>{usuario.ligaNombre}</strong><span>{usuario.ligaCodigo}</span></div></td>
                        <td><ProgressPill progreso={usuario.global} destacado /></td>
                        <td><ProgressPill progreso={usuario.partidosTotal} /></td>
                        {fasesDisponibles.map((fase) => <td key={`${usuario.ligaId}-${usuario.participante.id}-${fase}`}><ProgressPill progreso={obtenerFaseUsuario(usuario, fase)} compact /></td>)}
                        <td><ProgressPill progreso={usuario.bonus} /></td>
                        <td><ProgressPill progreso={usuario.grupos} /></td>
                        <td><span className={`estadoBadge ${completo ? "ok" : sinEmpezar ? "zero" : "pending"}`}>{estadoGlobal(usuario)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <Styles />
    </main>
  );
}

function ProgressPill({ progreso, destacado = false, compact = false }: { progreso: Progreso | FaseProgreso; destacado?: boolean; compact?: boolean }) {
  const completo = progreso.total > 0 && progreso.porcentaje >= 100;
  const sinDisponible = progreso.total <= 0;
  return (
    <div className={`progressPill ${destacado ? "destacado" : ""} ${completo ? "complete" : ""} ${sinDisponible ? "unavailable" : ""} ${compact ? "compact" : ""}`}>
      <div className="progressNumbers"><strong>{sinDisponible ? "—" : `${progreso.porcentaje}%`}</strong><span>{sinDisponible ? "No disponible" : `${progreso.completados}/${progreso.total}`}</span></div>
      {!sinDisponible && <div className="miniBar"><div style={{ width: `${progreso.porcentaje}%` }} /></div>}
    </div>
  );
}

function Styles() {
  return <style>{`
    .page{min-height:100vh;background:radial-gradient(circle at 50% 0%,rgba(37,99,235,.24),transparent 32%),radial-gradient(circle at 12% 18%,rgba(250,204,21,.10),transparent 25%),linear-gradient(180deg,#020617 0%,#07111f 46%,#111827 100%);color:white;padding:34px 16px 125px}.centerPage{display:flex;align-items:center;justify-content:center}.container{max-width:1380px;margin:0 auto}.backLink{display:inline-flex;align-items:center;gap:8px;color:#bfdbfe;text-decoration:none;font-weight:950;margin-bottom:18px}.hero{display:flex;align-items:center;gap:18px;margin-bottom:22px}.heroIcon{width:78px;height:78px;border-radius:28px;background:linear-gradient(135deg,#2563eb,#1d4ed8);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 24px 58px rgba(37,99,235,.32)}.eyebrow{display:inline-flex;align-items:center;gap:7px;margin:0 0 6px;color:#60a5fa;font-size:13px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.hero h1{margin:0;font-size:clamp(38px,6vw,62px);line-height:.95;letter-spacing:-.055em;font-weight:950}.hero p{margin:12px 0 0;color:#cbd5e1;font-size:17px;line-height:1.5;max-width:860px}.loadingBox,.loadingInline,.emptyBox{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#cbd5e1;font-weight:850}.loadingInline,.emptyBox{min-height:220px;border-radius:28px;background:rgba(15,23,42,.64);border:1px solid rgba(255,255,255,.10);text-align:center}.emptyBox h3{margin:0;color:white;font-size:26px;font-weight:950}.emptyBox p{margin:0;color:#94a3b8}.spin{animation:spin 1s linear infinite}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.feedback{display:flex;align-items:center;justify-content:space-between;gap:14px;border-radius:22px;padding:16px 18px;margin-bottom:20px;font-weight:850}.feedback div,.feedback button{display:inline-flex;align-items:center;gap:9px}.feedback button{border:none;border-radius:14px;background:rgba(255,255,255,.10);color:white;padding:10px 12px;font-family:inherit;font-weight:950;cursor:pointer}.feedback.error{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.28);color:#fecaca}.feedback.success{background:rgba(22,163,74,.12);border:1px solid rgba(22,163,74,.28);color:#bbf7d0}.controlPanel,.membersPanel,.infoPanel{border-radius:30px;padding:22px;background:rgba(15,23,42,.76);border:1px solid rgba(255,255,255,.10);box-shadow:0 24px 80px rgba(0,0,0,.20)}.controlPanel{display:grid;grid-template-columns:1.15fr 1fr .8fr auto;gap:14px;margin-bottom:16px;align-items:end}.selectorBlock label{display:block;margin-bottom:7px;color:#bfdbfe;font-size:12px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.selectorBlock select,.searchBox{width:100%;box-sizing:border-box;border-radius:18px;border:1px solid rgba(255,255,255,.12);background:rgba(2,6,23,.55);color:white;font-family:inherit;font-weight:850;outline:none}.selectorBlock select{padding:15px 16px}.searchBox{display:flex;align-items:center;gap:10px;padding:0 14px}.searchBox input{width:100%;border:none;background:transparent;color:white;outline:none;padding:16px 0;font-family:inherit;font-weight:850}.copyButton{min-height:50px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:18px;padding:0 16px;border:none;color:white;font-family:inherit;font-weight:950;cursor:pointer;white-space:nowrap;background:linear-gradient(135deg,#2563eb,#1d4ed8);box-shadow:0 16px 32px rgba(37,99,235,.22)}.summaryGrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:14px;margin-bottom:16px}.summaryCard{border-radius:24px;padding:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10)}.summaryCard span{display:block;color:#94a3b8;font-size:12px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px}.summaryCard strong{display:block;font-size:32px;line-height:1;font-weight:950;letter-spacing:-.04em}.summaryCard.paid{border-color:rgba(34,197,94,.28);background:rgba(34,197,94,.10)}.summaryCard.pending{border-color:rgba(250,204,21,.28);background:rgba(250,204,21,.10)}.summaryCard.partidos{border-color:rgba(96,165,250,.28);background:rgba(37,99,235,.12)}.summaryCard.bonus{border-color:rgba(217,70,239,.28);background:rgba(217,70,239,.10)}.summaryCard.grupos{border-color:rgba(45,212,191,.28);background:rgba(20,184,166,.10)}.summaryCard.average{border-color:rgba(148,163,184,.28);background:rgba(148,163,184,.10)}.infoPanel{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:16px}.infoPanel div{display:flex;align-items:flex-start;gap:10px;border-radius:20px;padding:14px;background:rgba(255,255,255,.05);color:#cbd5e1;font-weight:750;line-height:1.45}.infoPanel p{margin:0}.infoPanel strong{color:white;margin-right:4px}.panelHeader{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}.panelHeader h2{margin:0;font-size:clamp(30px,4vw,42px);line-height:1;font-weight:950;letter-spacing:-.04em}.pill{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:10px 14px;color:#bfdbfe;background:rgba(37,99,235,.13);border:1px solid rgba(96,165,250,.22);font-weight:950;white-space:nowrap}.tableScroller{overflow-x:auto;border-radius:24px;border:1px solid rgba(255,255,255,.10)}.trackingTable{width:100%;min-width:1180px;border-collapse:collapse;background:rgba(2,6,23,.34)}.trackingTable th,.trackingTable td{padding:14px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;vertical-align:middle}.trackingTable th{position:sticky;top:0;z-index:2;background:rgba(15,23,42,.98);color:#bfdbfe;font-size:12px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}.trackingTable tbody tr:hover{background:rgba(255,255,255,.035)}.stickyUser{position:sticky;left:0;z-index:1;background:rgba(15,23,42,.98);min-width:220px}.userCell{display:flex;align-items:center;gap:10px}.userCell strong,.ligaCell strong{display:block;color:white;font-size:15px;font-weight:950;white-space:nowrap}.userCell span,.ligaCell span{display:block;color:#94a3b8;font-size:12px;font-weight:850;margin-top:3px}.statusDot{width:40px;height:40px;border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}.statusDot.ok{color:#86efac;background:rgba(34,197,94,.14)}.statusDot.pending{color:#fde68a;background:rgba(250,204,21,.14)}.statusDot.zero{color:#fecaca;background:rgba(239,68,68,.14)}.progressPill{min-width:116px;border-radius:18px;padding:10px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.10)}.progressPill.compact{min-width:104px}.progressPill.destacado{border-color:rgba(96,165,250,.34);background:rgba(37,99,235,.14)}.progressPill.complete{border-color:rgba(34,197,94,.28);background:rgba(34,197,94,.10)}.progressPill.unavailable{color:#94a3b8;background:rgba(148,163,184,.08)}.progressNumbers{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.progressNumbers strong{font-size:19px;font-weight:950;letter-spacing:-.04em}.progressNumbers span{color:#cbd5e1;font-size:12px;font-weight:900;white-space:nowrap}.miniBar{margin-top:7px;height:8px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.10)}.miniBar div{height:100%;border-radius:999px;background:linear-gradient(90deg,#2563eb,#22c55e)}.estadoBadge{display:inline-flex;align-items:center;border-radius:999px;padding:9px 12px;font-size:13px;font-weight:950;white-space:nowrap}.estadoBadge.ok{background:rgba(34,197,94,.13);color:#86efac}.estadoBadge.pending{background:rgba(250,204,21,.13);color:#fde68a}.estadoBadge.zero{background:rgba(239,68,68,.13);color:#fecaca}button:disabled,input:disabled,select:disabled{opacity:.65;cursor:not-allowed}@media(max-width:1180px){.controlPanel{grid-template-columns:1fr 1fr}.summaryGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.infoPanel{grid-template-columns:1fr}}@media(max-width:820px){.hero{align-items:flex-start}.heroIcon{width:62px;height:62px;border-radius:22px}.controlPanel,.summaryGrid{grid-template-columns:1fr}.panelHeader{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.page{padding:28px 14px 115px}.hero h1{font-size:38px}.controlPanel,.membersPanel,.infoPanel{border-radius:26px;padding:18px}.trackingTable{min-width:1080px}.stickyUser{min-width:190px}}
  `}</style>;
}
