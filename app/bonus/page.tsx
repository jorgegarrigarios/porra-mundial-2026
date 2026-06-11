"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Crown,
  Goal,
  GoalIcon,
  Loader2,
  Lock,
  Medal,
  Save,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import { obtenerParticipanteActual } from "@/lib/participante";
import { supabase } from "@/lib/supabase";

type JugadorOption = {
  id?: number;
  nombre_oficial: string;
  seleccion: string;
  posicion?: string | null;
};

type BonusRow = {
  id?: number;
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

type PartidoRow = {
  local: string | null;
  visitante: string | null;
  fase: string | null;
  grupo: string | null;
};

type CampoTexto = "bota_oro" | "mejor_jugador" | "mejor_portero";

type CampoSeleccion =
  | "campeon"
  | "finalista_1"
  | "finalista_2"
  | "seleccion_revelacion"
  | "seleccion_decepcion";

const SELECCIONES_REVELACION = [
  "Nueva Zelanda",
  "Haití",
  "Curazao",
  "Ghana",
  "Cabo Verde",
  "Bosnia y Herzegovina",
  "Jordania",
  "Iraq",
  "Sudáfrica",
  "Qatar",
];

const SELECCIONES_DECEPCION = [
  "México",
  "Canadá",
  "Estados Unidos",
  "Argentina",
  "Brasil",
  "Francia",
  "España",
  "Inglaterra",
  "Portugal",
  "Alemania",
  "Países Bajos",
  "Bélgica",
];

const MUNDIAL_START_AT = new Date("2026-06-11T21:00:00+02:00");

function estanBonusBloqueados() {
  return new Date() >= MUNDIAL_START_AT;
}

function textoFechaBloqueo() {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(MUNDIAL_START_AT);
}

const bonusInicial: BonusRow = {
  participante_id: 0,
  campeon: null,
  finalista_1: null,
  finalista_2: null,
  bota_oro: null,
  mejor_jugador: null,
  mejor_portero: null,
  seleccion_revelacion: null,
  seleccion_decepcion: null,
};

function limpiarValor(valor: string) {
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

function normalizarBusqueda(valor: string | null | undefined) {
  return (valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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

async function cargarJugadoresActivosPaginado() {
  const pageSize = 1000;
  let desde = 0;
  let todos: JugadorOption[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("jugadores")
      .select("id, nombre_oficial, seleccion, posicion")
      .eq("activo", true)
      .order("nombre_oficial")
      .range(desde, desde + pageSize - 1);

    if (error) {
      return {
        data: todos,
        error,
      };
    }

    const bloque = (data || []) as JugadorOption[];
    todos = [...todos, ...bloque];

    if (bloque.length < pageSize) {
      break;
    }

    desde += pageSize;
  }

  return {
    data: todos,
    error: null,
  };
}

export default function BonusPage() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [participanteId, setParticipanteId] = useState<number | null>(null);
  const [selecciones, setSelecciones] = useState<string[]>([]);
  const [seleccionesDecepcion, setSeleccionesDecepcion] = useState<string[]>([]);
  const [jugadores, setJugadores] = useState<JugadorOption[]>([]);
  const [bonus, setBonus] = useState<BonusRow>(bonusInicial);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bonusYaGuardados = Boolean(bonus.id);
  const bonusBloqueados = estanBonusBloqueados();

  const seleccionesRevelacion = useMemo(() => {
    return SELECCIONES_REVELACION.filter((seleccion) =>
      selecciones.includes(seleccion)
    );
  }, [selecciones]);

  const progreso = useMemo(() => {
    const campos = [
      bonus.campeon,
      bonus.finalista_1,
      bonus.finalista_2,
      bonus.bota_oro,
      bonus.mejor_jugador,
      bonus.mejor_portero,
      bonus.seleccion_revelacion,
      bonus.seleccion_decepcion,
    ];

    const completados = campos.filter(
      (campo) => campo && campo.trim().length > 0
    ).length;

    return {
      completados,
      total: campos.length,
      porcentaje: Math.round((completados / campos.length) * 100),
    };
  }, [bonus]);

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        setCargando(true);
        setError(null);
        setMensaje(null);

        const participante = await obtenerParticipanteActual();

        if (!activo) return;

        if (!participante) {
          setError("No se ha podido cargar tu usuario. Cierra sesión y vuelve a entrar.");
          return;
        }

        setParticipanteId(participante.id);

        const [{ data: partidosData, error: partidosError }, jugadoresResultado, { data: bonusData, error: bonusError }] =
          await Promise.all([
            supabase.from("partidos").select("local, visitante, fase, grupo"),
            cargarJugadoresActivosPaginado(),
            supabase
              .from("pronosticos_bonus")
              .select(
                "id, participante_id, campeon, finalista_1, finalista_2, bota_oro, mejor_jugador, mejor_portero, seleccion_revelacion, seleccion_decepcion"
              )
              .eq("participante_id", participante.id)
              .maybeSingle(),
          ]);

        if (!activo) return;

        if (partidosError) {
          throw new Error(partidosError.message);
        }

        if (jugadoresResultado.error) {
          throw new Error(jugadoresResultado.error.message);
        }

        if (bonusError) {
          throw new Error(bonusError.message);
        }

        const partidos = (partidosData || []) as PartidoRow[];

        const equipos = Array.from(
          new Set(
            partidos
              .flatMap((partido) => [
                normalizarEquipo(partido.local),
                normalizarEquipo(partido.visitante),
              ])
              .filter((equipo): equipo is string => Boolean(equipo))
          )
        ).sort((a, b) => a.localeCompare(b, "es"));

        setSelecciones(equipos);
        setSeleccionesDecepcion(
          SELECCIONES_DECEPCION.filter((seleccion) =>
            equipos.includes(seleccion)
          )
        );
        setJugadores(jugadoresResultado.data);

        if (bonusData) {
          setBonus(bonusData as BonusRow);
        } else {
          setBonus({
            ...bonusInicial,
            participante_id: participante.id,
          });
        }
      } catch (err) {
        console.error("Error cargando bonus:", err);
        if (activo) {
          setError("No se han podido cargar los bonus. Prueba de nuevo en unos segundos.");
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
  }, []);

  function actualizarSeleccion(campo: CampoSeleccion, valor: string) {
    setMensaje(null);
    setError(null);

    if (bonusBloqueados) {
      setError("Los bonus ya están bloqueados porque el Mundial ha comenzado.");
      return;
    }

    setBonus((actual) => ({
      ...actual,
      [campo]: limpiarValor(valor),
    }));
  }

  function actualizarTexto(campo: CampoTexto, valor: string) {
    setMensaje(null);
    setError(null);

    if (bonusBloqueados) {
      setError("Los bonus ya están bloqueados porque el Mundial ha comenzado.");
      return;
    }

    setBonus((actual) => ({
      ...actual,
      [campo]: limpiarValor(valor),
    }));
  }

  function jugadorExisteEnCatalogo(valor: string | null) {
    const nombre = normalizarBusqueda(valor);

    if (!nombre) return true;

    return jugadores.some(
      (jugador) => normalizarBusqueda(jugador.nombre_oficial) === nombre
    );
  }

  function validarJugadoresBonus() {
    const errores: string[] = [];

    if (!jugadorExisteEnCatalogo(bonus.bota_oro)) {
      errores.push("Bota de Oro");
    }

    if (!jugadorExisteEnCatalogo(bonus.mejor_jugador)) {
      errores.push("Mejor jugador");
    }

    if (!jugadorExisteEnCatalogo(bonus.mejor_portero)) {
      errores.push("Mejor portero");
    }

    return errores;
  }

  async function guardarBonus() {
    if (!participanteId) {
      setError("No se ha podido identificar tu usuario.");
      return;
    }

    if (bonusBloqueados) {
      setMensaje(null);
      setError("Los bonus ya están bloqueados desde el inicio del Mundial. No se pueden modificar.");
      return;
    }

    const erroresJugadores = validarJugadoresBonus();

    if (erroresJugadores.length > 0) {
      setMensaje(null);
      setError(
        `Revisa estos campos: ${erroresJugadores.join(
          ", "
        )}. Debes elegir un jugador del listado oficial.`
      );
      return;
    }

    try {
      setGuardando(true);
      setMensaje(null);
      setError(null);

      const payload = {
        participante_id: participanteId,
        campeon: bonus.campeon,
        finalista_1: bonus.finalista_1,
        finalista_2: bonus.finalista_2,
        bota_oro: bonus.bota_oro,
        mejor_jugador: bonus.mejor_jugador,
        mejor_portero: bonus.mejor_portero,
        seleccion_revelacion: bonus.seleccion_revelacion,
        seleccion_decepcion: bonus.seleccion_decepcion,
      };

      const { data, error: guardarError } = await supabase
        .from("pronosticos_bonus")
        .upsert(payload, {
          onConflict: "participante_id",
        })
        .select(
          "id, participante_id, campeon, finalista_1, finalista_2, bota_oro, mejor_jugador, mejor_portero, seleccion_revelacion, seleccion_decepcion"
        )
        .single();

      if (guardarError) {
        throw new Error(guardarError.message);
      }

      setBonus(data as BonusRow);
      setMensaje(
        bonusYaGuardados
          ? "Bonus actualizados correctamente."
          : "Bonus guardados correctamente."
      );
    } catch (err) {
      console.error("Error guardando bonus:", err);
      setError("No se han podido guardar los bonus. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 pb-32 pt-6 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center shadow-2xl">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-emerald-300" />
          <h1 className="text-2xl font-black">Cargando bonus</h1>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            Estamos preparando tus pronósticos especiales del Mundial.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-32 pt-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950 p-5 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Bonus V1.2
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                Tus bonus del Mundial
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Elige tus predicciones especiales antes de que empiece el Mundial.
                Estos puntos pueden decidir la liga en las últimas jornadas.
              </p>

              {bonusBloqueados && (
                <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
                  Bonus bloqueados desde {textoFechaBloqueo()}. Ya no se pueden modificar.
                </div>
              )}

              {!bonusBloqueados && bonusYaGuardados && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  Bonus guardados. Puedes actualizarlos mientras estén abiertos.
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/25 p-4 text-center shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Progreso
              </p>
              <p className="mt-1 text-4xl font-black text-emerald-300">
                {progreso.completados}/{progreso.total}
              </p>
              <div className="mt-3 h-2 w-44 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-300 transition-all"
                  style={{ width: `${progreso.porcentaje}%` }}
                />
              </div>
            </div>
          </div>
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
          <BonusSelect
            icono={<Crown className="h-5 w-5" />}
            titulo="Campeón"
            descripcion="20 puntos si aciertas el campeón. 8 si queda subcampeón. 4 si llega a semifinales."
            value={bonus.campeon || ""}
            opciones={selecciones}
            onChange={(valor) => actualizarSeleccion("campeon", valor)}
            disabled={bonusBloqueados}
          />

          <BonusDobleFinalista
            opciones={selecciones}
            finalista1={bonus.finalista_1 || ""}
            finalista2={bonus.finalista_2 || ""}
            onFinalista1={(valor) => actualizarSeleccion("finalista_1", valor)}
            onFinalista2={(valor) => actualizarSeleccion("finalista_2", valor)}
            disabled={bonusBloqueados}
          />

          <BonusAutocomplete
            jugadores={jugadores}
            icono={<Goal className="h-5 w-5" />}
            titulo="Bota de Oro"
            descripcion="14 puntos si aciertas el máximo goleador. 5 puntos si queda top 3."
            placeholder="Ejemplo: Mbappé"
            value={bonus.bota_oro || ""}
            onChange={(valor) => actualizarTexto("bota_oro", valor)}
            disabled={bonusBloqueados}
          />

          <BonusAutocomplete
            jugadores={jugadores}
            icono={<Star className="h-5 w-5" />}
            titulo="Mejor jugador"
            descripcion="10 puntos si aciertas el mejor jugador del Mundial."
            placeholder="Ejemplo: Vinícius Jr."
            value={bonus.mejor_jugador || ""}
            onChange={(valor) => actualizarTexto("mejor_jugador", valor)}
            disabled={bonusBloqueados}
          />

          <BonusAutocomplete
            jugadores={jugadores}
            soloPorteros
            icono={<Shield className="h-5 w-5" />}
            titulo="Mejor portero"
            descripcion="8 puntos si aciertas el mejor portero del Mundial."
            placeholder="Ejemplo: Unai Simon"
            value={bonus.mejor_portero || ""}
            onChange={(valor) => actualizarTexto("mejor_portero", valor)}
            disabled={bonusBloqueados}
          />

          <BonusSelect
            icono={<Medal className="h-5 w-5" />}
            titulo="Selección revelación"
            descripcion="Solo puedes elegir entre las 10 peor clasificadas del Mundial según Ranking FIFA de abril 2026."
            value={bonus.seleccion_revelacion || ""}
            opciones={seleccionesRevelacion}
            onChange={(valor) => actualizarSeleccion("seleccion_revelacion", valor)}
            disabled={bonusBloqueados}
          />

          <BonusSelect
            icono={<GoalIcon className="h-5 w-5" />}
            titulo="Selección decepción"
            descripcion="Solo puedes elegir entre las cabezas de serie de cada grupo."
            value={bonus.seleccion_decepcion || ""}
            opciones={seleccionesDecepcion}
            onChange={(valor) => actualizarSeleccion("seleccion_decepcion", valor)}
            disabled={bonusBloqueados}
          />

          <section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl md:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-200">
                  <Trophy className="h-5 w-5" />
                  <h2 className="text-lg font-black">
                    {bonusBloqueados
                      ? "Pronósticos bonus cerrados"
                      : bonusYaGuardados
                      ? "Actualizar pronósticos bonus"
                      : "Guardar pronósticos bonus"}
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {bonusBloqueados
                    ? "Los bonus quedaron bloqueados al comenzar el Mundial. Puedes consultar tus elecciones, pero ya no es posible modificarlas."
                    : bonusYaGuardados
                    ? "Tus bonus ya están guardados. Puedes modificarlos y volver a actualizarlos mientras estén abiertos."
                    : "Podrás modificarlos hasta el bloqueo oficial antes del primer partido del Mundial."}
                </p>
              </div>

              {bonusBloqueados ? (
                <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-700/80 px-5 py-3 text-sm font-black text-slate-300 shadow-lg shadow-slate-950/30">
                  <Lock className="h-4 w-4" />
                  Cerrado
                </div>
              ) : (
                <button
                  type="button"
                  onClick={guardarBonus}
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {bonusYaGuardados ? "Actualizando" : "Guardando"}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {bonusYaGuardados ? "Actualizar bonus" : "Guardar bonus"}
                    </>
                  )}
                </button>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function BonusSelect({
  icono,
  titulo,
  descripcion,
  value,
  opciones,
  onChange,
  disabled = false,
}: {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  value: string;
  opciones: string[];
  onChange: (valor: string) => void;
  disabled?: boolean;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-emerald-300/10 p-3 text-emerald-200">
          {icono}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black">{titulo}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">{descripcion}</p>

          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Selecciona una selección</option>
            {opciones.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

function BonusAutocomplete({
  jugadores,
  soloPorteros = false,
  icono,
  titulo,
  descripcion,
  placeholder,
  value,
  onChange,
  disabled = false,
}: {
  jugadores: JugadorOption[];
  soloPorteros?: boolean;
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  placeholder: string;
  value: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
}) {
  const [busqueda, setBusqueda] = useState(value);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    setBusqueda(value);
  }, [value]);

  const jugadoresFiltrados = useMemo(() => {
    const texto = normalizarBusqueda(busqueda);

    const base = soloPorteros
      ? jugadores.filter((jugador) => {
          const posicion = normalizarBusqueda(jugador.posicion);
          return (
            posicion.includes("goalkeeper") ||
            posicion.includes("portero") ||
            posicion.includes("arquero")
          );
        })
      : jugadores;

    if (!texto) {
      return base.slice(0, 30);
    }

    return base
      .filter((jugador) => {
        const nombre = normalizarBusqueda(jugador.nombre_oficial);
        const seleccion = normalizarBusqueda(jugador.seleccion);
        const combinado = `${nombre} ${seleccion}`;

        return (
          nombre.includes(texto) ||
          seleccion.includes(texto) ||
          combinado.includes(texto)
        );
      })
      .slice(0, 30);
  }, [busqueda, jugadores, soloPorteros]);

  function seleccionarJugador(jugador: JugadorOption) {
    setBusqueda(jugador.nombre_oficial);
    onChange(jugador.nombre_oficial);
    setAbierto(false);
  }

  function actualizarBusqueda(valor: string) {
    setBusqueda(valor);
    setAbierto(true);

    const exacto = jugadores.find(
      (jugador) =>
        normalizarBusqueda(jugador.nombre_oficial) === normalizarBusqueda(valor)
    );

    onChange(exacto ? exacto.nombre_oficial : valor);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-emerald-300/10 p-3 text-emerald-200">
          {icono}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black">{titulo}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">{descripcion}</p>

          <div className="relative mt-4">
            <input
              value={busqueda}
              onChange={(event) => actualizarBusqueda(event.target.value)}
              disabled={disabled}
              onFocus={() => {
                if (!disabled) setAbierto(true);
              }}
              onBlur={() => {
                window.setTimeout(() => setAbierto(false), 150);
              }}
              placeholder={placeholder}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {abierto && !disabled && (
              <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-2xl">
                {jugadoresFiltrados.length === 0 ? (
                  <div className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-400">
                    No aparece en el catálogo. Prueba sin tildes o avisa al administrador.
                  </div>
                ) : (
                  jugadoresFiltrados.map((jugador) => (
                    <button
                      key={`${jugador.nombre_oficial}-${jugador.seleccion}`}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => seleccionarJugador(jugador)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/10"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-white">
                          {jugador.nombre_oficial}
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-bold text-slate-400">
                          {jugador.seleccion}
                          {jugador.posicion ? ` · ${jugador.posicion}` : ""}
                        </span>
                      </span>

                      <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-200">
                        Elegir
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <p className="mt-2 text-xs font-semibold text-slate-400">
            Busca sin preocuparte por tildes. Se guardará el nombre oficial del catálogo.
          </p>
        </div>
      </div>
    </section>
  );
}

function BonusDobleFinalista({
  opciones,
  finalista1,
  finalista2,
  onFinalista1,
  onFinalista2,
  disabled = false,
}: {
  opciones: string[];
  finalista1: string;
  finalista2: string;
  onFinalista1: (valor: string) => void;
  onFinalista2: (valor: string) => void;
  disabled?: boolean;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-emerald-300/10 p-3 text-emerald-200">
          <Users className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black">Finalistas</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            7 puntos por cada finalista acertado. +4 puntos si aciertas ambos.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              value={finalista1}
              onChange={(event) => onFinalista1(event.target.value)}
              disabled={disabled}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Finalista 1</option>
              {opciones.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>

            <select
              value={finalista2}
              onChange={(event) => onFinalista2(event.target.value)}
              disabled={disabled}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Finalista 2</option>
              {opciones.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}