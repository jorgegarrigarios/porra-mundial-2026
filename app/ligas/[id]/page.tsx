"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Copy,
  Crown,
  Flame,
  Medal,
  RefreshCw,
  ScrollText,
  Share2,
  Shield,
  Sparkles,
  Table2,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

import { obtenerParticipanteActual } from "@/lib/participante";
import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
};

type Liga = {
  id: number;
  nombre: string;
  codigo: string;
  creador_id: number | null;
  inscripcion_eur: number | null;
};

type UsuarioActual = {
  id: number;
  nombre: string | null;
  nickname?: string | null;
};

type MiembroRanking = {
  id: number;
  nombre: string;
  puntos: number;
  puntosPartidos: number;
  puntosGrupos: number;
  puntosBonus: number;
  aciertos: number;
};

type LigaParticipanteRow = {
  participante_id: number;
  participantes:
    | {
        id: number;
        nombre: string | null;
        nickname: string | null;
      }
    | {
        id: number;
        nombre: string | null;
        nickname: string | null;
      }[]
    | null;
};

type PronosticoRow = {
  participante_id: number;
  puntos: number | null;
};

type PronosticoGrupoRow = {
  participante_id: number;
  puntos_total: number | null;
};

type PronosticoBonusRow = {
  participante_id: number;
  puntos_total: number | null;
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

function normalizarParticipante(
  participante: LigaParticipanteRow["participantes"]
) {
  if (!participante) return null;
  if (Array.isArray(participante)) return participante[0] ?? null;
  return participante;
}

function sumarPuntosPorParticipante<T extends { participante_id: number }>(
  filas: T[],
  participanteId: number,
  obtenerPuntos: (fila: T) => number | null
) {
  return filas
    .filter((fila) => fila.participante_id === participanteId)
    .reduce((total, fila) => total + (obtenerPuntos(fila) ?? 0), 0);
}

function formatearEuros(valor: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function normalizarImporte(valor: string) {
  const numero = Number(valor.replace(",", "."));

  if (!Number.isFinite(numero) || numero < 0) {
    return 0;
  }

  return Math.round(numero * 100) / 100;
}

export default function LigaDetallePage({ params }: Props) {
  const resolvedParams = use(params);

  const [ligaId, setLigaId] = useState<number | null>(null);
  const [liga, setLiga] = useState<Liga | null>(null);
  const [usuarioActual, setUsuarioActual] = useState<UsuarioActual | null>(null);
  const [ranking, setRanking] = useState<MiembroRanking[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sinAcceso, setSinAcceso] = useState(false);
  const [error, setError] = useState("");
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const [inscripcionInput, setInscripcionInput] = useState("0");
  const [guardandoInscripcion, setGuardandoInscripcion] = useState(false);
  const [mensajeInscripcion, setMensajeInscripcion] = useState("");

  useEffect(() => {
    const id = Number(resolvedParams.id);

    if (!id || Number.isNaN(id)) {
      setSinAcceso(true);
      setCargando(false);
      return;
    }

    setLigaId(id);
    cargarLiga(id);
  }, [resolvedParams.id]);

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
        () => cargarLiga(ligaId, true)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pronosticos_grupos",
        },
        () => cargarLiga(ligaId, true)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pronosticos_bonus",
        },
        () => cargarLiga(ligaId, true)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "liga_participantes",
        },
        () => cargarLiga(ligaId, true)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ligas",
          filter: `id=eq.${ligaId}`,
        },
        () => cargarLiga(ligaId, true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ligaId]);

  async function cargarLiga(id: number, silencioso = false) {
    if (!silencioso) {
      setCargando(true);
    }

    setSinAcceso(false);
    setError("");

    try {
      const usuario = await conTimeout(
        obtenerParticipanteActual(),
        10000,
        "No se ha podido cargar tu perfil."
      );

      if (!usuario) {
        setSinAcceso(true);
        return;
      }

      setUsuarioActual({
        id: usuario.id,
        nombre: usuario.nombre,
        nickname: usuario.nickname,
      });

      const { data: perteneceLiga, error: accesoError } = await conTimeout(
        supabase
          .from("liga_participantes")
          .select("id")
          .eq("liga_id", id)
          .eq("participante_id", usuario.id)
          .maybeSingle(),
        10000,
        "No se ha podido validar tu acceso a la liga."
      );

      if (accesoError || !perteneceLiga) {
        setSinAcceso(true);
        return;
      }

      const { data: ligaData, error: ligaError } = await conTimeout(
        supabase
          .from("ligas")
          .select("id, nombre, codigo, creador_id, inscripcion_eur")
          .eq("id", id)
          .single(),
        10000,
        "No se ha podido cargar la liga."
      );

      if (ligaError || !ligaData) {
        setLiga(null);
        setError("No se ha podido cargar la liga.");
        return;
      }

      const ligaNormalizada = ligaData as Liga;
      setLiga(ligaNormalizada);
      setInscripcionInput(String(ligaNormalizada.inscripcion_eur ?? 0));

      const { data: miembrosData, error: miembrosError } = await conTimeout(
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
          .eq("liga_id", id),
        10000,
        "No se han podido cargar los miembros de la liga."
      );

      if (miembrosError) {
        setError("No se han podido cargar los miembros de la liga.");
        return;
      }

      const miembros =
        ((miembrosData ?? []) as LigaParticipanteRow[])
          .map((item) => normalizarParticipante(item.participantes))
          .filter(
            (
              miembro
            ): miembro is {
              id: number;
              nombre: string | null;
              nickname: string | null;
            } => Boolean(miembro)
          ) ?? [];

      const idsMiembros = miembros.map((miembro) => miembro.id);

      const [
        { data: pronosticosData, error: pronosticosError },
        { data: gruposData, error: gruposError },
        { data: bonusData, error: bonusError },
      ] = await Promise.all([
        conTimeout(
          idsMiembros.length > 0
            ? supabase
                .from("pronosticos")
                .select("participante_id, puntos")
                .in("participante_id", idsMiembros)
            : supabase
                .from("pronosticos")
                .select("participante_id, puntos")
                .eq("participante_id", -1),
          10000,
          "No se ha podido cargar el ranking de partidos."
        ),
        conTimeout(
          idsMiembros.length > 0
            ? supabase
                .from("pronosticos_grupos")
                .select("participante_id, puntos_total")
                .in("participante_id", idsMiembros)
            : supabase
                .from("pronosticos_grupos")
                .select("participante_id, puntos_total")
                .eq("participante_id", -1),
          10000,
          "No se ha podido cargar el ranking de grupos."
        ),
        conTimeout(
          idsMiembros.length > 0
            ? supabase
                .from("pronosticos_bonus")
                .select("participante_id, puntos_total")
                .in("participante_id", idsMiembros)
            : supabase
                .from("pronosticos_bonus")
                .select("participante_id, puntos_total")
                .eq("participante_id", -1),
          10000,
          "No se ha podido cargar el ranking de bonus."
        ),
      ]);

      if (pronosticosError || gruposError || bonusError) {
        setError("No se ha podido cargar el ranking.");
        return;
      }

      const pronosticos = (pronosticosData ?? []) as PronosticoRow[];
      const pronosticosGrupos = (gruposData ?? []) as PronosticoGrupoRow[];
      const pronosticosBonus = (bonusData ?? []) as PronosticoBonusRow[];

      const rankingCalculado: MiembroRanking[] = miembros.map((miembro) => {
        const nombreVisible = miembro.nickname || miembro.nombre || "Usuario";

        const puntosPartidos = sumarPuntosPorParticipante(
          pronosticos,
          miembro.id,
          (p) => p.puntos
        );

        const puntosGrupos = sumarPuntosPorParticipante(
          pronosticosGrupos,
          miembro.id,
          (p) => p.puntos_total
        );

        const puntosBonus = sumarPuntosPorParticipante(
          pronosticosBonus,
          miembro.id,
          (p) => p.puntos_total
        );

        const puntos = puntosPartidos + puntosGrupos + puntosBonus;

        const aciertosPartidos = pronosticos.filter(
          (p) => p.participante_id === miembro.id && (p.puntos ?? 0) > 0
        ).length;

        const aciertosGrupos = pronosticosGrupos.filter(
          (p) => p.participante_id === miembro.id && (p.puntos_total ?? 0) > 0
        ).length;

        const aciertosBonus = pronosticosBonus.filter(
          (p) => p.participante_id === miembro.id && (p.puntos_total ?? 0) > 0
        ).length;

        const aciertos = aciertosPartidos + aciertosGrupos + aciertosBonus;

        return {
          id: miembro.id,
          nombre: nombreVisible,
          puntos,
          puntosPartidos,
          puntosGrupos,
          puntosBonus,
          aciertos,
        };
      });

      rankingCalculado.sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.aciertos !== a.aciertos) return b.aciertos - a.aciertos;
        return a.nombre.localeCompare(b.nombre);
      });

      setRanking(rankingCalculado);
    } catch (err) {
      console.error("Error cargando liga:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error cargando la liga."
      );
    } finally {
      setCargando(false);
    }
  }

  async function copiarCodigo() {
    if (!liga) return;

    try {
      await navigator.clipboard.writeText(liga.codigo);
      setCodigoCopiado(true);

      setTimeout(() => {
        setCodigoCopiado(false);
      }, 1800);
    } catch {
      setError("No se ha podido copiar el código.");
    }
  }

  async function copiarEnlaceInvitacion() {
    if (!liga) return;

    try {
      const origen = window.location.origin;
      const enlace = `${origen}/invitar/${encodeURIComponent(liga.codigo)}`;

      await navigator.clipboard.writeText(enlace);
      setEnlaceCopiado(true);

      setTimeout(() => {
        setEnlaceCopiado(false);
      }, 1800);
    } catch {
      setError("No se ha podido copiar el enlace de invitación.");
    }
  }

  async function guardarInscripcion() {
    if (!liga || !usuarioActual || liga.creador_id !== usuarioActual.id) return;

    const importe = normalizarImporte(inscripcionInput);

    setGuardandoInscripcion(true);
    setMensajeInscripcion("");
    setError("");

    try {
      const { error: updateError } = await conTimeout(
        supabase
          .from("ligas")
          .update({ inscripcion_eur: importe })
          .eq("id", liga.id)
          .eq("creador_id", usuarioActual.id),
        10000,
        "No se ha podido guardar la inscripción."
      );

      if (updateError) {
        setError("No se ha podido guardar la inscripción.");
        return;
      }

      setLiga({ ...liga, inscripcion_eur: importe });
      setInscripcionInput(String(importe));
      setMensajeInscripcion("Inscripción actualizada");

      setTimeout(() => {
        setMensajeInscripcion("");
      }, 2200);
    } catch (err) {
      console.error("Error guardando inscripción:", err);
      setError(
        err instanceof Error
          ? err.message
          : "No se ha podido guardar la inscripción."
      );
    } finally {
      setGuardandoInscripcion(false);
    }
  }

  const top3 = ranking.slice(0, 3);
  const lider = ranking[0] ?? null;
  const usuarioEnRanking = ranking.find(
    (miembro) => miembro.id === usuarioActual?.id
  );
  const posicionUsuario = usuarioEnRanking
    ? ranking.findIndex((miembro) => miembro.id === usuarioEnRanking.id) + 1
    : null;
  const diferenciaLider =
    lider && usuarioEnRanking ? lider.puntos - usuarioEnRanking.puntos : 0;
  const estaPrimero = posicionUsuario === 1;
  const miembrosTotales = ranking.length;
  const esAdminLiga = Boolean(
    liga && usuarioActual && liga.creador_id === usuarioActual.id
  );
  const inscripcionLiga = Number(liga?.inscripcion_eur ?? 0);
  const mantenimientoPlataforma = miembrosTotales * 1;
  const recaudadoTotal = miembrosTotales * inscripcionLiga;
  const botePremios = Math.max(recaudadoTotal - mantenimientoPlataforma, 0);
  const premioSegundo = inscripcionLiga > 0 ? inscripcionLiga * 2 : 0;
  const premioTercero = inscripcionLiga > 0 ? inscripcionLiga : 0;
  const premioPrimero = Math.max(
    botePremios - premioSegundo - premioTercero,
    0
  );

  if (cargando) {
    return (
      <main className="page">
        <div className="container">
          <section className="loadingCard">
            <div className="spinner" />
            <h1>Cargando tu liga...</h1>
            <p>Preparando ranking, podio y tu posición.</p>
          </section>
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

          <section className="emptyBox">
            <Shield size={34} />
            <h1>No tienes acceso a esta liga</h1>
            <p>Entra en una liga a la que pertenezcas o únete con un código.</p>

            <Link href="/ligas" className="primaryButton">
              Ir a mis ligas
            </Link>
          </section>
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

          <section className="emptyBox">
            <Trophy size={34} />
            <h1>Liga no encontrada</h1>
            <p>No hemos podido cargar esta liga.</p>

            <button
              type="button"
              className="primaryButton"
              onClick={() => ligaId && cargarLiga(ligaId)}
            >
              Reintentar
            </button>
          </section>
        </div>

        <Styles />
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <Link href="/ligas" className="backLink">
          <ArrowLeft size={18} />
          Cambiar de liga
        </Link>

        {error && (
          <section className="errorBox">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => ligaId && cargarLiga(ligaId)}
              className="retryButton"
            >
              <RefreshCw size={16} />
              Reintentar
            </button>
          </section>
        )}

        <section className="hero">
          <div className="heroGlow" />

          <div className="heroMain">
            <div className="heroIcon">
              {estaPrimero ? <Crown size={36} /> : <Trophy size={36} />}
            </div>

            <div className="heroText">
              <p className="eyebrow">
                {estaPrimero ? "Vas liderando la liga" : "Tu liga privada"}
              </p>

              <h1>{liga.nombre}</h1>

              <p>
                {usuarioEnRanking && posicionUsuario
                  ? estaPrimero
                    ? `Vas 1º de ${miembrosTotales}. Ahora toca defender el liderato.`
                    : `Vas ${posicionUsuario}º de ${miembrosTotales}. Estás a ${diferenciaLider} puntos del líder.`
                  : "Compite con tus amigos y sigue la clasificación en directo."}
              </p>
            </div>
          </div>

          <div className="heroActions">
            <Link href="/mis-pronosticos" className="heroCta">
              <Target size={20} />
              Hacer pronósticos
              <ArrowRight size={18} />
            </Link>

            <button type="button" onClick={copiarCodigo} className="codeButton">
              {codigoCopiado ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              {codigoCopiado ? "Copiado" : liga.codigo}
            </button>

            <button
              type="button"
              onClick={copiarEnlaceInvitacion}
              className="codeButton"
            >
              {enlaceCopiado ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
              {enlaceCopiado ? "Enlace copiado" : "Copiar enlace"}
            </button>
          </div>
        </section>

        <section className="personalPanel">
          <div className="personalCard featured">
            <div className="personalIcon">
              <Medal size={24} />
            </div>

            <p>Tu posición</p>

            <strong>
              {posicionUsuario ? `${posicionUsuario}º` : "-"}
              <span> / {miembrosTotales || 0}</span>
            </strong>
          </div>

          <div className="personalCard">
            <div className="personalIcon">
              <Zap size={24} />
            </div>

            <p>Tus puntos</p>

            <strong>{usuarioEnRanking?.puntos ?? 0}</strong>
          </div>

          <div className="personalCard">
            <div className="personalIcon">
              <Target size={24} />
            </div>

            <p>Tus aciertos</p>

            <strong>{usuarioEnRanking?.aciertos ?? 0}</strong>
          </div>

          <div className="personalCard">
            <div className="personalIcon">
              <Flame size={24} />
            </div>

            <p>Distancia al líder</p>

            <strong>
              {estaPrimero ? "Líder" : `${Math.max(diferenciaLider, 0)} pts`}
            </strong>
          </div>
        </section>

        {usuarioEnRanking && (
          <section className="pointsBreakdown">
            <div>
              <p>Partidos</p>
              <strong>{usuarioEnRanking.puntosPartidos}</strong>
            </div>

            <div>
              <p>Grupos</p>
              <strong>{usuarioEnRanking.puntosGrupos}</strong>
            </div>

            <div>
              <p>Bonus</p>
              <strong>{usuarioEnRanking.puntosBonus}</strong>
            </div>
          </section>
        )}

        <section className="prizePanel">
          <div className="prizeHeader">
            <div>
              <p className="sectionEyebrow">Bote privado de la liga</p>
              <h2>Bote y premios</h2>
              <p>
                El cálculo se actualiza automáticamente según los miembros de
                esta liga. 1 € por participante se destina al mantenimiento de
                servidores, API y plataforma.
              </p>
            </div>

            <div className="prizeTotal">
              <span>Bote premios</span>
              <strong>{formatearEuros(botePremios)}</strong>
            </div>
          </div>

          <div className="prizeGrid">
            <article className="prizeCard champion">
              <div className="prizeIcon">
                <Crown size={28} />
              </div>
              <p>1º puesto</p>
              <strong>{formatearEuros(premioPrimero)}</strong>
              <span>El campeón se lleva la gloria</span>
            </article>

            <article className="prizeCard">
              <div className="prizeIcon">
                <Medal size={28} />
              </div>
              <p>2º puesto</p>
              <strong>{formatearEuros(premioSegundo)}</strong>
              <span>Doble de la inscripción</span>
            </article>

            <article className="prizeCard">
              <div className="prizeIcon">
                <Trophy size={28} />
              </div>
              <p>3º puesto</p>
              <strong>{formatearEuros(premioTercero)}</strong>
              <span>Recupera la inscripción</span>
            </article>
          </div>

          <div className="moneySummary">
            <div>
              <span>Participantes</span>
              <strong>{miembrosTotales}</strong>
            </div>

            <div>
              <span>Inscripción</span>
              <strong>{formatearEuros(inscripcionLiga)}</strong>
            </div>

            <div>
              <span>Recaudado</span>
              <strong>{formatearEuros(recaudadoTotal)}</strong>
            </div>

            <div>
              <span>Mantenimiento</span>
              <strong>{formatearEuros(mantenimientoPlataforma)}</strong>
            </div>
          </div>

          {esAdminLiga ? (
            <div className="adminPrizeBox">
              <div>
                <strong>Configurar inscripción</strong>
                <p>Solo el administrador de la liga puede modificar este importe.</p>
              </div>

              <div className="adminControls">
                <label htmlFor="inscripcionLiga">Importe por usuario</label>
                <div className="inputRow">
                  <input
                    id="inscripcionLiga"
                    type="number"
                    min="0"
                    step="0.01"
                    value={inscripcionInput}
                    onChange={(event) => setInscripcionInput(event.target.value)}
                    disabled={guardandoInscripcion}
                  />

                  <button
                    type="button"
                    onClick={guardarInscripcion}
                    disabled={guardandoInscripcion}
                  >
                    {guardandoInscripcion ? "Guardando..." : "Guardar"}
                  </button>
                </div>

                {mensajeInscripcion && <small>{mensajeInscripcion}</small>}
              </div>
            </div>
          ) : (
            <div className="viewerPrizeNote">
              <Shield size={18} />
              Solo el administrador de la liga puede modificar la inscripción.
            </div>
          )}
        </section>

        <section className="contextActions">
          <Link href="/mis-pronosticos" className="contextAction primary">
            <Target size={23} />

            <div>
              <strong>Pronósticos</strong>
              <span>Haz o revisa tus resultados</span>
            </div>
          </Link>

          <Link href="/partidos" className="contextAction">
            <CalendarDays size={23} />

            <div>
              <strong>Partidos</strong>
              <span>Calendario completo</span>
            </div>
          </Link>

          <Link href="/clasificacion" className="contextAction">
            <Table2 size={23} />

            <div>
              <strong>Clasificación</strong>
              <span>Grupos y fases</span>
            </div>
          </Link>

          <Link href="/reglas" className="contextAction">
            <ScrollText size={23} />

            <div>
              <strong>Reglas</strong>
              <span>Sistema de puntos</span>
            </div>
          </Link>
        </section>

        <section className="sectionBlock">
          <div className="sectionHeader">
            <div>
              <p className="sectionEyebrow">Pique de la liga</p>
              <h2>Podio actual</h2>
            </div>

            <Sparkles size={26} />
          </div>

          {top3.length === 0 ? (
            <div className="emptyBox">
              <Trophy size={32} />
              <h1>Aún no hay ranking</h1>
              <p>Cuando haya pronósticos puntuados aparecerá el podio.</p>
            </div>
          ) : (
            <div className="podiumGrid">
              {top3.map((miembro, index) => (
                <PodiumCard
                  key={miembro.id}
                  miembro={miembro}
                  position={index + 1}
                  esUsuario={miembro.id === usuarioActual?.id}
                />
              ))}
            </div>
          )}
        </section>

        <section className="sectionBlock">
          <div className="sectionHeader">
            <div>
              <p className="sectionEyebrow">Clasificación en directo</p>
              <h2>Ranking completo</h2>
            </div>

            <div className="membersBadge">
              <Users size={17} />
              {miembrosTotales} miembros
            </div>
          </div>

          <div className="rankingList">
            {ranking.map((miembro, index) => {
              const esUsuario = miembro.id === usuarioActual?.id;

              return (
                <article
                  key={miembro.id}
                  className={`rankingRow ${esUsuario ? "rankingRowUser" : ""}`}
                >
                  <div className={`position position-${index + 1}`}>
                    {index + 1}
                  </div>

                  <div className="memberInfo">
                    <h3>
                      {miembro.nombre}
                      {esUsuario && <span>Tú</span>}
                    </h3>

                    <p>
                      {index === 0
                        ? "Líder actual"
                        : `${ranking[0]?.puntos - miembro.puntos} puntos del líder`}
                    </p>

                    <div className="miniBreakdown">
                      <span>Partidos {miembro.puntosPartidos}</span>
                      <span>Grupos {miembro.puntosGrupos}</span>
                      <span>Bonus {miembro.puntosBonus}</span>
                    </div>
                  </div>

                  <div className="memberStats">
                    <strong>{miembro.puntos}</strong>
                    <span>puntos</span>
                  </div>

                  <div className="aciertosBadge">
                    <Target size={15} />
                    {miembro.aciertos}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <Styles />
    </main>
  );
}

function PodiumCard({
  miembro,
  position,
  esUsuario,
}: {
  miembro: MiembroRanking;
  position: number;
  esUsuario: boolean;
}) {
  const config: Record<
    number,
    {
      label: string;
      className: string;
      icon: React.ReactNode;
    }
  > = {
    1: {
      label: "Líder",
      className: "gold",
      icon: <Crown size={36} />,
    },
    2: {
      label: "Segundo",
      className: "silver",
      icon: <Medal size={36} />,
    },
    3: {
      label: "Tercero",
      className: "bronze",
      icon: <Medal size={36} />,
    },
  };

  const item = config[position];

  return (
    <article className={`podiumCard ${item.className} ${esUsuario ? "mine" : ""}`}>
      <div className="podiumIcon">{item.icon}</div>

      <p>{item.label}</p>

      <h3>
        {miembro.nombre}
        {esUsuario && <span>Tú</span>}
      </h3>

      <strong>{miembro.puntos}</strong>

      <small>
        {miembro.aciertos} aciertos · {miembro.puntosPartidos} partidos ·{" "}
        {miembro.puntosGrupos} grupos · {miembro.puntosBonus} bonus
      </small>
    </article>
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
        position: relative;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 24px;
        align-items: center;
        background:
          linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.72)),
          radial-gradient(circle at top right, rgba(37,99,235,0.25), transparent 40%);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 36px;
        padding: 30px;
        box-shadow: 0 30px 90px rgba(0,0,0,0.28);
      }

      .heroGlow {
        position: absolute;
        width: 280px;
        height: 280px;
        right: -100px;
        top: -110px;
        border-radius: 999px;
        background: rgba(37,99,235,0.28);
        filter: blur(18px);
      }

      .heroMain,
      .heroActions {
        position: relative;
        z-index: 1;
      }

      .heroMain {
        display: flex;
        align-items: center;
        gap: 20px;
        min-width: 0;
      }

      .heroIcon {
        width: 82px;
        height: 82px;
        border-radius: 28px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 24px 58px rgba(37,99,235,0.32);
      }

      .eyebrow,
      .sectionEyebrow {
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
        font-size: 18px;
        line-height: 1.5;
        max-width: 680px;
      }

      .heroActions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 235px;
      }

      .heroCta,
      .primaryButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        border: none;
        border-radius: 18px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        padding: 16px 18px;
        font-weight: 950;
        text-decoration: none;
        box-shadow: 0 18px 44px rgba(37,99,235,0.30);
        cursor: pointer;
        font-family: inherit;
        font-size: 15px;
      }

      .codeButton,
      .retryButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 18px;
        padding: 14px 16px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.13);
        color: #dbeafe;
        font-weight: 950;
        cursor: pointer;
        font-family: inherit;
      }

      .personalPanel {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-top: 18px;
      }

      .personalCard {
        background: rgba(15,23,42,0.78);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 26px;
        padding: 20px;
      }

      .personalCard.featured {
        background: linear-gradient(145deg, rgba(37,99,235,0.22), rgba(15,23,42,0.78));
        border-color: rgba(96,165,250,0.28);
      }

      .personalIcon {
        width: 42px;
        height: 42px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(37,99,235,0.18);
        color: #bfdbfe;
        margin-bottom: 14px;
      }

      .personalCard p {
        margin: 0 0 7px;
        color: #94a3b8;
        font-weight: 850;
        font-size: 13px;
      }

      .personalCard strong {
        display: block;
        font-size: 32px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.04em;
      }

      .personalCard strong span {
        color: #94a3b8;
        font-size: 16px;
      }

      .pointsBreakdown {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-top: 14px;
      }

      .pointsBreakdown div {
        border-radius: 22px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        padding: 16px;
      }

      .pointsBreakdown p {
        margin: 0 0 6px;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .pointsBreakdown strong {
        font-size: 26px;
        font-weight: 950;
      }

      .prizePanel {
        position: relative;
        overflow: hidden;
        margin-top: 20px;
        border-radius: 32px;
        padding: 26px;
        background:
          radial-gradient(circle at top right, rgba(250,204,21,0.16), transparent 34%),
          linear-gradient(145deg, rgba(15,23,42,0.95), rgba(15,23,42,0.74));
        border: 1px solid rgba(250,204,21,0.18);
        box-shadow: 0 24px 80px rgba(0,0,0,0.24);
      }

      .prizeHeader {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 20px;
        align-items: start;
        margin-bottom: 18px;
      }

      .prizeHeader h2 {
        margin: 0;
        font-size: clamp(31px, 4vw, 44px);
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.045em;
      }

      .prizeHeader p {
        margin: 10px 0 0;
        color: #cbd5e1;
        line-height: 1.55;
        font-weight: 750;
        max-width: 720px;
      }

      .prizeTotal {
        min-width: 210px;
        border-radius: 26px;
        padding: 18px;
        text-align: right;
        background: rgba(250,204,21,0.12);
        border: 1px solid rgba(250,204,21,0.22);
      }

      .prizeTotal span,
      .moneySummary span {
        display: block;
        color: #fde68a;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .prizeTotal strong {
        display: block;
        margin-top: 6px;
        font-size: 34px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.055em;
      }

      .prizeGrid {
        display: grid;
        grid-template-columns: 1.35fr 1fr 1fr;
        gap: 14px;
      }

      .prizeCard {
        border-radius: 26px;
        padding: 20px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .prizeCard.champion {
        background: linear-gradient(145deg, rgba(250,204,21,0.18), rgba(255,255,255,0.06));
        border-color: rgba(250,204,21,0.30);
      }

      .prizeIcon {
        width: 50px;
        height: 50px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(37,99,235,0.16);
        color: #facc15;
        margin-bottom: 14px;
      }

      .prizeCard p {
        margin: 0 0 8px;
        color: #94a3b8;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 12px;
      }

      .prizeCard strong {
        display: block;
        font-size: 36px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.055em;
      }

      .prizeCard span {
        display: block;
        margin-top: 8px;
        color: #cbd5e1;
        font-weight: 850;
        line-height: 1.4;
      }

      .moneySummary {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-top: 14px;
      }

      .moneySummary div {
        border-radius: 22px;
        padding: 16px;
        background: rgba(2,6,23,0.34);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .moneySummary strong {
        display: block;
        margin-top: 6px;
        font-size: 24px;
        font-weight: 950;
        letter-spacing: -0.035em;
      }

      .adminPrizeBox,
      .viewerPrizeNote {
        margin-top: 14px;
        border-radius: 24px;
        background: rgba(37,99,235,0.12);
        border: 1px solid rgba(96,165,250,0.24);
      }

      .adminPrizeBox {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 18px;
        align-items: center;
        padding: 18px;
      }

      .adminPrizeBox strong {
        display: block;
        font-size: 17px;
        font-weight: 950;
      }

      .adminPrizeBox p {
        margin: 5px 0 0;
        color: #cbd5e1;
        font-weight: 750;
      }

      .adminControls label {
        display: block;
        margin-bottom: 7px;
        color: #bfdbfe;
        font-size: 12px;
        font-weight: 950;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .inputRow {
        display: flex;
        gap: 8px;
      }

      .inputRow input {
        width: 130px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(2,6,23,0.62);
        color: white;
        padding: 13px 14px;
        font-family: inherit;
        font-size: 15px;
        font-weight: 900;
        outline: none;
      }

      .inputRow input:focus {
        border-color: rgba(96,165,250,0.52);
        box-shadow: 0 0 0 4px rgba(37,99,235,0.18);
      }

      .inputRow button {
        border: none;
        border-radius: 16px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        padding: 13px 16px;
        font-family: inherit;
        font-weight: 950;
        cursor: pointer;
      }

      .inputRow button:disabled,
      .inputRow input:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .adminControls small {
        display: block;
        margin-top: 7px;
        color: #bbf7d0;
        font-weight: 850;
      }

      .viewerPrizeNote {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 14px 16px;
        color: #bfdbfe;
        font-weight: 850;
      }

      .contextActions {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
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
        border-radius: 24px;
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
        font-weight: 950;
      }

      .contextAction span {
        display: block;
        color: #94a3b8;
        font-size: 13px;
        margin-top: 3px;
        font-weight: 750;
      }

      .sectionBlock {
        margin-top: 38px;
      }

      .sectionHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 20px;
      }

      .sectionHeader h2 {
        margin: 0;
        font-size: clamp(31px, 4vw, 44px);
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.045em;
      }

      .membersBadge {
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

      .podiumGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .podiumCard {
        position: relative;
        overflow: hidden;
        border-radius: 30px;
        padding: 28px;
        text-align: center;
        background: linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.68));
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: 0 22px 70px rgba(0,0,0,0.22);
      }

      .podiumCard.gold {
        border-color: rgba(250,204,21,0.38);
        box-shadow: 0 28px 80px rgba(250,204,21,0.12);
      }

      .podiumCard.silver {
        border-color: rgba(209,213,219,0.35);
      }

      .podiumCard.bronze {
        border-color: rgba(251,146,60,0.35);
      }

      .podiumCard.mine {
        outline: 2px solid rgba(96,165,250,0.55);
      }

      .podiumIcon {
        width: 72px;
        height: 72px;
        border-radius: 26px;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(37,99,235,0.16);
        color: #facc15;
      }

      .podiumCard.silver .podiumIcon {
        color: #e5e7eb;
      }

      .podiumCard.bronze .podiumIcon {
        color: #fb923c;
      }

      .podiumCard p {
        margin: 0 0 8px;
        color: #94a3b8;
        font-weight: 950;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 12px;
      }

      .podiumCard h3 {
        margin: 0;
        font-size: 25px;
        font-weight: 950;
        letter-spacing: -0.03em;
      }

      .podiumCard h3 span,
      .memberInfo h3 span {
        display: inline-flex;
        margin-left: 8px;
        color: #bfdbfe;
        background: rgba(37,99,235,0.20);
        border: 1px solid rgba(96,165,250,0.28);
        border-radius: 999px;
        padding: 4px 8px;
        font-size: 11px;
        vertical-align: middle;
      }

      .podiumCard strong {
        display: block;
        margin-top: 14px;
        font-size: 44px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.06em;
      }

      .podiumCard small {
        display: block;
        margin-top: 8px;
        color: #94a3b8;
        font-weight: 850;
        line-height: 1.45;
      }

      .rankingList {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .rankingRow {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        align-items: center;
        gap: 16px;
        border-radius: 24px;
        padding: 18px;
        background: rgba(15,23,42,0.72);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .rankingRowUser {
        background: linear-gradient(145deg, rgba(37,99,235,0.22), rgba(15,23,42,0.78));
        border-color: rgba(96,165,250,0.32);
      }

      .position {
        width: 46px;
        height: 46px;
        border-radius: 16px;
        background: rgba(255,255,255,0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 950;
        color: white;
      }

      .position-1 {
        background: rgba(250,204,21,0.18);
        color: #fde68a;
      }

      .position-2 {
        background: rgba(209,213,219,0.16);
        color: #e5e7eb;
      }

      .position-3 {
        background: rgba(251,146,60,0.16);
        color: #fed7aa;
      }

      .memberInfo h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 950;
      }

      .memberInfo p {
        margin: 5px 0 0;
        color: #94a3b8;
        font-size: 13px;
        font-weight: 750;
      }

      .miniBreakdown {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }

      .miniBreakdown span {
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.10);
        color: #cbd5e1;
        padding: 5px 8px;
        font-size: 11px;
        font-weight: 900;
      }

      .memberStats {
        text-align: right;
      }

      .memberStats strong {
        display: block;
        font-size: 28px;
        line-height: 1;
        font-weight: 950;
      }

      .memberStats span {
        color: #94a3b8;
        font-size: 12px;
        font-weight: 850;
      }

      .aciertosBadge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border-radius: 999px;
        padding: 10px 12px;
        color: #bfdbfe;
        background: rgba(37,99,235,0.13);
        border: 1px solid rgba(96,165,250,0.22);
        font-weight: 950;
        white-space: nowrap;
      }

      .loadingCard,
      .emptyBox,
      .errorBox {
        background: rgba(15,23,42,0.74);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 30px;
        padding: 32px;
        text-align: center;
        color: #94a3b8;
      }

      .loadingCard {
        min-height: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .loadingCard h1,
      .emptyBox h1 {
        margin: 12px 0 8px;
        color: white;
        font-size: 32px;
        font-weight: 950;
        letter-spacing: -0.04em;
      }

      .loadingCard p,
      .emptyBox p {
        margin: 0 0 18px;
        line-height: 1.55;
        font-weight: 750;
      }

      .spinner {
        width: 36px;
        height: 36px;
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

      .errorBox {
        margin-bottom: 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        text-align: left;
        color: #fecaca;
        background: rgba(239,68,68,0.10);
        border-color: rgba(239,68,68,0.24);
      }

      @media (max-width: 920px) {
        .hero {
          grid-template-columns: 1fr;
        }

        .heroActions {
          min-width: 0;
          flex-direction: row;
        }

        .heroCta,
        .codeButton {
          flex: 1;
        }

        .personalPanel,
        .contextActions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .podiumGrid,
        .prizeGrid {
          grid-template-columns: 1fr;
        }

        .prizeHeader,
        .adminPrizeBox {
          grid-template-columns: 1fr;
        }

        .prizeTotal {
          min-width: 0;
          text-align: left;
        }

        .moneySummary {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .page {
          padding: 34px 14px 125px;
        }

        .hero {
          border-radius: 30px;
          padding: 24px;
        }

        .heroMain {
          align-items: flex-start;
        }

        .heroIcon {
          width: 62px;
          height: 62px;
          border-radius: 22px;
        }

        .hero h1 {
          font-size: 37px;
        }

        .hero p {
          font-size: 16px;
        }

        .heroActions {
          flex-direction: column;
        }

        .personalPanel,
        .contextActions,
        .pointsBreakdown,
        .moneySummary {
          grid-template-columns: 1fr;
        }

        .sectionHeader {
          align-items: flex-start;
          flex-direction: column;
        }

        .rankingRow {
          grid-template-columns: auto 1fr;
          align-items: flex-start;
        }

        .memberStats {
          text-align: left;
          grid-column: 2;
        }

        .aciertosBadge {
          grid-column: 2;
          width: fit-content;
        }

        .errorBox {
          flex-direction: column;
          align-items: stretch;
        }

        .prizePanel {
          border-radius: 28px;
          padding: 22px;
        }

        .inputRow {
          flex-direction: column;
        }

        .inputRow input {
          width: 100%;
        }
      }
    `}</style>
  );
}
