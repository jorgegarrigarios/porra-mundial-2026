"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  AlertTriangle,
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  Flag,
  Loader2,
  Lock,
  MapPin,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import PhaseBadge from "@/components/PhaseBadge";
import TeamFlag from "@/components/TeamFlag";
import { supabase } from "@/lib/supabase";
import { obtenerParticipanteActual } from "@/lib/participante";

type Partido = {
  id: number;
  local: string;
  visitante: string;
  local_code: string | null;
  visitante_code: string | null;
  fecha_inicio: string | null;
  estadio: string | null;
  ciudad: string | null;
  grupo: string | null;
  fase: string | null;
  resultado_local: number | null;
  resultado_visitante: number | null;
};

type Pronostico = {
  id: number;
  partido_id: number;
  goles_local: number | null;
  goles_visitante: number | null;
  puntos: number | null;
  tipo_pronostico: string | null;
  signo_grupo: string | null;
  clasificado_pronosticado: string | null;
};

type BonusResumen = {
  id: number;
  campeon: string | null;
  finalista_1: string | null;
  finalista_2: string | null;
  bota_oro: string | null;
  mejor_jugador: string | null;
  mejor_portero: string | null;
  seleccion_revelacion: string | null;
  seleccion_decepcion: string | null;
};

type PronosticoGrupoResumen = {
  id: number;
  grupo: string;
  clasificado_1: string | null;
  clasificado_2: string | null;
};

type Participante = {
  id: number;
  nombre: string | null;
  apellidos?: string | null;
  nickname?: string | null;
  email?: string | null;
  role?: string | null;
};

type Filtro = "Todos" | "Pendientes" | "Guardados" | "Abiertos" | "Cerrados";

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

const filtros: Filtro[] = [
  "Todos",
  "Pendientes",
  "Guardados",
  "Abiertos",
  "Cerrados",
];

const TOTAL_BONUS = 8;

function queryTimeout<T>(ms = 10000): Promise<QueryResult<T>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: null,
        error: {
          message:
            "La consulta está tardando demasiado. Revisa conexión o Supabase.",
        },
      });
    }, ms);
  });
}

function esFaseGrupos(fase: string | null) {
  return fase?.trim().toLowerCase() === "fase de grupos";
}

function esPlaceholderEquipo(equipo: string | null) {
  const limpio = equipo?.trim();

  if (!limpio) return true;

  const valor = limpio.toLowerCase();

  return (
    /^[12][a-l]$/i.test(limpio) ||
    /^3[a-l](\/[a-l])+$/i.test(limpio) ||
    valor.startsWith("ganador ") ||
    valor.startsWith("perdedor ")
  );
}

function partidoTieneEquiposPendientes(partido: Partido) {
  if (esFaseGrupos(partido.fase)) return false;

  return esPlaceholderEquipo(partido.local) || esPlaceholderEquipo(partido.visitante);
}

function obtenerTextoSigno(signo: string | null) {
  if (signo === "1") return "Gana local";
  if (signo === "X") return "Empate";
  if (signo === "2") return "Gana visitante";
  return "";
}

export default function MisPronosticosPage() {
  const [participante, setParticipante] = useState<Participante | null>(null);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [pronosticos, setPronosticos] = useState<
    Record<
      number,
      {
        local: string;
        visitante: string;
        signoGrupo: string;
        clasificadoPronosticado: string;
      }
    >
  >({});
  const [pronosticosGuardados, setPronosticosGuardados] = useState<
    Record<number, Pronostico>
  >({});
  const [bonusResumen, setBonusResumen] = useState<BonusResumen | null>(null);
  const [pronosticosGrupos, setPronosticosGrupos] = useState<
    PronosticoGrupoResumen[]
  >([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState<Filtro>("Todos");
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    setErrorCarga(null);

    try {
      const participanteActual = await obtenerParticipanteActual();

      setParticipante(participanteActual);

      if (!participanteActual) {
        setPartidos([]);
        setPronosticos({});
        setPronosticosGuardados({});
        setBonusResumen(null);
        setPronosticosGrupos([]);
        return;
      }

      const partidosResponse = (await Promise.race([
        supabase
          .from("partidos")
          .select(
            "id, local, visitante, local_code, visitante_code, fecha_inicio, estadio, ciudad, grupo, fase, resultado_local, resultado_visitante"
          )
          .order("fecha_inicio", { ascending: true, nullsFirst: false }),
        queryTimeout<Partido[]>(),
      ])) as QueryResult<Partido[]>;

      if (partidosResponse.error) {
        console.error("Error cargando partidos:", partidosResponse.error.message);
        setErrorCarga(partidosResponse.error.message);
        setPartidos([]);
        return;
      }

      const [pronosticosResponse, bonusResponse, gruposResponse] = await Promise.all([
        Promise.race([
          supabase
            .from("pronosticos")
            .select("id, partido_id, goles_local, goles_visitante, puntos, tipo_pronostico, signo_grupo, clasificado_pronosticado")
            .eq("participante_id", participanteActual.id),
          queryTimeout<Pronostico[]>(),
        ]) as Promise<QueryResult<Pronostico[]>>,
        Promise.race([
          supabase
            .from("pronosticos_bonus")
            .select(
              "id, campeon, finalista_1, finalista_2, bota_oro, mejor_jugador, mejor_portero, seleccion_revelacion, seleccion_decepcion"
            )
            .eq("participante_id", participanteActual.id)
            .maybeSingle(),
          queryTimeout<BonusResumen | null>(),
        ]) as Promise<QueryResult<BonusResumen | null>>,
        Promise.race([
          supabase
            .from("pronosticos_grupos")
            .select("id, grupo, clasificado_1, clasificado_2")
            .eq("participante_id", participanteActual.id),
          queryTimeout<PronosticoGrupoResumen[]>(),
        ]) as Promise<QueryResult<PronosticoGrupoResumen[]>>,
      ]);

      if (pronosticosResponse.error) {
        console.error(
          "Error cargando pronósticos:",
          pronosticosResponse.error.message
        );
        setErrorCarga(pronosticosResponse.error.message);
        setPronosticos({});
        setPronosticosGuardados({});
        setPartidos(partidosResponse.data ?? []);
        return;
      }

      if (bonusResponse.error) {
        console.error("Error cargando bonus:", bonusResponse.error.message);
      }

      if (gruposResponse.error) {
        console.error(
          "Error cargando clasificados de grupo:",
          gruposResponse.error.message
        );
      }

      const iniciales: Record<
        number,
        {
          local: string;
          visitante: string;
          signoGrupo: string;
          clasificadoPronosticado: string;
        }
      > = {};
      const guardados: Record<number, Pronostico> = {};

      (pronosticosResponse.data ?? []).forEach((pronostico) => {
        iniciales[pronostico.partido_id] = {
          local:
            pronostico.goles_local !== null
              ? pronostico.goles_local.toString()
              : "",
          visitante:
            pronostico.goles_visitante !== null
              ? pronostico.goles_visitante.toString()
              : "",
          signoGrupo: pronostico.signo_grupo ?? "",
          clasificadoPronosticado: pronostico.clasificado_pronosticado ?? "",
        };

        guardados[pronostico.partido_id] = pronostico;
      });

      setPartidos(partidosResponse.data ?? []);
      setPronosticos(iniciales);
      setPronosticosGuardados(guardados);
      setBonusResumen(bonusResponse.data ?? null);
      setPronosticosGrupos(gruposResponse.data ?? []);
    } catch (error) {
      console.error("Error inesperado cargando Mis Pronósticos:", error);
      setErrorCarga("No se pudieron cargar los pronósticos.");
      setPartidos([]);
      setPronosticos({});
      setPronosticosGuardados({});
      setBonusResumen(null);
      setPronosticosGrupos([]);
    } finally {
      setCargando(false);
    }
  }

  function partidoBloqueado(partido: Partido) {
    if (!partido.fecha_inicio) return false;

    const fecha = new Date(partido.fecha_inicio);
    if (Number.isNaN(fecha.getTime())) return false;

    return fecha <= new Date();
  }

  function partidoFinalizado(partido: Partido) {
    return (
      partido.resultado_local !== null && partido.resultado_visitante !== null
    );
  }

  function formatearFecha(fechaInicio: string | null) {
    if (!fechaInicio) return "Fecha pendiente";

    const fecha = new Date(fechaInicio);
    if (Number.isNaN(fecha.getTime())) return "Fecha pendiente";

    return fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Madrid",
    });
  }

  function formatearHora(fechaInicio: string | null) {
    if (!fechaInicio) return "--:--";

    const fecha = new Date(fechaInicio);
    if (Number.isNaN(fecha.getTime())) return "--:--";

    return fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Madrid",
    });
  }

  function normalizarTexto(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function obtenerClaseFase(fase: string | null) {
    switch (fase) {
      case "Final":
        return "finalCard";

      case "Tercer puesto":
        return "tercerPuestoCard";

      case "Semifinales":
        return "semiCard";

      case "Cuartos":
        return "cuartosCard";

      case "Octavos":
        return "octavosCard";

      case "Dieciseisavos":
        return "dieciseisavosCard";

      default:
        return "";
    }
  }

  const partidosFiltrados = useMemo(() => {
    const textoBusqueda = normalizarTexto(busqueda.trim());

    return partidos.filter((partido) => {
      const equiposPendientes = partidoTieneEquiposPendientes(partido);
      const bloqueado = partidoBloqueado(partido);
      const pronosticable = !equiposPendientes;
      const guardado = Boolean(pronosticosGuardados[partido.id]);

      const coincideBusqueda =
        textoBusqueda === "" ||
        normalizarTexto(partido.local).includes(textoBusqueda) ||
        normalizarTexto(partido.visitante).includes(textoBusqueda) ||
        normalizarTexto(partido.estadio ?? "").includes(textoBusqueda) ||
        normalizarTexto(partido.ciudad ?? "").includes(textoBusqueda) ||
        normalizarTexto(partido.fase ?? "").includes(textoBusqueda) ||
        normalizarTexto(partido.grupo ?? "").includes(textoBusqueda);

      if (!coincideBusqueda) return false;

      if (filtroActivo === "Todos") return true;
      if (filtroActivo === "Pendientes") return pronosticable && !guardado;
      if (filtroActivo === "Guardados") return guardado;
      if (filtroActivo === "Abiertos") return pronosticable && !bloqueado;
      if (filtroActivo === "Cerrados") return bloqueado || equiposPendientes;

      return true;
    });
  }, [partidos, pronosticosGuardados, busqueda, filtroActivo]);

  const gruposMundial = useMemo(() => {
    return Array.from(
      new Set(
        partidos
          .filter((partido) => esFaseGrupos(partido.fase))
          .map((partido) => partido.grupo?.trim())
          .filter((grupo): grupo is string => Boolean(grupo))
      )
    ).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  }, [partidos]);

  const partidosPronosticables = useMemo(() => {
    return partidos.filter((partido) => !partidoTieneEquiposPendientes(partido));
  }, [partidos]);

  const totalGuardados = partidosPronosticables.filter((partido) =>
    Boolean(pronosticosGuardados[partido.id])
  ).length;
  const totalPendientes = Math.max(partidosPronosticables.length - totalGuardados, 0);
  const totalAbiertos = partidosPronosticables.filter(
    (partido) => !partidoBloqueado(partido)
  ).length;

  const bonusCompletados = useMemo(() => {
    if (!bonusResumen) return 0;

    return [
      bonusResumen.campeon,
      bonusResumen.finalista_1,
      bonusResumen.finalista_2,
      bonusResumen.bota_oro,
      bonusResumen.mejor_jugador,
      bonusResumen.mejor_portero,
      bonusResumen.seleccion_revelacion,
      bonusResumen.seleccion_decepcion,
    ].filter((valor) => valor && valor.trim().length > 0).length;
  }, [bonusResumen]);

  const gruposCompletos = useMemo(() => {
    return pronosticosGrupos.filter(
      (grupo) => grupo.clasificado_1 && grupo.clasificado_2
    ).length;
  }, [pronosticosGrupos]);

  const bonusPendientes = TOTAL_BONUS - bonusCompletados;
  const gruposPendientes = Math.max(gruposMundial.length - gruposCompletos, 0);
  const tareasPendientes =
    totalPendientes + bonusPendientes + gruposPendientes;
  const totalTareas = partidosPronosticables.length + TOTAL_BONUS + gruposMundial.length;
  const tareasCompletadas =
    totalGuardados + bonusCompletados + gruposCompletos;
  const progresoTotal =
    totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

  function actualizarMarcador(
    partidoId: number,
    campo: "local" | "visitante",
    valor: string
  ) {
    if (valor !== "" && !/^\d+$/.test(valor)) return;

    setPronosticos((prev) => ({
      ...prev,
      [partidoId]: {
        local: prev[partidoId]?.local ?? "",
        visitante: prev[partidoId]?.visitante ?? "",
        signoGrupo: prev[partidoId]?.signoGrupo ?? "",
        clasificadoPronosticado: prev[partidoId]?.clasificadoPronosticado ?? "",
        [campo]: valor,
      },
    }));
  }

  function actualizarSignoGrupo(partidoId: number, signo: "1" | "X" | "2") {
    setPronosticos((prev) => ({
      ...prev,
      [partidoId]: {
        local: "",
        visitante: "",
        signoGrupo: signo,
        clasificadoPronosticado: "",
      },
    }));
  }

  function actualizarClasificadoPronosticado(partidoId: number, seleccion: string) {
    setPronosticos((prev) => ({
      ...prev,
      [partidoId]: {
        local: prev[partidoId]?.local ?? "",
        visitante: prev[partidoId]?.visitante ?? "",
        signoGrupo: prev[partidoId]?.signoGrupo ?? "",
        clasificadoPronosticado: seleccion,
      },
    }));
  }

  function actualizarPronosticoGuardadoLocal(
    partidoId: number,
    pronosticoGuardado: Pronostico
  ) {
    setPronosticosGuardados((prev) => ({
      ...prev,
      [partidoId]: pronosticoGuardado,
    }));

    setPronosticos((prev) => ({
      ...prev,
      [partidoId]: {
        local:
          pronosticoGuardado.goles_local !== null
            ? pronosticoGuardado.goles_local.toString()
            : "",
        visitante:
          pronosticoGuardado.goles_visitante !== null
            ? pronosticoGuardado.goles_visitante.toString()
            : "",
        signoGrupo: pronosticoGuardado.signo_grupo ?? "",
        clasificadoPronosticado:
          pronosticoGuardado.clasificado_pronosticado ?? "",
      },
    }));
  }

  async function guardarPayloadPronostico(
    partidoId: number,
    existente: Pronostico | undefined,
    payload: {
      participante_id: number;
      partido_id: number;
      goles_local: number | null;
      goles_visitante: number | null;
      tipo_pronostico: string;
      signo_grupo: string | null;
      clasificado_pronosticado: string | null;
      puntos: number;
    }
  ) {
    if (existente) {
      const { data, error } = await supabase
        .from("pronosticos")
        .update(payload)
        .eq("id", existente.id)
        .select(
          "id, partido_id, goles_local, goles_visitante, puntos, tipo_pronostico, signo_grupo, clasificado_pronosticado"
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Pronostico;
    }

    const { data, error } = await supabase
      .from("pronosticos")
      .insert(payload)
      .select(
        "id, partido_id, goles_local, goles_visitante, puntos, tipo_pronostico, signo_grupo, clasificado_pronosticado"
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Pronostico;
  }

  async function guardarPronostico(partido: Partido) {
    if (!participante) return;

    setMensajeGuardado(null);

    if (partidoTieneEquiposPendientes(partido)) {
      alert("Este partido estará disponible cuando se conozcan los clasificados.");
      return;
    }

    if (partidoBloqueado(partido)) {
      alert("Este partido ya ha comenzado. El pronóstico está cerrado.");
      return;
    }

    const esGrupo = esFaseGrupos(partido.fase);
    const pronosticoActual = pronosticos[partido.id];

    setGuardandoId(partido.id);

    try {
      const existente = pronosticosGuardados[partido.id];

      if (esGrupo) {
        const signoGrupo = pronosticoActual?.signoGrupo;

        if (!signoGrupo || !["1", "X", "2"].includes(signoGrupo)) {
          alert("Elige 1, X o 2 para este partido.");
          return;
        }

        const payload = {
          participante_id: participante.id,
          partido_id: partido.id,
          goles_local: null,
          goles_visitante: null,
          tipo_pronostico: "1X2",
          signo_grupo: signoGrupo,
          clasificado_pronosticado: null,
          puntos: existente?.puntos ?? 0,
        };

        const pronosticoGuardado = await guardarPayloadPronostico(
          partido.id,
          existente,
          payload
        );

        actualizarPronosticoGuardadoLocal(partido.id, pronosticoGuardado);
        setMensajeGuardado(`${partido.local} - ${partido.visitante} guardado correctamente.`);
        return;
      }

      const local = pronosticoActual?.local;
      const visitante = pronosticoActual?.visitante;

      if (
        local === undefined ||
        local === "" ||
        visitante === undefined ||
        visitante === ""
      ) {
        alert("Introduce un marcador completo.");
        return;
      }

      const golesLocal = Number(local);
      const golesVisitante = Number(visitante);

      if (
        Number.isNaN(golesLocal) ||
        Number.isNaN(golesVisitante) ||
        golesLocal < 0 ||
        golesVisitante < 0 ||
        !Number.isInteger(golesLocal) ||
        !Number.isInteger(golesVisitante)
      ) {
        alert("Introduce goles válidos.");
        return;
      }

      const hayEmpate = golesLocal === golesVisitante;
      const clasificadoPronosticado =
        pronosticoActual?.clasificadoPronosticado?.trim() || null;

      if (hayEmpate && !clasificadoPronosticado) {
        alert("Si pronosticas empate en eliminatorias, elige qué selección pasa.");
        return;
      }

      const payload = {
        participante_id: participante.id,
        partido_id: partido.id,
        goles_local: golesLocal,
        goles_visitante: golesVisitante,
        tipo_pronostico: "MARCADOR",
        signo_grupo: null,
        clasificado_pronosticado: hayEmpate ? clasificadoPronosticado : null,
        puntos: existente?.puntos ?? 0,
      };

      const pronosticoGuardado = await guardarPayloadPronostico(
        partido.id,
        existente,
        payload
      );

      actualizarPronosticoGuardadoLocal(partido.id, pronosticoGuardado);
      setMensajeGuardado(`${partido.local} - ${partido.visitante} guardado correctamente.`);
    } catch (error) {
      console.error("Error guardando pronóstico:", error);
      alert("No se pudo guardar el pronóstico. Inténtalo de nuevo.");
    } finally {
      setGuardandoId(null);
    }
  }

  if (cargando) {
    return (
      <main className="misPronosticosPage">
        <div className="container">
          <div className="emptyBox">Cargando pronósticos...</div>
        </div>

        <Styles />
      </main>
    );
  }

  if (!participante) {
    return (
      <main className="misPronosticosPage">
        <div className="container">
          <div className="emptyBox">
            <h1>Inicia sesión</h1>
            <p>Necesitas estar identificado para guardar tus pronósticos.</p>

            <a href="/login" className="loginButton">
              Ir al login
            </a>
          </div>
        </div>

        <Styles />
      </main>
    );
  }

  return (
    <main className="misPronosticosPage">
      <div className="container">
        <div className="header">
          <div className="headerIcon">
            <Trophy size={28} />
          </div>

          <div>
            <h1>Mis pronósticos</h1>
            <p>Guarda o modifica tus predicciones antes de que empiece cada partido</p>
          </div>
        </div>

        {errorCarga && (
          <div className="errorBox">
            <AlertTriangle size={18} />
            <span>{errorCarga}</span>
          </div>
        )}

        {mensajeGuardado && (
          <div className="successBox">
            <CheckCircle2 size={18} />
            <span>{mensajeGuardado}</span>
          </div>
        )}

        <section className="controlCenter">
          <div className="controlHeader">
            <div>
              <div className="controlEyebrow">
                <Sparkles size={15} />
                Centro de control
              </div>

              <h2>Tu porra está al {progresoTotal}%</h2>
              <p>
                {tareasPendientes === 0
                  ? "Lo tienes todo completado. Puedes revisar o actualizar tus pronósticos mientras estén abiertos."
                  : "Completa tus pendientes antes de que se cierren los partidos y bonus del Mundial."}
              </p>
            </div>

            <div className="progressCircle">
              <strong>{progresoTotal}%</strong>
              <span>completo</span>
            </div>
          </div>

          <div className="progressBar">
            <div style={{ width: `${progresoTotal}%` }} />
          </div>

          {tareasPendientes > 0 ? (
            <div className="pendingAlert">
              <AlertTriangle size={18} />
              <span>
                Te quedan pendientes: {totalPendientes} partidos, {bonusPendientes} bonus y {gruposPendientes} grupos.
              </span>
            </div>
          ) : (
            <div className="completedAlert">
              <CheckCircle2 size={18} />
              <span>Todo completado. Tu porra está lista.</span>
            </div>
          )}

          <div className="taskGrid">
            <TaskCard
              icono={<Target size={22} />}
              titulo="Partidos"
              estado={totalPendientes === 0 ? "Completado" : "Pendiente"}
              detalle={`${totalGuardados}/${partidosPronosticables.length} pronósticos guardados`}
              aviso={
                totalPendientes === 0
                  ? "Todos los partidos tienen pronóstico."
                  : `Te faltan ${totalPendientes} partidos.`
              }
              href="#partidos"
              cta={totalPendientes === 0 ? "Revisar partidos" : "Continuar partidos"}
              completo={totalPendientes === 0}
            />

            <TaskCard
              icono={<Award size={22} />}
              titulo="Bonus del Mundial"
              estado={bonusPendientes === 0 ? "Completado" : "Pendiente"}
              detalle={`${bonusCompletados}/${TOTAL_BONUS} bonus completados`}
              aviso={
                bonusPendientes === 0
                  ? "Campeón, finalistas y premios especiales listos."
                  : `Te faltan ${bonusPendientes} bonus.`
              }
              href="/bonus"
              cta={bonusPendientes === 0 ? "Editar bonus" : "Completar bonus"}
              completo={bonusPendientes === 0}
            />

            <TaskCard
              icono={<Flag size={22} />}
              titulo="Clasificados de grupo"
              estado={gruposPendientes === 0 ? "Completado" : "Pendiente"}
              detalle={`${gruposCompletos}/${gruposMundial.length} grupos completados`}
              aviso={
                gruposPendientes === 0
                  ? "Todos los grupos tienen clasificados."
                  : `Te faltan ${gruposPendientes} grupos.`
              }
              href="/grupos"
              cta={gruposPendientes === 0 ? "Editar grupos" : "Completar grupos"}
              completo={gruposPendientes === 0}
            />
          </div>
        </section>

        <div className="summaryBox">
          <div>
            <p className="summaryLabel">Participante</p>
            <strong>{participante.nickname || participante.nombre || "Usuario"}</strong>
          </div>

          <div>
            <p className="summaryLabel">Guardados</p>
            <strong>
              {totalGuardados}/{partidosPronosticables.length}
            </strong>
          </div>

          <div>
            <p className="summaryLabel">Pendientes</p>
            <strong>{totalPendientes}</strong>
          </div>

          <div>
            <p className="summaryLabel">Abiertos</p>
            <strong>{totalAbiertos}</strong>
          </div>
        </div>

        <div id="partidos" className="filtersWrapper">
          <div className="searchBox">
            <Search size={18} />

            <input
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar selección, fase, estadio o ciudad..."
            />
          </div>

          <div className="filterButtons">
            {filtros.map((filtro) => (
              <button
                key={filtro}
                type="button"
                className={filtroActivo === filtro ? "filterActive" : ""}
                onClick={() => setFiltroActivo(filtro)}
              >
                <Filter size={15} />
                {filtro}
              </button>
            ))}
          </div>
        </div>

        <div className="resultsInfo">
          Mostrando {partidosFiltrados.length} de {partidos.length} partidos
        </div>

        <div className="cards">
          {partidosFiltrados.map((partido) => {
            const equiposPendientes = partidoTieneEquiposPendientes(partido);
            const bloqueadoPorFecha = partidoBloqueado(partido);
            const bloqueado = bloqueadoPorFecha || equiposPendientes;
            const guardado = pronosticosGuardados[partido.id];
            const finalizado = partidoFinalizado(partido);
            const guardando = guardandoId === partido.id;
            const claseFase = obtenerClaseFase(partido.fase);

            return (
              <article
                key={partido.id}
                className={`card ${bloqueado ? "blockedCard" : ""} ${claseFase}`}
              >
                <div className="topRow">
                  <div className="topLeft">
                    <PhaseBadge fase={partido.fase} />

                    {partido.grupo && (
                      <div className="grupoBadge">{partido.grupo}</div>
                    )}
                  </div>

                  {equiposPendientes ? (
                    <div className="status pendingTeams">
                      <Lock size={15} />
                      Pendiente
                    </div>
                  ) : bloqueadoPorFecha ? (
                    <div className="status closed">
                      <Lock size={15} />
                      Cerrado
                    </div>
                  ) : (
                    <div className="status open">
                      <Clock3 size={15} />
                      Abierto
                    </div>
                  )}
                </div>

                <div className="dateRow">
                  <div className="dateBadge">
                    <CalendarDays size={15} />
                    {formatearFecha(partido.fecha_inicio)}
                  </div>

                  <div className="hourBadge">
                    <Clock3 size={15} />
                    {formatearHora(partido.fecha_inicio)}
                  </div>
                </div>

                <div className="matchHeader">
                  <Team code={partido.local_code} name={partido.local} />

                  <div className="vsText">VS</div>

                  <Team
                    code={partido.visitante_code}
                    name={partido.visitante}
                  />
                </div>

                <div className="metaRow">
                  <span>
                    <MapPin size={14} />
                    {partido.estadio ?? "Estadio pendiente"}
                    {partido.ciudad ? ` · ${partido.ciudad}` : ""}
                  </span>
                </div>

                {finalizado && (
                  <div className="resultBox">
                    <span>Resultado final</span>
                    <strong>
                      {partido.local} {partido.resultado_local} -{" "}
                      {partido.resultado_visitante} {partido.visitante}
                    </strong>

                    {guardado && guardado.puntos !== null && (
                      <p>Tus puntos: {guardado.puntos}</p>
                    )}
                  </div>
                )}

                <div className="pronosticoBox">
                  <div className="pronosticoTitle">
                    <Target size={18} />
                    Tu pronóstico
                  </div>

                  {equiposPendientes ? (
                    <div className="pendingTeamsBox">
                      <Lock size={18} />
                      <div>
                        <strong>Disponible cuando se conozcan los clasificados</strong>
                        <p>
                          Este cruce todavía depende de la fase anterior. Cuando se sepan los equipos reales, podrás hacer tu pronóstico.
                        </p>
                      </div>
                    </div>
                  ) : esFaseGrupos(partido.fase) ? (
                    <div className="signoBox">
                      <p>Elige el resultado del partido:</p>

                      <div className="signoButtons">
                        <button
                          type="button"
                          disabled={bloqueado || guardando}
                          className={
                            pronosticos[partido.id]?.signoGrupo === "1"
                              ? "signoButton signoButtonActive"
                              : "signoButton"
                          }
                          onClick={() => actualizarSignoGrupo(partido.id, "1")}
                        >
                          <strong>1</strong>
                          <span>Gana {partido.local}</span>
                        </button>

                        <button
                          type="button"
                          disabled={bloqueado || guardando}
                          className={
                            pronosticos[partido.id]?.signoGrupo === "X"
                              ? "signoButton signoButtonActive"
                              : "signoButton"
                          }
                          onClick={() => actualizarSignoGrupo(partido.id, "X")}
                        >
                          <strong>X</strong>
                          <span>Empate</span>
                        </button>

                        <button
                          type="button"
                          disabled={bloqueado || guardando}
                          className={
                            pronosticos[partido.id]?.signoGrupo === "2"
                              ? "signoButton signoButtonActive"
                              : "signoButton"
                          }
                          onClick={() => actualizarSignoGrupo(partido.id, "2")}
                        >
                          <strong>2</strong>
                          <span>Gana {partido.visitante}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="scoreRow">
                        <div className="inputGroup">
                          <span>{partido.local}</span>

                          <input
                            type="text"
                            inputMode="numeric"
                            disabled={bloqueado || guardando}
                            value={pronosticos[partido.id]?.local ?? ""}
                            onChange={(event) =>
                              actualizarMarcador(
                                partido.id,
                                "local",
                                event.target.value
                              )
                            }
                          />
                        </div>

                        <span className="dash">-</span>

                        <div className="inputGroup">
                          <span>{partido.visitante}</span>

                          <input
                            type="text"
                            inputMode="numeric"
                            disabled={bloqueado || guardando}
                            value={pronosticos[partido.id]?.visitante ?? ""}
                            onChange={(event) =>
                              actualizarMarcador(
                                partido.id,
                                "visitante",
                                event.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      {pronosticos[partido.id]?.local !== "" &&
                        pronosticos[partido.id]?.visitante !== "" &&
                        pronosticos[partido.id]?.local ===
                          pronosticos[partido.id]?.visitante && (
                          <div className="advanceSelector">
                            <label>Si hay empate, ¿quién pasa?</label>

                            <div className="advanceButtons">
                              <button
                                type="button"
                                disabled={bloqueado || guardando}
                                className={
                                  pronosticos[partido.id]?.clasificadoPronosticado ===
                                  partido.local
                                    ? "advanceButton advanceButtonActive"
                                    : "advanceButton"
                                }
                                onClick={() =>
                                  actualizarClasificadoPronosticado(
                                    partido.id,
                                    partido.local
                                  )
                                }
                              >
                                {partido.local}
                              </button>

                              <button
                                type="button"
                                disabled={bloqueado || guardando}
                                className={
                                  pronosticos[partido.id]?.clasificadoPronosticado ===
                                  partido.visitante
                                    ? "advanceButton advanceButtonActive"
                                    : "advanceButton"
                                }
                                onClick={() =>
                                  actualizarClasificadoPronosticado(
                                    partido.id,
                                    partido.visitante
                                  )
                                }
                              >
                                {partido.visitante}
                              </button>
                            </div>

                            <p>Solo sirve para determinar el clasificado. No suma puntos extra.</p>
                          </div>
                        )}
                    </>
                  )}

                  {equiposPendientes ? (
                    <div className="lockedHint pendingHint">
                      <Lock size={15} />
                      Este partido no cuenta como pendiente hasta que se conozcan los equipos.
                    </div>
                  ) : bloqueadoPorFecha && (
                    <div className="lockedHint">
                      <Lock size={15} />
                      Este partido ya empezó. El pronóstico no se puede modificar.
                    </div>
                  )}
                </div>

                <div className="bottomRow">
                  {guardado ? (
                    <div className="savedInfo">
                      <CheckCircle2 size={16} />
                      {esFaseGrupos(partido.fase) ? (
                        <>
                          Guardado: {guardado.signo_grupo} · {obtenerTextoSigno(guardado.signo_grupo)}
                        </>
                      ) : (
                        <>
                          Guardado: {guardado.goles_local} - {guardado.goles_visitante}
                          {guardado.clasificado_pronosticado && (
                            <span> · pasa {guardado.clasificado_pronosticado}</span>
                          )}
                        </>
                      )}
                      {guardado.puntos !== null && finalizado && (
                        <span> · {guardado.puntos} puntos</span>
                      )}
                    </div>
                  ) : (
                    <div className="notSavedInfo">
                      {equiposPendientes
                        ? "Disponible cuando se conozcan los clasificados"
                        : "Todavía no has guardado pronóstico"}
                    </div>
                  )}

                  <button
                    type="button"
                    className="saveButton"
                    disabled={bloqueado || guardando}
                    onClick={() => guardarPronostico(partido)}
                  >
                    {guardando ? (
                      <>
                        <Loader2 size={18} className="spin" />
                        Guardando
                      </>
                    ) : equiposPendientes ? (
                      <>
                        <Lock size={18} />
                        Pendiente
                      </>
                    ) : bloqueado ? (
                      <>
                        <Lock size={18} />
                        Cerrado
                      </>
                    ) : guardado ? (
                      <>
                        <Save size={18} />
                        Actualizar
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}

          {partidos.length === 0 && !errorCarga && (
            <div className="emptyBox">No hay partidos cargados todavía.</div>
          )}

          {partidos.length > 0 && partidosFiltrados.length === 0 && (
            <div className="emptyBox">
              No hay partidos que coincidan con tu búsqueda o filtros.
            </div>
          )}
        </div>
      </div>

      <Styles />
    </main>
  );
}

function Team({ code, name }: { code: string | null; name: string }) {
  return (
    <div className="team">
      <TeamFlag code={code} name={name} size="lg" />
      <span>{name}</span>
    </div>
  );
}

function TaskCard({
  icono,
  titulo,
  estado,
  detalle,
  aviso,
  href,
  cta,
  completo,
}: {
  icono: React.ReactNode;
  titulo: string;
  estado: string;
  detalle: string;
  aviso: string;
  href: string;
  cta: string;
  completo: boolean;
}) {
  const contenido = (
    <>
      <div className="taskTop">
        <div className={`taskIcon ${completo ? "taskIconOk" : ""}`}>{icono}</div>
        <div className={`taskStatus ${completo ? "taskStatusOk" : ""}`}>
          {completo ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {estado}
        </div>
      </div>

      <h3>{titulo}</h3>
      <strong>{detalle}</strong>
      <p>{aviso}</p>

      <div className="taskCta">
        {cta}
        <ChevronRight size={17} />
      </div>
    </>
  );

  if (href.startsWith("#")) {
    return (
      <a href={href} className="taskCard">
        {contenido}
      </a>
    );
  }

  return (
    <Link href={href} className="taskCard">
      {contenido}
    </Link>
  );
}

function Styles() {
  return (
    <style>{`
      .misPronosticosPage {
        min-height: 100vh;
        padding: 28px 16px 120px;
        color: white;
      }

      .container {
        max-width: 1120px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 22px;
      }

      .headerIcon {
        width: 64px;
        height: 64px;
        border-radius: 22px;
        background: #2563eb;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .header h1 {
        font-size: 40px;
        font-weight: 900;
        margin: 0;
      }

      .header p {
        color: #94a3b8;
        margin-top: 6px;
        font-weight: 700;
      }

      .errorBox,
      .successBox {
        display: flex;
        align-items: center;
        gap: 10px;
        border-radius: 18px;
        padding: 14px 16px;
        margin-bottom: 16px;
        font-weight: 800;
      }

      .errorBox {
        background: rgba(239,68,68,0.12);
        border: 1px solid rgba(239,68,68,0.28);
        color: #fecaca;
      }

      .successBox {
        background: rgba(34,197,94,0.12);
        border: 1px solid rgba(34,197,94,0.28);
        color: #bbf7d0;
      }

      .controlCenter {
        background: linear-gradient(145deg, rgba(37,99,235,0.22), rgba(15,23,42,0.92));
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 28px;
        padding: 20px;
        margin-bottom: 18px;
        box-shadow: 0 24px 70px rgba(2,6,23,0.34);
      }

      .controlHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }

      .controlEyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #bfdbfe;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 1.4px;
        text-transform: uppercase;
        margin-bottom: 10px;
      }

      .controlHeader h2 {
        font-size: 32px;
        font-weight: 950;
        margin: 0;
      }

      .controlHeader p {
        color: #cbd5e1;
        margin: 8px 0 0;
        font-weight: 700;
        line-height: 1.55;
      }

      .progressCircle {
        width: 116px;
        height: 116px;
        border-radius: 32px;
        background: rgba(2,6,23,0.55);
        border: 1px solid rgba(255,255,255,0.12);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .progressCircle strong {
        font-size: 32px;
        font-weight: 950;
        color: #93c5fd;
      }

      .progressCircle span {
        color: #94a3b8;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .progressBar {
        height: 10px;
        background: rgba(255,255,255,0.10);
        border-radius: 999px;
        overflow: hidden;
        margin: 18px 0 14px;
      }

      .progressBar div {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #60a5fa, #34d399);
        transition: width 0.25s ease;
      }

      .pendingAlert,
      .completedAlert {
        display: flex;
        align-items: center;
        gap: 10px;
        border-radius: 18px;
        padding: 13px 14px;
        font-weight: 900;
        margin-bottom: 14px;
      }

      .pendingAlert {
        background: rgba(245,158,11,0.12);
        border: 1px solid rgba(245,158,11,0.25);
        color: #fde68a;
      }

      .completedAlert {
        background: rgba(34,197,94,0.12);
        border: 1px solid rgba(34,197,94,0.25);
        color: #bbf7d0;
      }

      .taskGrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }

      .taskCard {
        display: block;
        color: inherit;
        text-decoration: none;
        background: rgba(15,23,42,0.72);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 22px;
        padding: 16px;
        transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
      }

      .taskCard:hover {
        transform: translateY(-2px);
        border-color: rgba(96,165,250,0.45);
        background: rgba(15,23,42,0.92);
      }

      .taskTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 12px;
      }

      .taskIcon {
        width: 44px;
        height: 44px;
        border-radius: 16px;
        background: rgba(245,158,11,0.14);
        color: #fde68a;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .taskIconOk {
        background: rgba(34,197,94,0.14);
        color: #86efac;
      }

      .taskStatus {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        padding: 7px 10px;
        background: rgba(245,158,11,0.12);
        color: #fde68a;
        font-size: 12px;
        font-weight: 950;
      }

      .taskStatusOk {
        background: rgba(34,197,94,0.12);
        color: #86efac;
      }

      .taskCard h3 {
        font-size: 18px;
        font-weight: 950;
        margin: 0 0 8px;
      }

      .taskCard strong {
        display: block;
        font-size: 15px;
        color: #e2e8f0;
        margin-bottom: 6px;
      }

      .taskCard p {
        color: #94a3b8;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.45;
        margin: 0 0 14px;
      }

      .taskCta {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #93c5fd;
        font-weight: 950;
        font-size: 14px;
      }

      .summaryBox {
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr 1fr;
        gap: 14px;
        margin-bottom: 18px;
      }

      .summaryBox > div {
        background: rgba(15,23,42,0.72);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 20px;
        padding: 16px;
      }

      .summaryLabel {
        color: #94a3b8;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 900;
        margin: 0 0 6px;
      }

      .summaryBox strong {
        font-size: 22px;
        font-weight: 900;
      }

      .filtersWrapper {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 10px;
        scroll-margin-top: 16px;
      }

      .searchBox {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(15,23,42,0.72);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 18px;
        padding: 0 14px;
        color: #94a3b8;
      }

      .searchBox input {
        width: 100%;
        height: 48px;
        background: transparent;
        border: none;
        outline: none;
        color: white;
        font-weight: 800;
      }

      .searchBox input::placeholder {
        color: #64748b;
      }

      .filterButtons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .filterButtons button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border: 1px solid rgba(255,255,255,0.10);
        background: rgba(15,23,42,0.72);
        color: #cbd5e1;
        border-radius: 999px;
        padding: 10px 14px;
        font-weight: 900;
        cursor: pointer;
        white-space: nowrap;
      }

      .filterButtons button:hover,
      .filterButtons .filterActive {
        background: rgba(37,99,235,0.22);
        border-color: rgba(37,99,235,0.45);
        color: #bfdbfe;
      }

      .resultsInfo {
        color: #94a3b8;
        font-size: 13px;
        font-weight: 800;
        margin: 0 0 14px;
      }

      .cards {
        display: grid;
        gap: 16px;
      }

      .card {
        background: linear-gradient(
          145deg,
          rgba(15,23,42,0.98),
          rgba(15,23,42,0.65)
        );
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 26px;
        padding: 20px;
      }

      .blockedCard {
        opacity: 0.86;
      }

      .finalCard {
        border-color: rgba(250,204,21,0.42);
        box-shadow: 0 0 28px rgba(250,204,21,0.12);
      }

      .tercerPuestoCard {
        border-color: rgba(251,146,60,0.34);
      }

      .semiCard {
        border-color: rgba(217,70,239,0.34);
      }

      .cuartosCard {
        border-color: rgba(139,92,246,0.30);
      }

      .octavosCard {
        border-color: rgba(59,130,246,0.30);
      }

      .dieciseisavosCard {
        border-color: rgba(6,182,212,0.30);
      }

      .topRow {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .topLeft {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }

      .grupoBadge,
      .dateBadge,
      .hourBadge,
      .status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 8px 12px;
        font-weight: 900;
        font-size: 13px;
      }

      .grupoBadge,
      .dateBadge,
      .hourBadge {
        background: rgba(255,255,255,0.08);
        color: #cbd5e1;
      }

      .status.open {
        background: rgba(37,99,235,0.18);
        color: #93c5fd;
      }

      .status.closed {
        background: rgba(239,68,68,0.18);
        color: #fca5a5;
      }

      .status.pendingTeams {
        background: rgba(245,158,11,0.16);
        color: #fde68a;
      }

      .dateRow {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 18px;
      }

      .matchHeader {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 18px;
        margin-bottom: 16px;
      }

      .team {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        font-size: 22px;
        font-weight: 900;
      }

      .team:last-child {
        justify-content: flex-end;
        text-align: right;
      }

      .team span:last-child {
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .vsText {
        color: #93c5fd;
        font-weight: 900;
        letter-spacing: 2px;
        background: rgba(37,99,235,0.14);
        border: 1px solid rgba(37,99,235,0.25);
        border-radius: 999px;
        padding: 8px 16px;
      }

      .metaRow {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        color: #94a3b8;
        font-size: 14px;
        margin-bottom: 16px;
      }

      .metaRow span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .resultBox {
        background: rgba(22,163,74,0.12);
        border: 1px solid rgba(22,163,74,0.28);
        border-radius: 20px;
        padding: 14px 16px;
        margin-bottom: 16px;
      }

      .resultBox span {
        display: block;
        color: #86efac;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 4px;
      }

      .resultBox strong {
        font-size: 20px;
        font-weight: 900;
      }

      .resultBox p {
        color: #bbf7d0;
        margin: 6px 0 0;
        font-weight: 800;
      }

      .pronosticoBox {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 22px;
        padding: 16px;
      }

      .pronosticoTitle {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #bfdbfe;
        font-weight: 900;
        margin-bottom: 14px;
      }

      .scoreRow {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: end;
        gap: 14px;
      }

      .inputGroup {
        display: grid;
        gap: 8px;
      }

      .inputGroup span {
        color: #cbd5e1;
        font-size: 13px;
        font-weight: 800;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .inputGroup input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(2,6,23,0.85);
        color: white;
        border-radius: 16px;
        padding: 13px;
        text-align: center;
        font-size: 24px;
        font-weight: 900;
        outline: none;
      }

      .inputGroup input:focus {
        border-color: rgba(37,99,235,0.85);
        box-shadow: 0 0 0 3px rgba(37,99,235,0.22);
      }

      .inputGroup input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }


      .signoBox p {
        margin: 0 0 12px;
        color: #cbd5e1;
        font-size: 13px;
        font-weight: 900;
      }

      .signoButtons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .signoButton {
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(2,6,23,0.82);
        color: white;
        border-radius: 18px;
        padding: 13px 10px;
        display: grid;
        gap: 5px;
        cursor: pointer;
        transition: 0.18s ease;
      }

      .signoButton strong {
        font-size: 24px;
        font-weight: 950;
      }

      .signoButton span {
        color: #cbd5e1;
        font-size: 12px;
        font-weight: 900;
        line-height: 1.2;
      }

      .signoButton:hover:not(:disabled),
      .signoButtonActive {
        border-color: rgba(37,99,235,0.9);
        background: rgba(37,99,235,0.22);
        box-shadow: 0 0 0 3px rgba(37,99,235,0.16);
      }

      .signoButton:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .pendingTeamsBox {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        border: 1px solid rgba(245,158,11,0.26);
        background: rgba(245,158,11,0.09);
        border-radius: 18px;
        padding: 14px;
        color: #fde68a;
      }

      .pendingTeamsBox strong {
        display: block;
        margin-bottom: 5px;
        font-size: 14px;
        font-weight: 950;
      }

      .pendingTeamsBox p {
        margin: 0;
        color: #fef3c7;
        font-size: 13px;
        line-height: 1.45;
        font-weight: 750;
      }

      .advanceSelector {
        margin-top: 14px;
        border: 1px solid rgba(250,204,21,0.24);
        background: rgba(250,204,21,0.08);
        border-radius: 18px;
        padding: 14px;
      }

      .advanceSelector label {
        display: block;
        margin-bottom: 10px;
        color: #fef3c7;
        font-size: 13px;
        font-weight: 950;
      }

      .advanceButtons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .advanceButton {
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(2,6,23,0.86);
        color: white;
        border-radius: 16px;
        padding: 12px;
        font-weight: 950;
        cursor: pointer;
      }

      .advanceButtonActive,
      .advanceButton:hover:not(:disabled) {
        border-color: rgba(250,204,21,0.85);
        background: rgba(250,204,21,0.18);
      }

      .advanceButton:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .advanceSelector p {
        margin: 10px 0 0;
        color: #fde68a;
        font-size: 12px;
        font-weight: 800;
      }

      .dash {
        font-size: 30px;
        font-weight: 900;
        padding-bottom: 12px;
        color: #94a3b8;
      }

      .lockedHint {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        color: #fca5a5;
        font-size: 13px;
        font-weight: 900;
      }

      .pendingHint {
        color: #fde68a;
      }

      .bottomRow {
        margin-top: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
      }

      .savedInfo {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        color: #86efac;
        font-weight: 900;
        font-size: 14px;
      }

      .notSavedInfo {
        color: #94a3b8;
        font-weight: 800;
        font-size: 14px;
      }

      .saveButton,
      .loginButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: none;
        border-radius: 16px;
        padding: 13px 18px;
        background: #2563eb;
        color: white;
        font-weight: 900;
        cursor: pointer;
        text-decoration: none;
        white-space: nowrap;
      }

      .saveButton:hover,
      .loginButton:hover {
        background: #1d4ed8;
      }

      .saveButton:disabled {
        background: rgba(148,163,184,0.24);
        color: #94a3b8;
        cursor: not-allowed;
      }

      .spin {
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }

        to {
          transform: rotate(360deg);
        }
      }

      .emptyBox {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 24px;
        padding: 32px;
        text-align: center;
        color: #94a3b8;
        font-weight: 800;
      }

      .emptyBox h1 {
        color: white;
        margin-bottom: 8px;
      }

      .emptyBox p {
        margin-bottom: 18px;
      }

      @media (max-width: 900px) {
        .summaryBox {
          grid-template-columns: repeat(2, 1fr);
        }

        .taskGrid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .header h1 {
          font-size: 34px;
        }

        .controlCenter {
          padding: 16px;
          border-radius: 24px;
        }

        .controlHeader {
          align-items: flex-start;
        }

        .controlHeader h2 {
          font-size: 26px;
        }

        .controlHeader p {
          font-size: 14px;
        }

        .progressCircle {
          width: 92px;
          height: 92px;
          border-radius: 26px;
        }

        .progressCircle strong {
          font-size: 26px;
        }

        .pendingAlert,
        .completedAlert {
          align-items: flex-start;
          font-size: 14px;
        }

        .summaryBox {
          display: flex;
          overflow-x: auto;
          gap: 10px;
          padding-bottom: 4px;
          scrollbar-width: none;
        }

        .summaryBox::-webkit-scrollbar {
          display: none;
        }

        .summaryBox > div {
          min-width: 132px;
          padding: 12px;
          border-radius: 16px;
        }

        .summaryLabel {
          font-size: 10px;
          margin-bottom: 4px;
        }

        .summaryBox strong {
          font-size: 18px;
        }

        .filtersWrapper {
          gap: 8px;
          margin-bottom: 8px;
        }

        .searchBox {
          border-radius: 16px;
        }

        .searchBox input {
          height: 42px;
          font-size: 14px;
        }

        .filterButtons {
          flex-wrap: nowrap;
          overflow-x: auto;
          gap: 8px;
          padding-bottom: 4px;
          scrollbar-width: none;
        }

        .filterButtons::-webkit-scrollbar {
          display: none;
        }

        .filterButtons button {
          flex: 0 0 auto;
          padding: 9px 12px;
          font-size: 13px;
        }

        .resultsInfo {
          font-size: 12px;
          margin-bottom: 10px;
        }

        .matchHeader {
          grid-template-columns: 1fr;
          text-align: center;
        }

        .team,
        .team:last-child {
          justify-content: center;
          text-align: center;
        }

        .bottomRow {
          flex-direction: column;
          align-items: stretch;
        }

        .signoButtons {
          grid-template-columns: 1fr;
        }

        .advanceButtons {
          grid-template-columns: 1fr;
        }

        .saveButton {
          width: 100%;
        }
      }

      @media (max-width: 520px) {
        .misPronosticosPage {
          padding: 20px 12px 120px;
        }

        .header {
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .headerIcon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
        }

        .header h1 {
          font-size: 30px;
        }

        .header p {
          font-size: 14px;
        }

        .controlHeader {
          flex-direction: column;
        }

        .progressCircle {
          width: 100%;
          height: auto;
          padding: 16px;
          flex-direction: row;
          gap: 8px;
          border-radius: 20px;
        }

        .taskCard {
          padding: 14px;
        }

        .card {
          padding: 16px;
          border-radius: 22px;
        }

        .scoreRow {
          grid-template-columns: 1fr;
        }

        .dash {
          padding: 0;
          text-align: center;
        }

        .topRow {
          align-items: flex-start;
        }

        .status {
          flex-shrink: 0;
        }
      }
    `}</style>
  );
}
