"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Eye,
  Flag,
  Loader2,
  Lock,
  Medal,
  Save,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { obtenerParticipanteActual } from "@/lib/participante";
import { supabase } from "@/lib/supabase";

type PartidoRow = {
  local: string | null;
  visitante: string | null;
  fase: string | null;
  grupo: string | null;
};

type ParticipanteSimple = {
  id: number;
  nombre: string | null;
  nickname?: string | null;
};

type PronosticoGrupoRow = {
  id?: number;
  participante_id: number;
  grupo: string;
  clasificado_1: string | null;
  clasificado_2: string | null;
  puntos_total?: number | null;
  participantes?:
    | ParticipanteSimple
    | ParticipanteSimple[]
    | null;
};

type LigaUsuario = {
  id: number;
  nombre: string;
};

type LigaParticipanteRow = {
  id: number;
  liga_id: number;
  participante_id: number;
  created_at?: string | null;
};

type GrupoOpciones = {
  grupo: string;
  selecciones: string[];
};

type PronosticosPorGrupo = Record<string, PronosticoGrupoRow>;

type TendenciaClasificado = {
  seleccion: string;
  cantidad: number;
  porcentaje: number;
};

type PronosticosAgrupadosUsuario = {
  participante_id: number;
  nombre: string;
  pronosticos: Record<string, PronosticoGrupoRow>;
  puntos_total: number;
};

function normalizarEquipo(equipo: string | null) {
  const limpio = equipo?.trim();

  if (!limpio) return null;

  const valor = limpio.toLowerCase();

  const esPlaceholder =
    /^[12][a-l]$/i.test(limpio) ||
    /^3[a-l](\/[a-l])+$/i.test(limpio) ||
    valor.startsWith("ganador ") ||
    valor.startsWith("perdedor ");

  if (esPlaceholder) return null;

  return limpio;
}

function esFaseGrupos(fase: string | null) {
  return fase?.trim().toLowerCase() === "fase de grupos";
}

function ordenarGrupos(a: string, b: string) {
  return a.localeCompare(b, "es", { numeric: true });
}

function limpiarValor(valor: string) {
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

function obtenerParticipanteDePronostico(pronostico: PronosticoGrupoRow) {
  if (!pronostico.participantes) return null;

  if (Array.isArray(pronostico.participantes)) {
    return pronostico.participantes[0] ?? null;
  }

  return pronostico.participantes;
}

function obtenerNombreVisible(pronostico: PronosticoGrupoRow) {
  const participante = obtenerParticipanteDePronostico(pronostico);

  return (
    participante?.nickname?.trim() ||
    participante?.nombre?.trim() ||
    `Participante ${pronostico.participante_id}`
  );
}

const MUNDIAL_START_AT = new Date("2026-06-11T21:00:00+02:00");

function estanClasificadosBloqueados() {
  return new Date() >= MUNDIAL_START_AT;
}

function textoFechaBloqueo() {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(MUNDIAL_START_AT);
}

function construirGrupos(partidos: PartidoRow[]) {
  const mapa = new Map<string, Set<string>>();

  partidos
    .filter((partido) => esFaseGrupos(partido.fase))
    .forEach((partido) => {
      const grupo = partido.grupo?.trim();

      if (!grupo) return;

      if (!mapa.has(grupo)) {
        mapa.set(grupo, new Set<string>());
      }

      const local = normalizarEquipo(partido.local);
      const visitante = normalizarEquipo(partido.visitante);

      if (local) mapa.get(grupo)?.add(local);
      if (visitante) mapa.get(grupo)?.add(visitante);
    });

  return Array.from(mapa.entries())
    .map(([grupo, selecciones]) => ({
      grupo,
      selecciones: Array.from(selecciones).sort((a, b) =>
        a.localeCompare(b, "es")
      ),
    }))
    .sort((a, b) => ordenarGrupos(a.grupo, b.grupo));
}

function calcularTendenciasGrupo(
  grupo: string,
  pronosticosLiga: PronosticoGrupoRow[]
) {
  const pronosticosDelGrupo = pronosticosLiga.filter(
    (pronostico) => pronostico.grupo === grupo
  );

  const mapa = new Map<string, number>();

  pronosticosDelGrupo.forEach((pronostico) => {
    [pronostico.clasificado_1, pronostico.clasificado_2].forEach((seleccion) => {
      const limpio = seleccion?.trim();

      if (!limpio) return;

      mapa.set(limpio, (mapa.get(limpio) || 0) + 1);
    });
  });

  const totalPronosticos = pronosticosDelGrupo.length;

  return Array.from(mapa.entries())
    .map(([seleccion, cantidad]) => ({
      seleccion,
      cantidad,
      porcentaje:
        totalPronosticos > 0 ? Math.round((cantidad / totalPronosticos) * 100) : 0,
    }))
    .sort(
      (a, b) =>
        b.cantidad - a.cantidad || a.seleccion.localeCompare(b.seleccion, "es")
    );
}

function agruparPronosticosPorUsuario(pronosticosLiga: PronosticoGrupoRow[]) {
  const mapa = new Map<number, PronosticosAgrupadosUsuario>();

  pronosticosLiga.forEach((pronostico) => {
    if (!mapa.has(pronostico.participante_id)) {
      mapa.set(pronostico.participante_id, {
        participante_id: pronostico.participante_id,
        nombre: obtenerNombreVisible(pronostico),
        pronosticos: {},
        puntos_total: 0,
      });
    }

    const usuario = mapa.get(pronostico.participante_id);

    if (!usuario) return;

    usuario.pronosticos[pronostico.grupo] = pronostico;
    usuario.puntos_total += pronostico.puntos_total ?? 0;
  });

  return Array.from(mapa.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es")
  );
}

export default function GruposPage() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [participanteId, setParticipanteId] = useState<number | null>(null);
  const [grupos, setGrupos] = useState<GrupoOpciones[]>([]);
  const [pronosticos, setPronosticos] = useState<PronosticosPorGrupo>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ligasUsuario, setLigasUsuario] = useState<LigaUsuario[]>([]);
  const [ligaSeleccionadaId, setLigaSeleccionadaId] = useState<number | null>(null);
  const [participantesLigaIds, setParticipantesLigaIds] = useState<number[]>([]);
  const [pronosticosLiga, setPronosticosLiga] = useState<PronosticoGrupoRow[]>([]);
  const [errorLiga, setErrorLiga] = useState<string | null>(null);
  const [cargandoLiga, setCargandoLiga] = useState(false);

  const clasificadosBloqueados = estanClasificadosBloqueados();

  const ligaSeleccionada = useMemo(
    () => ligasUsuario.find((liga) => liga.id === ligaSeleccionadaId) ?? null,
    [ligasUsuario, ligaSeleccionadaId]
  );

  const pronosticosUsuariosLiga = useMemo(
    () => agruparPronosticosPorUsuario(pronosticosLiga),
    [pronosticosLiga]
  );

  const progreso = useMemo(() => {
    const total = grupos.length * 2;

    if (total === 0) {
      return {
        completados: 0,
        total: 0,
        porcentaje: 0,
        gruposCompletos: 0,
      };
    }

    const completados = grupos.reduce((acc, grupo) => {
      const pronostico = pronosticos[grupo.grupo];

      return (
        acc +
        (pronostico?.clasificado_1 ? 1 : 0) +
        (pronostico?.clasificado_2 ? 1 : 0)
      );
    }, 0);

    const gruposCompletos = grupos.filter((grupo) => {
      const pronostico = pronosticos[grupo.grupo];
      return Boolean(pronostico?.clasificado_1 && pronostico?.clasificado_2);
    }).length;

    return {
      completados,
      total,
      porcentaje: Math.round((completados / total) * 100),
      gruposCompletos,
    };
  }, [grupos, pronosticos]);

  const hayPronosticosGuardados = useMemo(() => {
    return Object.values(pronosticos).some((pronostico) => Boolean(pronostico.id));
  }, [pronosticos]);

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        setCargando(true);
        setMensaje(null);
        setError(null);
        setErrorLiga(null);

        const participante = await obtenerParticipanteActual();

        if (!activo) return;

        if (!participante) {
          setError("No se ha podido cargar tu usuario. Cierra sesión y vuelve a entrar.");
          return;
        }

        setParticipanteId(participante.id);

        const [
          { data: partidosData, error: partidosError },
          { data: pronosticosData, error: pronosticosError },
        ] = await Promise.all([
          supabase.from("partidos").select("local, visitante, fase, grupo"),
          supabase
            .from("pronosticos_grupos")
            .select("id, participante_id, grupo, clasificado_1, clasificado_2, puntos_total")
            .eq("participante_id", participante.id),
        ]);

        if (!activo) return;

        if (partidosError) {
          throw new Error(partidosError.message);
        }

        if (pronosticosError) {
          throw new Error(pronosticosError.message);
        }

        const gruposConstruidos = construirGrupos((partidosData || []) as PartidoRow[]);

        const guardados: PronosticosPorGrupo = {};

        (pronosticosData || []).forEach((pronostico) => {
          guardados[pronostico.grupo] = pronostico as PronosticoGrupoRow;
        });

        const iniciales: PronosticosPorGrupo = {};

        gruposConstruidos.forEach((grupo) => {
          iniciales[grupo.grupo] =
            guardados[grupo.grupo] || {
              participante_id: participante.id,
              grupo: grupo.grupo,
              clasificado_1: null,
              clasificado_2: null,
              puntos_total: 0,
            };
        });

        setGrupos(gruposConstruidos);
        setPronosticos(iniciales);

        if (clasificadosBloqueados) {
          const ligas = await cargarLigasDelUsuario(participante.id);

          if (!activo) return;

          setLigasUsuario(ligas);

          if (ligas.length > 0) {
            setLigaSeleccionadaId(ligas[0].id);
            await cargarPronosticosDeLiga(ligas[0].id);
          } else {
            setErrorLiga("No se ha encontrado ninguna liga asociada a tu usuario.");
          }
        }
      } catch (err) {
        console.error("Error cargando clasificados de grupo:", err);
        if (activo) {
          setError("No se han podido cargar los grupos. Prueba de nuevo en unos segundos.");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (clasificadosBloqueados && ligaSeleccionadaId) {
      cargarPronosticosDeLiga(ligaSeleccionadaId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ligaSeleccionadaId]);

  async function cargarLigasDelUsuario(idParticipante: number) {
    const { data: relacionesData, error: relacionesError } = await supabase
      .from("liga_participantes")
      .select("id, liga_id, participante_id, created_at")
      .eq("participante_id", idParticipante);

    if (relacionesError) {
      console.error("Error cargando ligas del usuario:", relacionesError.message);
      return [];
    }

    const relaciones = (relacionesData ?? []) as LigaParticipanteRow[];

    const idsLigas = Array.from(
      new Set(
        relaciones
          .map((fila) => fila.liga_id)
          .filter((ligaId): ligaId is number => typeof ligaId === "number")
      )
    );

    if (idsLigas.length === 0) {
      return [];
    }

    const { data: ligasData, error: ligasError } = await supabase
      .from("ligas")
      .select("id, nombre")
      .in("id", idsLigas)
      .order("nombre", { ascending: true });

    if (ligasError) {
      console.error("Error cargando datos de ligas:", ligasError.message);

      return idsLigas.map((ligaId) => ({
        id: ligaId,
        nombre: `Liga ${ligaId}`,
      }));
    }

    return ((ligasData ?? []) as LigaUsuario[]).map((liga) => ({
      id: liga.id,
      nombre: liga.nombre || `Liga ${liga.id}`,
    }));
  }

  async function cargarParticipantesDeLiga(ligaId: number) {
    const { data: relacionesData, error: relacionesError } = await supabase
      .from("liga_participantes")
      .select("id, liga_id, participante_id, created_at")
      .eq("liga_id", ligaId);

    if (relacionesError) {
      console.error("Error cargando participantes de liga:", relacionesError.message);
      return [];
    }

    const relaciones = (relacionesData ?? []) as LigaParticipanteRow[];

    return Array.from(
      new Set(
        relaciones
          .map((fila) => fila.participante_id)
          .filter(
            (idParticipante): idParticipante is number =>
              typeof idParticipante === "number"
          )
      )
    );
  }

  async function cargarPronosticosDeLiga(ligaId: number) {
    try {
      setCargandoLiga(true);
      setErrorLiga(null);

      const idsParticipantesLiga = await cargarParticipantesDeLiga(ligaId);

      setParticipantesLigaIds(idsParticipantesLiga);

      if (idsParticipantesLiga.length === 0) {
        setPronosticosLiga([]);
        setErrorLiga("No se han encontrado participantes en esta liga.");
        return;
      }

      const { data: pronosticosData, error: pronosticosError } = await supabase
        .from("pronosticos_grupos")
        .select(
          `
          id,
          participante_id,
          grupo,
          clasificado_1,
          clasificado_2,
          puntos_total,
          participantes (
            id,
            nombre,
            nickname
          )
        `
        )
        .in("participante_id", idsParticipantesLiga)
        .order("participante_id", { ascending: true })
        .order("grupo", { ascending: true });

      if (pronosticosError) {
        console.error("Error cargando clasificados de liga:", pronosticosError.message);
        setPronosticosLiga([]);
        setErrorLiga("No se han podido cargar los clasificados de esta liga.");
        return;
      }

      setPronosticosLiga((pronosticosData ?? []) as PronosticoGrupoRow[]);
    } finally {
      setCargandoLiga(false);
    }
  }

  function actualizarPronostico(
    grupo: string,
    campo: "clasificado_1" | "clasificado_2",
    valor: string
  ) {
    setMensaje(null);
    setError(null);

    if (clasificadosBloqueados) {
      setError("Los clasificados de grupo ya están bloqueados porque el Mundial ha comenzado.");
      return;
    }

    setPronosticos((actual) => ({
      ...actual,
      [grupo]: {
        ...actual[grupo],
        grupo,
        participante_id: participanteId || actual[grupo]?.participante_id || 0,
        [campo]: limpiarValor(valor),
      },
    }));
  }

  async function guardarGrupos() {
    if (!participanteId) {
      setError("No se ha podido identificar tu usuario.");
      return;
    }

    if (clasificadosBloqueados) {
      setMensaje(null);
      setError("Los clasificados de grupo ya están bloqueados desde el inicio del Mundial. No se pueden modificar.");
      return;
    }

    const gruposConUnSoloClasificado = grupos.filter((grupo) => {
      const pronostico = pronosticos[grupo.grupo];

      const tienePrimero = Boolean(pronostico?.clasificado_1);
      const tieneSegundo = Boolean(pronostico?.clasificado_2);

      return (tienePrimero && !tieneSegundo) || (!tienePrimero && tieneSegundo);
    });

    if (gruposConUnSoloClasificado.length > 0) {
      setError("Si completas un grupo, debes elegir los dos clasificados.");
      return;
    }

    const duplicados = grupos.filter((grupo) => {
      const pronostico = pronosticos[grupo.grupo];
      return (
        pronostico?.clasificado_1 &&
        pronostico?.clasificado_2 &&
        pronostico.clasificado_1 === pronostico.clasificado_2
      );
    });

    if (duplicados.length > 0) {
      setError("No puedes elegir la misma selección dos veces en un grupo.");
      return;
    }

    try {
      setGuardando(true);
      setMensaje(null);
      setError(null);

      const gruposVaciosGuardados = grupos.filter((grupo) => {
        const pronostico = pronosticos[grupo.grupo];

        return (
          Boolean(pronostico?.id) &&
          !pronostico?.clasificado_1 &&
          !pronostico?.clasificado_2
        );
      });

      if (gruposVaciosGuardados.length > 0) {
        const gruposABorrar = gruposVaciosGuardados.map((grupo) => grupo.grupo);

        const { error: borrarError } = await supabase
          .from("pronosticos_grupos")
          .delete()
          .eq("participante_id", participanteId)
          .in("grupo", gruposABorrar);

        if (borrarError) {
          throw new Error(borrarError.message);
        }
      }

      const payload = grupos
        .filter((grupo) => {
          const pronostico = pronosticos[grupo.grupo];

          return Boolean(pronostico?.clasificado_1 && pronostico?.clasificado_2);
        })
        .map((grupo) => {
          const pronostico = pronosticos[grupo.grupo];

          return {
            participante_id: participanteId,
            grupo: grupo.grupo,
            clasificado_1: pronostico.clasificado_1,
            clasificado_2: pronostico.clasificado_2,
          };
        });

      let data: PronosticoGrupoRow[] | null = [];

      if (payload.length > 0) {
        const { data: upsertData, error: guardarError } = await supabase
          .from("pronosticos_grupos")
          .upsert(payload, {
            onConflict: "participante_id,grupo",
          })
          .select("id, participante_id, grupo, clasificado_1, clasificado_2, puntos_total");

        if (guardarError) {
          throw new Error(guardarError.message);
        }

        data = (upsertData || []) as PronosticoGrupoRow[];
      }

      const actualizados: PronosticosPorGrupo = {};

      (data || []).forEach((pronostico) => {
        actualizados[pronostico.grupo] = pronostico as PronosticoGrupoRow;
      });

      setPronosticos((actual) => {
        const siguiente: PronosticosPorGrupo = {};

        grupos.forEach((grupo) => {
          const pronosticoActual = actual[grupo.grupo];

          if (
            pronosticoActual?.id &&
            !pronosticoActual.clasificado_1 &&
            !pronosticoActual.clasificado_2
          ) {
            siguiente[grupo.grupo] = {
              participante_id: participanteId,
              grupo: grupo.grupo,
              clasificado_1: null,
              clasificado_2: null,
              puntos_total: 0,
            };

            return;
          }

          siguiente[grupo.grupo] = actualizados[grupo.grupo] || pronosticoActual;
        });

        return siguiente;
      });

      setMensaje(
        hayPronosticosGuardados
          ? "Clasificados actualizados correctamente."
          : "Clasificados guardados correctamente."
      );
    } catch (err) {
      console.error("Error guardando clasificados de grupo:", err);
      setError("No se han podido guardar los clasificados. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 pb-32 pt-6 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center shadow-2xl">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-emerald-300" />
          <h1 className="text-2xl font-black">Cargando grupos</h1>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            Estamos preparando tus pronósticos de clasificados.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-32 pt-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-slate-900 to-slate-950 p-5 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                <Sparkles className="h-3.5 w-3.5" />
                Clasificados de grupo
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                ¿Quién pasa de grupos?
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Elige las dos selecciones que crees que pasarán en cada grupo.
                También importa el orden: acertarlo puede darte puntos extra.
              </p>

              {clasificadosBloqueados && (
                <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
                  Clasificados de grupo bloqueados desde {textoFechaBloqueo()}. Ya no se pueden modificar.
                </div>
              )}

              {!clasificadosBloqueados && hayPronosticosGuardados && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  Clasificados guardados. Puedes actualizarlos mientras estén abiertos.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-4 text-center shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Progreso
              </p>
              <p className="mt-1 text-4xl font-black text-blue-300">
                {progreso.gruposCompletos}/{grupos.length}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-400">
                grupos completos
              </p>
              <div className="mt-3 h-2 w-44 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-300 transition-all"
                  style={{ width: `${progreso.porcentaje}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <InfoCard
            icono={<Medal className="h-5 w-5" />}
            titulo="2 puntos"
            texto="por cada selección clasificada acertada."
          />
          <InfoCard
            icono={<Users className="h-5 w-5" />}
            titulo="+1 punto"
            texto="si aciertas las dos selecciones del grupo."
          />
          <InfoCard
            icono={<Trophy className="h-5 w-5" />}
            titulo="+1 punto"
            texto="si además aciertas el orden exacto."
          />
        </section>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
            {mensaje}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          {grupos.map((grupo) => {
            const pronostico = pronosticos[grupo.grupo];

            return (
              <article
                key={grupo.grupo}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-300/10 p-3 text-blue-200">
                      <Flag className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Grupo
                      </p>
                      <h2 className="text-2xl font-black">{grupo.grupo}</h2>
                    </div>
                  </div>

                  {pronostico?.id && (
                    <div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
                      Guardado
                    </div>
                  )}
                </div>

                <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Selecciones del grupo
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {grupo.selecciones.map((seleccion) => (
                      <span
                        key={seleccion}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200"
                      >
                        {seleccion}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      1º clasificado
                    </label>

                    <select
                      value={pronostico?.clasificado_1 || ""}
                      onChange={(event) =>
                        actualizarPronostico(
                          grupo.grupo,
                          "clasificado_1",
                          event.target.value
                        )
                      }
                      disabled={clasificadosBloqueados}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Selecciona</option>
                      {grupo.selecciones.map((seleccion) => (
                        <option key={seleccion} value={seleccion}>
                          {seleccion}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      2º clasificado
                    </label>

                    <select
                      value={pronostico?.clasificado_2 || ""}
                      onChange={(event) =>
                        actualizarPronostico(
                          grupo.grupo,
                          "clasificado_2",
                          event.target.value
                        )
                      }
                      disabled={clasificadosBloqueados}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Selecciona</option>
                      {grupo.selecciones.map((seleccion) => (
                        <option key={seleccion} value={seleccion}>
                          {seleccion}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {pronostico?.clasificado_1 &&
                  pronostico?.clasificado_2 &&
                  pronostico.clasificado_1 === pronostico.clasificado_2 && (
                    <div className="mt-3 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
                      No puedes elegir la misma selección como primera y segunda.
                    </div>
                  )}
              </article>
            );
          })}

          {grupos.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-300 md:col-span-2">
              No hay grupos cargados todavía.
            </div>
          )}

          <section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl md:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-200">
                  <ShieldCheck className="h-5 w-5" />
                  <h2 className="text-lg font-black">
                    {clasificadosBloqueados
                      ? "Clasificados cerrados"
                      : hayPronosticosGuardados
                      ? "Actualizar clasificados"
                      : "Guardar clasificados"}
                  </h2>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {clasificadosBloqueados
                    ? "Los clasificados de grupo quedaron bloqueados al comenzar el Mundial. Puedes consultar tus elecciones, pero ya no es posible modificarlas."
                    : hayPronosticosGuardados
                    ? "Tus clasificados ya están guardados. Puedes modificarlos mientras estén abiertos."
                    : "Guarda tus clasificados antes del inicio del Mundial."}
                </p>
              </div>

              {clasificadosBloqueados ? (
                <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-700/80 px-5 py-3 text-sm font-black text-slate-300 shadow-lg shadow-slate-950/30">
                  <Lock className="h-4 w-4" />
                  Cerrado
                </div>
              ) : (
                <button
                  type="button"
                  onClick={guardarGrupos}
                  disabled={guardando || grupos.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-blue-950/30 transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {hayPronosticosGuardados ? "Actualizando" : "Guardando"}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {hayPronosticosGuardados
                        ? "Actualizar clasificados"
                        : "Guardar clasificados"}
                    </>
                  )}
                </button>
              )}
            </div>
          </section>
        </section>

        {clasificadosBloqueados && (
          <section className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  <Eye className="h-3.5 w-3.5" />
                  Clasificados de la liga
                </div>
                <h2 className="text-2xl font-black sm:text-3xl">
                  Tendencias y pronósticos de rivales
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Como los clasificados ya están cerrados, puedes ver qué ha elegido tu liga.
                </p>
              </div>

              {ligasUsuario.length > 1 && (
                <select
                  value={ligaSeleccionadaId ?? ""}
                  onChange={(event) => setLigaSeleccionadaId(Number(event.target.value))}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-black text-white outline-none"
                >
                  {ligasUsuario.map((liga) => (
                    <option key={liga.id} value={liga.id}>
                      {liga.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Liga seleccionada
              </p>
              <p className="mt-1 text-xl font-black text-white">
                {ligaSeleccionada?.nombre ?? "Sin liga seleccionada"}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                {cargandoLiga
                  ? "Cargando datos de la liga..."
                  : `${pronosticosUsuariosLiga.length} usuarios con clasificados guardados de ${participantesLigaIds.length} participantes de la liga.`}
              </p>
            </div>

            {errorLiga && (
              <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
                {errorLiga}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {grupos.map((grupo) => (
                <TendenciaGrupoCard
                  key={grupo.grupo}
                  grupo={grupo.grupo}
                  items={calcularTendenciasGrupo(grupo.grupo, pronosticosLiga)}
                />
              ))}
            </div>

            <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="mb-4 flex items-center gap-2 text-blue-200">
                <Users className="h-5 w-5" />
                <h3 className="text-xl font-black">Pronósticos de la liga</h3>
              </div>

              {pronosticosUsuariosLiga.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-sm font-bold text-slate-300">
                  No hay clasificados guardados todavía en esta liga.
                </div>
              ) : (
                <div className="grid gap-3">
                  {pronosticosUsuariosLiga.map((usuario) => (
                    <article
                      key={usuario.participante_id}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-400 text-sm font-black text-slate-950">
                            {usuario.nombre.charAt(0).toUpperCase()}
                          </div>
                          <h4 className="truncate text-lg font-black">
                            {usuario.nombre}
                          </h4>
                        </div>

                        <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
                          {usuario.puntos_total} pts
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {grupos.map((grupo) => {
                          const pronostico = usuario.pronosticos[grupo.grupo];

                          return (
                            <div
                              key={`${usuario.participante_id}-${grupo.grupo}`}
                              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                            >
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                Grupo {grupo.grupo}
                              </p>
                              <p className="mt-1 text-sm font-black text-slate-100">
                                {pronostico?.clasificado_1 || "Sin elegir"}
                              </p>
                              <p className="text-sm font-black text-slate-300">
                                {pronostico?.clasificado_2 || "Sin elegir"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        )}
      </div>
    </main>
  );
}

function TendenciaGrupoCard({
  grupo,
  items,
}: {
  grupo: string;
  items: TendenciaClasificado[];
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center gap-2 text-blue-200">
        <BarChart3 className="h-5 w-5" />
        <h3 className="text-lg font-black">Grupo {grupo}</h3>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-400">
          Sin datos suficientes.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${grupo}-${item.seleccion}`}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm font-bold text-slate-200">
                <span className="truncate">{item.seleccion}</span>
                <strong className="shrink-0 text-blue-100">
                  {item.cantidad} · {item.porcentaje}%
                </strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-400"
                  style={{ width: `${item.porcentaje}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InfoCard({
  icono,
  titulo,
  texto,
}: {
  icono: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl">
      <div className="mb-3 inline-flex rounded-2xl bg-blue-300/10 p-3 text-blue-200">
        {icono}
      </div>
      <h3 className="text-lg font-black">{titulo}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-300">{texto}</p>
    </div>
  );
}
