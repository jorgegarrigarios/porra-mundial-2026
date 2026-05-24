"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Lock,
  MapPin,
  Save,
  Search,
  Target,
  Trophy,
  AlertTriangle,
  Sparkles,
  ArrowRight,
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

const filtros: Filtro[] = [
  "Todos",
  "Pendientes",
  "Guardados",
  "Abiertos",
  "Cerrados",
];

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

export default function MisPronosticosPage() {
  const [participante, setParticipante] = useState<Participante | null>(null);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [pronosticos, setPronosticos] = useState<
    Record<number, { local: string; visitante: string }>
  >({});
  const [pronosticosGuardados, setPronosticosGuardados] = useState<
    Record<number, Pronostico>
  >({});
  const [busqueda, setBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState<Filtro>("Todos");
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [bonusResumen, setBonusResumen] = useState<BonusResumen | null>(null);

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
        return;
      }

      const partidosResponse = (await Promise.race([
        supabase
          .from("partidos")
          .select(
            "id, local, visitante, local_code, visitante_code, fecha_inicio, estadio, ciudad, grupo, fase, resultado_local, resultado_visitante",
          )
          .order("fecha_inicio", { ascending: true, nullsFirst: false }),
        queryTimeout<Partido[]>(),
      ])) as QueryResult<Partido[]>;

      if (partidosResponse.error) {
        console.error(
          "Error cargando partidos:",
          partidosResponse.error.message,
        );
        setErrorCarga(partidosResponse.error.message);
        setPartidos([]);
        return;
      }

      const pronosticosResponse = (await Promise.race([
        supabase
          .from("pronosticos")
          .select("id, partido_id, goles_local, goles_visitante, puntos")
          .eq("participante_id", participanteActual.id),
        queryTimeout<Pronostico[]>(),
      ])) as QueryResult<Pronostico[]>;

      if (pronosticosResponse.error) {
        console.error(
          "Error cargando pronósticos:",
          pronosticosResponse.error.message,
        );
        setErrorCarga(pronosticosResponse.error.message);
        setPronosticos({});
        setPronosticosGuardados({});
        setPartidos(partidosResponse.data ?? []);
        return;
      }

      const bonusResponse = (await Promise.race([
        supabase
          .from("pronosticos_bonus")
          .select(
            "id, campeon, finalista_1, finalista_2, bota_oro, mejor_jugador, mejor_portero, seleccion_revelacion, seleccion_decepcion",
          )
          .eq("participante_id", participanteActual.id)
          .maybeSingle(),
        queryTimeout<BonusResumen | null>(),
      ])) as QueryResult<BonusResumen | null>;

      if (bonusResponse.error) {
        console.error("Error cargando bonus:", bonusResponse.error.message);
        setBonusResumen(null);
      } else {
        setBonusResumen(bonusResponse.data);
      }

      const iniciales: Record<number, { local: string; visitante: string }> =
        {};
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
        };

        guardados[pronostico.partido_id] = pronostico;
      });

      setPartidos(partidosResponse.data ?? []);
      setPronosticos(iniciales);
      setPronosticosGuardados(guardados);
    } catch (error) {
      console.error("Error inesperado cargando Mis Pronósticos:", error);
      setErrorCarga("No se pudieron cargar los pronósticos.");
      setPartidos([]);
      setPronosticos({});
      setPronosticosGuardados({});
      setBonusResumen(null);
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
    });
  }

  function formatearHora(fechaInicio: string | null) {
    if (!fechaInicio) return "--:--";

    const fecha = new Date(fechaInicio);
    if (Number.isNaN(fecha.getTime())) return "--:--";

    return fecha.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
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
      const bloqueado = partidoBloqueado(partido);
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
      if (filtroActivo === "Pendientes") return !guardado;
      if (filtroActivo === "Guardados") return guardado;
      if (filtroActivo === "Abiertos") return !bloqueado;
      if (filtroActivo === "Cerrados") return bloqueado;

      return true;
    });
  }, [partidos, pronosticosGuardados, busqueda, filtroActivo]);

  const totalGuardados = Object.keys(pronosticosGuardados).length;
  const totalPendientes = Math.max(partidos.length - totalGuardados, 0);
  const totalAbiertos = partidos.filter(
    (partido) => !partidoBloqueado(partido),
  ).length;
  const totalCamposBonus = 8;
  const bonusCompletados = bonusResumen
    ? [
        bonusResumen.campeon,
        bonusResumen.finalista_1,
        bonusResumen.finalista_2,
        bonusResumen.bota_oro,
        bonusResumen.mejor_jugador,
        bonusResumen.mejor_portero,
        bonusResumen.seleccion_revelacion,
        bonusResumen.seleccion_decepcion,
      ].filter((valor) => valor && valor.trim().length > 0).length
    : 0;
  const bonusGuardados = Boolean(bonusResumen);

  function actualizarPronostico(
    partidoId: number,
    campo: "local" | "visitante",
    valor: string,
  ) {
    if (valor !== "" && !/^\d+$/.test(valor)) return;

    setPronosticos((prev) => ({
      ...prev,
      [partidoId]: {
        local: prev[partidoId]?.local ?? "",
        visitante: prev[partidoId]?.visitante ?? "",
        [campo]: valor,
      },
    }));
  }

  async function guardarPronostico(partido: Partido) {
    if (!participante) return;

    if (partidoBloqueado(partido)) {
      alert("Este partido ya ha comenzado. El pronóstico está cerrado.");
      return;
    }

    const local = pronosticos[partido.id]?.local;
    const visitante = pronosticos[partido.id]?.visitante;

    if (
      local === undefined ||
      local === "" ||
      visitante === undefined ||
      visitante === ""
    ) {
      alert("Introduce un pronóstico completo.");
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

    setGuardandoId(partido.id);

    try {
      const existente = pronosticosGuardados[partido.id];

      if (existente) {
        const { error } = await supabase
          .from("pronosticos")
          .update({
            goles_local: golesLocal,
            goles_visitante: golesVisitante,
          })
          .eq("id", existente.id);

        if (error) {
          console.error("Error actualizando pronóstico:", error.message);
          alert("No se pudo actualizar el pronóstico.");
          return;
        }
      } else {
        const { error } = await supabase.from("pronosticos").insert({
          participante_id: participante.id,
          partido_id: partido.id,
          goles_local: golesLocal,
          goles_visitante: golesVisitante,
          puntos: 0,
        });

        if (error) {
          console.error("Error guardando pronóstico:", error.message);
          alert("No se pudo guardar el pronóstico.");
          return;
        }
      }

      await cargarDatos();
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
            <p>
              Guarda o modifica tus predicciones antes de que empiece cada
              partido
            </p>
          </div>
        </div>

        {errorCarga && (
          <div className="errorBox">
            <AlertTriangle size={18} />
            <span>{errorCarga}</span>
          </div>
        )}

        <div className="summaryBox">
          <div>
            <p className="summaryLabel">Participante</p>
            <strong>
              {participante.nickname || participante.nombre || "Usuario"}
            </strong>
          </div>

          <div>
            <p className="summaryLabel">Guardados</p>
            <strong>
              {totalGuardados}/{partidos.length}
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

        <Link href="/bonus" className="bonusCard">
          <div className="bonusIcon">
            <Sparkles size={24} />
          </div>

          <div className="bonusContent">
            <div className="bonusTopLine">
              <span>Bonus del Mundial</span>
              <strong
                className={bonusGuardados ? "bonusSaved" : "bonusPending"}
              >
                {bonusGuardados ? "Bonus guardados" : "Pendiente"}
              </strong>
            </div>

            <p>
              Campeón, finalistas, Bota de Oro, mejor jugador, mejor portero,
              selección revelación y selección decepción.
            </p>

            <div className="bonusProgressRow">
              <div className="bonusProgressBar">
                <span
                  style={{
                    width: `${Math.round((bonusCompletados / totalCamposBonus) * 100)}%`,
                  }}
                />
              </div>
              <em>
                {bonusCompletados}/{totalCamposBonus} completados
              </em>
            </div>
          </div>

          <div className="bonusCta">
            {bonusGuardados ? "Editar bonus" : "Ir a bonus"}
            <ArrowRight size={18} />
          </div>
        </Link>

        <div className="filtersWrapper">
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
            const bloqueado = partidoBloqueado(partido);
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

                  {bloqueado ? (
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

                  <div className="scoreRow">
                    <div className="inputGroup">
                      <span>{partido.local}</span>

                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={bloqueado || guardando}
                        value={pronosticos[partido.id]?.local ?? ""}
                        onChange={(event) =>
                          actualizarPronostico(
                            partido.id,
                            "local",
                            event.target.value,
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
                          actualizarPronostico(
                            partido.id,
                            "visitante",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  {bloqueado && (
                    <div className="lockedHint">
                      <Lock size={15} />
                      Este partido ya empezó. El pronóstico no se puede
                      modificar.
                    </div>
                  )}
                </div>

                <div className="bottomRow">
                  {guardado ? (
                    <div className="savedInfo">
                      <CheckCircle2 size={16} />
                      Guardado: {guardado.goles_local} -{" "}
                      {guardado.goles_visitante}
                      {guardado.puntos !== null && finalizado && (
                        <span> · {guardado.puntos} puntos</span>
                      )}
                    </div>
                  ) : (
                    <div className="notSavedInfo">
                      Todavía no has guardado pronóstico
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

      .errorBox {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(239,68,68,0.12);
        border: 1px solid rgba(239,68,68,0.28);
        color: #fecaca;
        border-radius: 18px;
        padding: 14px 16px;
        margin-bottom: 16px;
        font-weight: 800;
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

      .bonusCard {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 16px;
        margin-bottom: 18px;
        padding: 18px;
        border-radius: 24px;
        background: linear-gradient(135deg, rgba(16,185,129,0.18), rgba(15,23,42,0.78));
        border: 1px solid rgba(16,185,129,0.28);
        color: white;
        text-decoration: none;
        box-shadow: 0 18px 40px rgba(2,6,23,0.22);
      }

      .bonusCard:hover {
        border-color: rgba(16,185,129,0.50);
        background: linear-gradient(135deg, rgba(16,185,129,0.24), rgba(15,23,42,0.84));
      }

      .bonusIcon {
        width: 56px;
        height: 56px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(16,185,129,0.18);
        color: #6ee7b7;
        flex-shrink: 0;
      }

      .bonusContent {
        min-width: 0;
      }

      .bonusTopLine {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
      }

      .bonusTopLine span {
        font-size: 20px;
        font-weight: 900;
      }

      .bonusTopLine strong {
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 12px;
        font-weight: 900;
      }

      .bonusSaved {
        background: rgba(34,197,94,0.18);
        color: #86efac;
      }

      .bonusPending {
        background: rgba(250,204,21,0.16);
        color: #fde68a;
      }

      .bonusContent p {
        margin: 0;
        color: #cbd5e1;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.5;
      }

      .bonusProgressRow {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 12px;
      }

      .bonusProgressBar {
        height: 8px;
        max-width: 240px;
        flex: 1;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,0.10);
      }

      .bonusProgressBar span {
        display: block;
        height: 100%;
        border-radius: 999px;
        background: #34d399;
      }

      .bonusProgressRow em {
        color: #94a3b8;
        font-size: 12px;
        font-style: normal;
        font-weight: 900;
        white-space: nowrap;
      }

      .bonusCta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 16px;
        background: #10b981;
        color: #022c22;
        padding: 12px 16px;
        font-weight: 900;
        white-space: nowrap;
      }

      .filtersWrapper {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 10px;
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
      }

      @media (max-width: 760px) {
        .bonusCard {
          grid-template-columns: 1fr;
          align-items: stretch;
          gap: 12px;
          padding: 16px;
        }

        .bonusIcon {
          width: 48px;
          height: 48px;
          border-radius: 17px;
        }

        .bonusCta {
          width: 100%;
        }

        .bonusProgressRow {
          align-items: flex-start;
          flex-direction: column;
        }

        .bonusProgressBar {
          width: 100%;
          max-width: none;
        }

        .header h1 {
          font-size: 34px;
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