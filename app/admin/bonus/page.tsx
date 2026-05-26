"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  Database,
  Goal,
  Loader2,
  Medal,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { comprobarAdminActual } from "@/lib/admin";
import { crearSlug } from "@/lib/normalizarTexto";
import { calcularPuntosBonus } from "@/lib/puntos";

type SeleccionImportable = {
  nombre: string;
  teamId: number;
};

type JugadorApiFootball = {
  id?: number;
  name?: string;
  age?: number;
  number?: number;
  position?: string;
  photo?: string;
};

type JugadorSupabase = {
  nombre_oficial: string;
  slug: string;
  seleccion: string;
  posicion: string | null;
  api_football_id: number | null;
  api_team_id: number;
  foto_url: string | null;
  fuente: string;
  activo: boolean;
};

type JugadorOption = {
  nombre_oficial: string;
  seleccion: string;
};

type ResultadoBonusRow = {
  clave: string;
  valor: string | null;
};

type PartidoRow = {
  local: string | null;
  visitante: string | null;
  fase: string | null;
};

type ResultadosOficialesBonus = {
  campeon: string;
  subcampeon: string;
  semifinalista_1: string;
  semifinalista_2: string;
  semifinalista_3: string;
  semifinalista_4: string;
  finalista_1: string;
  finalista_2: string;
  bota_oro: string;
  top_goleador_1: string;
  top_goleador_2: string;
  top_goleador_3: string;
  mejor_jugador: string;
  mejor_portero: string;
  seleccion_revelacion: string;
  revelacion_llega_cuartos: string;
  seleccion_decepcion: string;
};

const SELECCIONES_IMPORTABLES: SeleccionImportable[] = [
  { nombre: "España", teamId: 9 },
  { nombre: "Brasil", teamId: 6 },
  { nombre: "Argentina", teamId: 26 },
  { nombre: "Francia", teamId: 2 },
  { nombre: "Alemania", teamId: 25 },
  { nombre: "Inglaterra", teamId: 10 },
  { nombre: "Portugal", teamId: 27 },
];

const RESULTADOS_INICIALES: ResultadosOficialesBonus = {
  campeon: "",
  subcampeon: "",
  semifinalista_1: "",
  semifinalista_2: "",
  semifinalista_3: "",
  semifinalista_4: "",
  finalista_1: "",
  finalista_2: "",
  bota_oro: "",
  top_goleador_1: "",
  top_goleador_2: "",
  top_goleador_3: "",
  mejor_jugador: "",
  mejor_portero: "",
  seleccion_revelacion: "",
  revelacion_llega_cuartos: "",
  seleccion_decepcion: "",
};

function formatearJugador(
  jugador: JugadorApiFootball,
  seleccion: string,
  teamId: number
): JugadorSupabase | null {
  if (!jugador.name) return null;

  return {
    nombre_oficial: jugador.name,
    slug: crearSlug(`${jugador.name}-${seleccion}`),
    seleccion,
    posicion: jugador.position ?? null,
    api_football_id: jugador.id ?? null,
    api_team_id: teamId,
    foto_url: jugador.photo ?? null,
    fuente: "api-football",
    activo: true,
  };
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

function limpiarValor(valor: string) {
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

export default function AdminBonusPage() {
  const router = useRouter();

  const [cargandoPermisos, setCargandoPermisos] = useState(true);
  const [cargandoConteos, setCargandoConteos] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [importandoTeamId, setImportandoTeamId] = useState<number | null>(null);
  const [importandoTodo, setImportandoTodo] = useState(false);
  const [guardandoResultados, setGuardandoResultados] = useState(false);
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [selecciones, setSelecciones] = useState<string[]>([]);
  const [jugadores, setJugadores] = useState<JugadorOption[]>([]);
  const [resultadosOficiales, setResultadosOficiales] =
    useState<ResultadosOficialesBonus>(RESULTADOS_INICIALES);

  const seleccionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    if (!q) return SELECCIONES_IMPORTABLES;

    return SELECCIONES_IMPORTABLES.filter((seleccion) =>
      seleccion.nombre.toLowerCase().includes(q)
    );
  }, [busqueda]);

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
      await Promise.all([cargarConteos(), cargarDatosResultados()]);
    }

    validarAdmin();

    return () => {
      activo = false;
    };
  }, [router]);

  async function cargarConteos() {
    setCargandoConteos(true);

    try {
      const { data, error: conteoError } = await supabase
        .from("jugadores")
        .select("seleccion")
        .eq("activo", true);

      if (conteoError) {
        throw new Error(conteoError.message);
      }

      const nuevoConteo: Record<string, number> = {};

      ((data || []) as { seleccion: string }[]).forEach((row) => {
        nuevoConteo[row.seleccion] = (nuevoConteo[row.seleccion] || 0) + 1;
      });

      setConteos(nuevoConteo);
    } catch (err) {
      console.error("Error cargando conteos:", err);
    } finally {
      setCargandoConteos(false);
    }
  }

  async function cargarDatosResultados() {
    const [
      { data: jugadoresData, error: jugadoresError },
      { data: partidosData, error: partidosError },
      { data: resultadosData, error: resultadosError },
    ] = await Promise.all([
      supabase
        .from("jugadores")
        .select("nombre_oficial, seleccion")
        .eq("activo", true)
        .order("nombre_oficial", { ascending: true }),
      supabase.from("partidos").select("local, visitante, fase"),
      supabase.from("resultados_bonus").select("clave, valor"),
    ]);

    if (jugadoresError) {
      setError(jugadoresError.message);
      return;
    }

    if (partidosError) {
      setError(partidosError.message);
      return;
    }

    if (resultadosError) {
      setError(resultadosError.message);
      return;
    }

    setJugadores((jugadoresData || []) as JugadorOption[]);

    const equipos = Array.from(
      new Set(
        ((partidosData || []) as PartidoRow[])
          .flatMap((partido) => [
            normalizarEquipo(partido.local),
            normalizarEquipo(partido.visitante),
          ])
          .filter((equipo): equipo is string => Boolean(equipo))
      )
    ).sort((a, b) => a.localeCompare(b, "es"));

    setSelecciones(equipos);

    const mapa = new Map<string, string>();

    ((resultadosData || []) as ResultadoBonusRow[]).forEach((row) => {
      mapa.set(row.clave, row.valor ?? "");
    });

    setResultadosOficiales({
      campeon: mapa.get("campeon") ?? "",
      subcampeon: mapa.get("subcampeon") ?? "",
      semifinalista_1: mapa.get("semifinalista_1") ?? "",
      semifinalista_2: mapa.get("semifinalista_2") ?? "",
      semifinalista_3: mapa.get("semifinalista_3") ?? "",
      semifinalista_4: mapa.get("semifinalista_4") ?? "",
      finalista_1: mapa.get("finalista_1") ?? "",
      finalista_2: mapa.get("finalista_2") ?? "",
      bota_oro: mapa.get("bota_oro") ?? "",
      top_goleador_1: mapa.get("top_goleador_1") ?? "",
      top_goleador_2: mapa.get("top_goleador_2") ?? "",
      top_goleador_3: mapa.get("top_goleador_3") ?? "",
      mejor_jugador: mapa.get("mejor_jugador") ?? "",
      mejor_portero: mapa.get("mejor_portero") ?? "",
      seleccion_revelacion: mapa.get("seleccion_revelacion") ?? "",
      revelacion_llega_cuartos: mapa.get("revelacion_llega_cuartos") ?? "",
      seleccion_decepcion: mapa.get("seleccion_decepcion") ?? "",
    });
  }

  async function importarSeleccion(seleccion: SeleccionImportable) {
    setResultado("");
    setError("");
    setImportandoTeamId(seleccion.teamId);

    try {
      const res = await fetch(`/api/football/plantilla?teamId=${seleccion.teamId}`);

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo consultar la plantilla.");
      }

      const jugadoresApi = Array.isArray(data.jugadores)
        ? (data.jugadores as JugadorApiFootball[])
        : [];

      const jugadoresFormateadosSinDeduplicar = jugadoresApi
        .map((jugador) =>
          formatearJugador(jugador, seleccion.nombre, seleccion.teamId)
        )
        .filter((jugador): jugador is JugadorSupabase => jugador !== null);

      const jugadoresFormateados = Array.from(
        new Map(
          jugadoresFormateadosSinDeduplicar.map((jugador) => [
            jugador.slug,
            jugador,
          ])
        ).values()
      );

      if (jugadoresFormateados.length === 0) {
        setError(
          `La API no ha devuelto jugadores para ${seleccion.nombre}. Puede que la convocatoria aún no esté disponible.`
        );
        return;
      }

      const { error: supabaseError } = await supabase
        .from("jugadores")
        .upsert(jugadoresFormateados, {
          onConflict: "slug",
        });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setResultado(
        `Importados/actualizados ${jugadoresFormateados.length} jugadores de ${seleccion.nombre}.`
      );

      await Promise.all([cargarConteos(), cargarDatosResultados()]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error desconocido importando jugadores.";

      setError(message);
    } finally {
      setImportandoTeamId(null);
    }
  }

  async function importarTodas() {
    setResultado("");
    setError("");
    setImportandoTodo(true);

    let total = 0;
    const errores: string[] = [];

    try {
      for (const seleccion of SELECCIONES_IMPORTABLES) {
        setImportandoTeamId(seleccion.teamId);

        try {
          const res = await fetch(
            `/api/football/plantilla?teamId=${seleccion.teamId}`
          );

          const data = await res.json();

          if (!res.ok || !data.ok) {
            throw new Error(data.error ?? "No se pudo consultar la plantilla.");
          }

          const jugadoresApi = Array.isArray(data.jugadores)
            ? (data.jugadores as JugadorApiFootball[])
            : [];

          const jugadoresFormateadosSinDeduplicar = jugadoresApi
            .map((jugador) =>
              formatearJugador(jugador, seleccion.nombre, seleccion.teamId)
            )
            .filter((jugador): jugador is JugadorSupabase => jugador !== null);

          const jugadoresFormateados = Array.from(
            new Map(
              jugadoresFormateadosSinDeduplicar.map((jugador) => [
                jugador.slug,
                jugador,
              ])
            ).values()
          );

          if (jugadoresFormateados.length === 0) {
            errores.push(`${seleccion.nombre}: sin jugadores devueltos`);
            continue;
          }

          const { error: supabaseError } = await supabase
            .from("jugadores")
            .upsert(jugadoresFormateados, {
              onConflict: "slug",
            });

          if (supabaseError) {
            throw new Error(supabaseError.message);
          }

          total += jugadoresFormateados.length;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Error desconocido";

          errores.push(`${seleccion.nombre}: ${message}`);
        }
      }

      await Promise.all([cargarConteos(), cargarDatosResultados()]);

      if (errores.length > 0) {
        setError(`Importación parcial. Errores: ${errores.join(" | ")}`);
      }

      setResultado(`Proceso terminado. Jugadores procesados: ${total}.`);
    } finally {
      setImportandoTeamId(null);
      setImportandoTodo(false);
    }
  }

  function actualizarResultado(
    campo: keyof ResultadosOficialesBonus,
    valor: string
  ) {
    setResultado("");
    setError("");

    setResultadosOficiales((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function jugadorExiste(valor: string) {
    const limpio = valor.trim();

    if (!limpio) return true;

    return jugadores.some(
      (jugador) =>
        jugador.nombre_oficial.trim().toLowerCase() === limpio.toLowerCase()
    );
  }

  function validarResultadosOficiales() {
    const camposJugador: Array<[keyof ResultadosOficialesBonus, string]> = [
      ["bota_oro", "Bota de Oro"],
      ["top_goleador_1", "Top goleador 1"],
      ["top_goleador_2", "Top goleador 2"],
      ["top_goleador_3", "Top goleador 3"],
      ["mejor_jugador", "Mejor jugador"],
      ["mejor_portero", "Mejor portero"],
    ];

    const errores = camposJugador
      .filter(([campo]) => !jugadorExiste(resultadosOficiales[campo]))
      .map(([, label]) => label);

    return errores;
  }

  async function guardarResultadosOficiales() {
    setResultado("");
    setError("");

    const erroresValidacion = validarResultadosOficiales();

    if (erroresValidacion.length > 0) {
      setError(
        `Revisa estos campos: ${erroresValidacion.join(
          ", "
        )}. Debes elegir jugadores activos del catálogo oficial.`
      );
      return;
    }

    setGuardandoResultados(true);

    try {
      const filas = Object.entries(resultadosOficiales).map(([clave, valor]) => ({
        clave,
        valor: limpiarValor(valor),
      }));

      const { error: guardarError } = await supabase
        .from("resultados_bonus")
        .upsert(filas, {
          onConflict: "clave",
        });

      if (guardarError) {
        throw new Error(guardarError.message);
      }

      const resultadoRecalculo = await calcularPuntosBonus();

      if (!resultadoRecalculo.ok) {
        throw new Error(
          resultadoRecalculo.error ??
            "Resultados guardados, pero no se pudieron recalcular los puntos bonus."
        );
      }

      setResultado(
        `Resultados oficiales de bonus guardados correctamente. Pronósticos recalculados: ${
          resultadoRecalculo.actualizados ?? 0
        }.`
      );
      await cargarDatosResultados();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los resultados oficiales.";

      setError(message);
    } finally {
      setGuardandoResultados(false);
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

  return (
    <main className="page">
      <div className="container">
        <div className="kicker">
          <ShieldCheck size={16} />
          Administración
        </div>

        <div className="hero">
          <div>
            <h1>Bonus oficiales</h1>
            <p className="subtitle">
              Gestiona el catálogo oficial de jugadores y registra los resultados
              reales de bonus para que después se puedan recalcular puntos.
            </p>
          </div>

          <button
            className="primaryButton"
            onClick={importarTodas}
            disabled={importandoTodo || importandoTeamId !== null}
          >
            {importandoTodo ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <Database size={18} />
            )}
            Importar selecciones base
          </button>
        </div>

        <section className="notice">
          <Users size={20} />
          <div>
            <strong>Estado:</strong> los jugadores activos se usan en la página
            de bonus del usuario con validación. Italia queda fuera de la lista
            base porque no participa.
          </div>
        </section>

        <section className="officialPanel">
          <div className="panelHeader">
            <div>
              <div className="panelKicker">
                <Trophy size={16} />
                Resultados reales
              </div>
              <h2>Resultados oficiales de bonus</h2>
              <p>
                Guarda aquí los ganadores reales cuando se conozcan. Estos datos
                alimentarán el cálculo automático de puntos bonus.
              </p>
            </div>
          </div>

          <div className="formGrid">
            <BonusSelectAdmin
              icono={<Crown size={18} />}
              label="Campeón"
              value={resultadosOficiales.campeon}
              opciones={selecciones}
              onChange={(valor) => actualizarResultado("campeon", valor)}
            />

            <BonusSelectAdmin
              icono={<Medal size={18} />}
              label="Subcampeón"
              value={resultadosOficiales.subcampeon}
              opciones={selecciones}
              onChange={(valor) => actualizarResultado("subcampeon", valor)}
            />

            <BonusSelectAdmin
              icono={<Trophy size={18} />}
              label="Semifinalista 1"
              value={resultadosOficiales.semifinalista_1}
              opciones={selecciones}
              onChange={(valor) => actualizarResultado("semifinalista_1", valor)}
            />

            <BonusSelectAdmin
              icono={<Trophy size={18} />}
              label="Semifinalista 2"
              value={resultadosOficiales.semifinalista_2}
              opciones={selecciones}
              onChange={(valor) => actualizarResultado("semifinalista_2", valor)}
            />

            <BonusSelectAdmin
              icono={<Trophy size={18} />}
              label="Semifinalista 3"
              value={resultadosOficiales.semifinalista_3}
              opciones={selecciones}
              onChange={(valor) => actualizarResultado("semifinalista_3", valor)}
            />

            <BonusSelectAdmin
              icono={<Trophy size={18} />}
              label="Semifinalista 4"
              value={resultadosOficiales.semifinalista_4}
              opciones={selecciones}
              onChange={(valor) => actualizarResultado("semifinalista_4", valor)}
            />

            <BonusSelectAdmin
              icono={<Medal size={18} />}
              label="Finalista 1"
              value={resultadosOficiales.finalista_1}
              opciones={selecciones}
              onChange={(valor) => actualizarResultado("finalista_1", valor)}
            />

            <BonusSelectAdmin
              icono={<Medal size={18} />}
              label="Finalista 2"
              value={resultadosOficiales.finalista_2}
              opciones={selecciones}
              onChange={(valor) => actualizarResultado("finalista_2", valor)}
            />

            <BonusJugadorAdmin
              icono={<Goal size={18} />}
              label="Bota de Oro"
              value={resultadosOficiales.bota_oro}
              jugadores={jugadores}
              onChange={(valor) => actualizarResultado("bota_oro", valor)}
            />

            <BonusJugadorAdmin
              icono={<Goal size={18} />}
              label="Top goleador 1"
              value={resultadosOficiales.top_goleador_1}
              jugadores={jugadores}
              onChange={(valor) => actualizarResultado("top_goleador_1", valor)}
            />

            <BonusJugadorAdmin
              icono={<Goal size={18} />}
              label="Top goleador 2"
              value={resultadosOficiales.top_goleador_2}
              jugadores={jugadores}
              onChange={(valor) => actualizarResultado("top_goleador_2", valor)}
            />

            <BonusJugadorAdmin
              icono={<Goal size={18} />}
              label="Top goleador 3"
              value={resultadosOficiales.top_goleador_3}
              jugadores={jugadores}
              onChange={(valor) => actualizarResultado("top_goleador_3", valor)}
            />

            <BonusJugadorAdmin
              icono={<Star size={18} />}
              label="Mejor jugador"
              value={resultadosOficiales.mejor_jugador}
              jugadores={jugadores}
              onChange={(valor) => actualizarResultado("mejor_jugador", valor)}
            />

            <BonusJugadorAdmin
              icono={<Shield size={18} />}
              label="Mejor portero"
              value={resultadosOficiales.mejor_portero}
              jugadores={jugadores}
              onChange={(valor) => actualizarResultado("mejor_portero", valor)}
            />

            <BonusSelectAdmin
              icono={<Star size={18} />}
              label="Selección revelación"
              value={resultadosOficiales.seleccion_revelacion}
              opciones={selecciones}
              onChange={(valor) =>
                actualizarResultado("seleccion_revelacion", valor)
              }
            />

            <BonusSelectAdmin
              icono={<Trophy size={18} />}
              label="Revelación llega a cuartos"
              value={resultadosOficiales.revelacion_llega_cuartos}
              opciones={selecciones}
              onChange={(valor) =>
                actualizarResultado("revelacion_llega_cuartos", valor)
              }
            />

            <BonusSelectAdmin
              icono={<AlertTriangle size={18} />}
              label="Selección decepción"
              value={resultadosOficiales.seleccion_decepcion}
              opciones={selecciones}
              onChange={(valor) =>
                actualizarResultado("seleccion_decepcion", valor)
              }
            />
          </div>

          <button
            className="saveButton"
            onClick={guardarResultadosOficiales}
            disabled={guardandoResultados}
          >
            {guardandoResultados ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            Guardar resultados oficiales
          </button>
        </section>

        <section className="catalogPanel">
          <div className="panelHeader">
            <div>
              <div className="panelKicker">
                <Database size={16} />
                Catálogo
              </div>
              <h2>Jugadores por selección</h2>
              <p>
                Importa o actualiza plantillas desde API-Football. Los usuarios
                solo pueden guardar jugadores activos del catálogo.
              </p>
            </div>
          </div>

          <div className="searchBox">
            <Search size={18} />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar selección..."
            />
          </div>

          <section className="grid">
            {seleccionesFiltradas.map((seleccion) => {
              const cargando = importandoTeamId === seleccion.teamId;
              const totalJugadores = conteos[seleccion.nombre] ?? 0;

              return (
                <article className="card" key={seleccion.teamId}>
                  <div>
                    <h3>{seleccion.nombre}</h3>
                    <p>Team ID: {seleccion.teamId}</p>

                    <div className="playerCount">
                      <Star size={15} />
                      {cargandoConteos
                        ? "Contando jugadores..."
                        : `${totalJugadores} jugadores activos`}
                    </div>
                  </div>

                  <button
                    className="secondaryButton"
                    onClick={() => importarSeleccion(seleccion)}
                    disabled={importandoTodo || importandoTeamId !== null}
                  >
                    {cargando ? (
                      <Loader2 className="spin" size={18} />
                    ) : (
                      <RefreshCw size={18} />
                    )}
                    Importar
                  </button>
                </article>
              );
            })}
          </section>
        </section>

        {resultado && (
          <div className="result success">
            <CheckCircle2 size={18} />
            {resultado}
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
          max-width: 1100px;
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
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
        }

        h1 {
          font-size: clamp(38px, 8vw, 58px);
          line-height: 0.95;
          letter-spacing: -0.06em;
          font-weight: 950;
          margin: 0;
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

        .primaryButton,
        .secondaryButton,
        .saveButton {
          border: none;
          border-radius: 16px;
          color: white;
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          white-space: nowrap;
        }

        .primaryButton {
          background: #2563eb;
          padding: 15px 18px;
          min-height: 52px;
        }

        .secondaryButton {
          background: rgba(37, 99, 235, 0.18);
          border: 1px solid rgba(96, 165, 250, 0.34);
          padding: 12px 14px;
          color: #bfdbfe;
        }

        .saveButton {
          margin-top: 18px;
          width: 100%;
          background: #16a34a;
          padding: 15px 18px;
          min-height: 52px;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .notice {
          margin-top: 24px;
          display: flex;
          gap: 12px;
          border-radius: 20px;
          border: 1px solid rgba(34, 197, 94, 0.24);
          background: rgba(22, 163, 74, 0.12);
          color: #dcfce7;
          padding: 16px;
          line-height: 1.55;
          font-weight: 650;
        }

        .officialPanel,
        .catalogPanel {
          margin-top: 24px;
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(15, 23, 42, 0.78);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
          padding: 22px;
        }

        .panelHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .panelKicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .panelHeader h2 {
          margin: 0;
          font-size: 28px;
          letter-spacing: -0.04em;
        }

        .panelHeader p {
          margin: 8px 0 0;
          color: #94a3b8;
          line-height: 1.55;
          font-weight: 650;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .field {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(2, 6, 23, 0.48);
          padding: 14px;
        }

        .field label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #dbeafe;
          font-size: 13px;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .field input,
        .field select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 14px;
          background: #020617;
          color: white;
          outline: none;
          padding: 12px;
          font-weight: 750;
        }

        .field input::placeholder {
          color: #64748b;
        }

        .searchBox {
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(15, 23, 42, 0.78);
          padding: 0 14px;
        }

        .searchBox input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: white;
          padding: 15px 0;
          font-weight: 750;
          font-size: 15px;
        }

        .searchBox input::placeholder {
          color: #64748b;
        }

        .grid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .card {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(2, 6, 23, 0.42);
          padding: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .card h3 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -0.03em;
        }

        .card p {
          margin: 6px 0 0;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 800;
        }

        .playerCount {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #bbf7d0;
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.22);
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 900;
        }

        .result {
          margin-top: 18px;
          display: flex;
          align-items: center;
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

          .hero {
            flex-direction: column;
          }

          .primaryButton {
            width: 100%;
          }

          .formGrid,
          .grid {
            grid-template-columns: 1fr;
          }

          .card {
            align-items: flex-start;
            flex-direction: column;
          }

          .secondaryButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

function BonusSelectAdmin({
  icono,
  label,
  value,
  opciones,
  onChange,
}: {
  icono: React.ReactNode;
  label: string;
  value: string;
  opciones: string[];
  onChange: (valor: string) => void;
}) {
  return (
    <div className="field">
      <label>
        {icono}
        {label}
      </label>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Sin definir</option>
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    </div>
  );
}

function BonusJugadorAdmin({
  icono,
  label,
  value,
  jugadores,
  onChange,
}: {
  icono: React.ReactNode;
  label: string;
  value: string;
  jugadores: JugadorOption[];
  onChange: (valor: string) => void;
}) {
  return (
    <div className="field">
      <label>
        {icono}
        {label}
      </label>
      <input
        list={`admin-jugadores-${label}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar jugador oficial..."
      />
      <datalist id={`admin-jugadores-${label}`}>
        {jugadores.map((jugador) => (
          <option
            key={`${jugador.nombre_oficial}-${jugador.seleccion}`}
            value={jugador.nombre_oficial}
          >
            {jugador.seleccion}
          </option>
        ))}
      </datalist>
    </div>
  );
}