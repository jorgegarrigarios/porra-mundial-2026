"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ClipboardCheck,
  CreditCard,
  Loader2,
  Shield,
  Star,
  Trophy,
  Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AlertasAdmin = {
  ligas: number;
  resultados: number;
  pagos: number;
  pronosticos: number;
};

type LigaIdRow = {
  id: number;
};

type LigaParticipanteSeguimientoRow = {
  liga_id: number;
  participante_id: number;
};

type PronosticoSeguimientoRow = {
  participante_id: number;
  partido_id: number;
};

type PagoSeguimientoRow = {
  liga_id: number;
  participante_id: number;
  pagado: boolean;
};

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
    const { data, error } = await consultaBase(desde, hasta);

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

async function cargarLigasActivasIds() {
  const ligasActivas = await cargarTodasLasPaginas<LigaIdRow>((desde, hasta) =>
    supabase
      .from("ligas")
      .select("id")
      .eq("estado", "activa")
      .range(desde, hasta)
  );

  return new Set(ligasActivas.map((liga) => liga.id));
}

async function cargarMiembrosLigasActivas(ligasActivasIds: Set<number>) {
  if (ligasActivasIds.size === 0) {
    return [];
  }

  const relaciones = await cargarTodasLasPaginas<LigaParticipanteSeguimientoRow>(
    (desde, hasta) =>
      supabase
        .from("liga_participantes")
        .select("liga_id, participante_id")
        .range(desde, hasta)
  );

  return relaciones.filter((row) => ligasActivasIds.has(row.liga_id));
}

async function calcularUsuariosConPronosticosPendientes(
  totalPartidos: number,
  miembrosActivos: LigaParticipanteSeguimientoRow[]
) {
  if (totalPartidos <= 0 || miembrosActivos.length === 0) {
    return 0;
  }

  const pronosticos = await cargarTodasLasPaginas<PronosticoSeguimientoRow>(
    (desde, hasta) =>
      supabase
        .from("pronosticos")
        .select("participante_id, partido_id")
        .range(desde, hasta)
  );

  const pronosticosPorParticipante = new Map<number, Set<number>>();

  pronosticos.forEach((pronostico) => {
    if (!pronosticosPorParticipante.has(pronostico.participante_id)) {
      pronosticosPorParticipante.set(pronostico.participante_id, new Set<number>());
    }

    pronosticosPorParticipante
      .get(pronostico.participante_id)
      ?.add(pronostico.partido_id);
  });

  return miembrosActivos.filter((miembro) => {
    const completados =
      pronosticosPorParticipante.get(miembro.participante_id)?.size ?? 0;

    return completados < totalPartidos;
  }).length;
}

async function calcularPagosPendientes(
  ligasActivasIds: Set<number>,
  miembrosActivos: LigaParticipanteSeguimientoRow[]
) {
  if (ligasActivasIds.size === 0 || miembrosActivos.length === 0) {
    return 0;
  }

  const pagos = await cargarTodasLasPaginas<PagoSeguimientoRow>((desde, hasta) =>
    supabase
      .from("liga_pagos")
      .select("liga_id, participante_id, pagado")
      .range(desde, hasta)
  );

  const pagosConfirmados = new Set<string>();

  pagos.forEach((pago) => {
    if (!ligasActivasIds.has(pago.liga_id)) return;
    if (!pago.pagado) return;

    pagosConfirmados.add(`${pago.liga_id}:${pago.participante_id}`);
  });

  return miembrosActivos.filter((miembro) => {
    const clave = `${miembro.liga_id}:${miembro.participante_id}`;
    return !pagosConfirmados.has(clave);
  }).length;
}

export default function AdminHomePage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [alertas, setAlertas] = useState<AlertasAdmin>({
    ligas: 0,
    resultados: 0,
    pagos: 0,
    pronosticos: 0,
  });

  useEffect(() => {
    let activo = true;

    async function comprobarAdmin() {
      setCargando(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: participante, error } = await supabase
        .from("participantes")
        .select("id, role")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (!activo) return;

      if (error || participante?.role !== "admin") {
        setAutorizado(false);
        setCargando(false);
        router.replace("/");
        return;
      }

      try {
        const ahora = new Date().toISOString();

        const [ligasPend, partidosPend, totalPartidosResult, ligasActivasIds] =
          await Promise.all([
            supabase
              .from("ligas")
              .select("*", { count: "exact", head: true })
              .eq("estado", "pendiente"),
            supabase
              .from("partidos")
              .select("*", { count: "exact", head: true })
              .lte("fecha_inicio", ahora)
              .is("resultado_local", null),
            supabase.from("partidos").select("*", { count: "exact", head: true }),
            cargarLigasActivasIds(),
          ]);

        const miembrosActivos = await cargarMiembrosLigasActivas(ligasActivasIds);

        const totalPartidos = totalPartidosResult.count ?? 0;

        const [pagosPendientes, pronosticosPendientes] = await Promise.all([
          calcularPagosPendientes(ligasActivasIds, miembrosActivos),
          calcularUsuariosConPronosticosPendientes(totalPartidos, miembrosActivos),
        ]);

        if (!activo) return;

        setAlertas({
          ligas: ligasPend.count ?? 0,
          resultados: partidosPend.count ?? 0,
          pagos: pagosPendientes,
          pronosticos: pronosticosPendientes,
        });
      } catch {
        if (!activo) return;

        setAlertas({
          ligas: 0,
          resultados: 0,
          pagos: 0,
          pronosticos: 0,
        });
      }

      setAutorizado(true);
      setCargando(false);
    }

    comprobarAdmin();

    return () => {
      activo = false;
    };
  }, [router]);

  const cards = [
    {
      title: "Moderación ligas",
      desc: "Gestiona aprobación y estado de ligas privadas.",
      href: "/admin/ligas",
      icon: Shield,
    },
    {
      title: "Resultados",
      desc: "Introduce resultados y recalcula V1.2.",
      href: "/admin/resultados",
      icon: Trophy,
    },
    {
      title: "Importar partidos",
      desc: "Carga o actualiza calendario y partidos.",
      href: "/admin/importar-partidos",
      icon: Upload,
    },
    {
      title: "Bonus oficiales",
      desc: "Importa jugadores y gestiona el catálogo oficial de bonus.",
      href: "/admin/bonus",
      icon: Star,
    },
    {
      title: "Pagos",
      desc: "Controla quién ha pagado la inscripción de cada liga.",
      href: "/admin/pagos",
      icon: CreditCard,
    },
    {
      title: "Seguimiento pronósticos",
      desc: "Revisa qué usuarios tienen el 100% de pronósticos completados.",
      href: "/admin/seguimiento-pronosticos",
      icon: ClipboardCheck,
    },
  ];

  if (cargando) {
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
        <div className="hero">
          <div className="heroIcon">
            <Shield size={34} />
          </div>
          <div>
            <h1>Panel Admin</h1>
            <p>Centro de control de la Porra Mundial.</p>
          </div>
        </div>

        <div className="alertPanel">
          <h2>Alertas Admin</h2>

          <div className="alertGrid">
            <div className="alertItem">
              <strong>{alertas.ligas}</strong>
              <span>Ligas pendientes</span>
            </div>

            <div className="alertItem">
              {alertas.resultados > 0 ? (
              <>
                <strong>{alertas.resultados}</strong>
                <span>Partidos sin resultado oficial</span>
              </>
            ) : (
              <>
                <strong>✓</strong>
                <span>Resultados al día</span>
              </>
            )}
            </div>

            <div className="alertItem">
              <strong>{alertas.pagos}</strong>
              <span>Pagos pendientes</span>
            </div>

            <div className="alertItem">
              <strong>{alertas.pronosticos}</strong>
              <span>Usuarios con pronósticos pendientes</span>
            </div>
          </div>
        </div>

        <div className="grid">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link key={card.href} href={card.href} className="card">
                <div className="cardIcon">
                  <Icon size={28} />
                </div>
                <h2>{card.title}</h2>
                <p>{card.desc}</p>
                <div className="cta">
                  Abrir <ArrowRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style>{`
        .page{
          min-height:100vh;
          background:linear-gradient(180deg,#020617 0%,#111827 100%);
          color:white;
          padding:32px 16px 110px;
        }

        .container{
          max-width:1180px;
          margin:0 auto;
        }

        .hero{
          display:flex;
          align-items:center;
          gap:16px;
          margin-bottom:28px;
        }

        .heroIcon{
          width:74px;
          height:74px;
          border-radius:24px;
          background:#dc2626;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 18px 46px rgba(220,38,38,0.24);
        }

        .hero h1{
          margin:0;
          font-size:52px;
          font-weight:950;
          letter-spacing:-0.04em;
        }

        .hero p{
          margin:6px 0 0;
          color:#94a3b8;
          font-weight:700;
        }

        .alertPanel{
          margin-bottom:26px;
          background:linear-gradient(145deg,rgba(127,29,29,.45),rgba(15,23,42,.95));
          border:1px solid rgba(239,68,68,.22);
          border-radius:28px;
          padding:22px;
        }

        .alertPanel h2{
          margin:0 0 18px;
          font-size:28px;
          font-weight:950;
        }

        .alertGrid{
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:14px;
        }

        .alertItem{
          background:rgba(255,255,255,.05);
          border-radius:18px;
          padding:18px;
          display:flex;
          flex-direction:column;
          gap:6px;
        }

        .alertItem strong{
          font-size:34px;
          font-weight:950;
          color:#fca5a5;
        }

        .alertItem span{
          color:#cbd5e1;
          font-weight:800;
        }

        .grid{
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:18px;
        }

        .card{
          text-decoration:none;
          color:white;
          background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(15,23,42,.65));
          border:1px solid rgba(255,255,255,.10);
          border-radius:30px;
          padding:28px;
          transition:.2s ease;
          min-height:230px;
        }

        .card:hover{
          transform:translateY(-3px);
          border-color:rgba(96,165,250,.35);
        }

        .cardIcon{
          width:64px;
          height:64px;
          border-radius:22px;
          background:rgba(37,99,235,.18);
          display:flex;
          align-items:center;
          justify-content:center;
          color:#93c5fd;
          margin-bottom:18px;
        }

        .card h2{
          margin:0;
          font-size:26px;
          font-weight:950;
          letter-spacing:-0.03em;
        }

        .card p{
          color:#94a3b8;
          line-height:1.6;
          margin:10px 0 20px;
          font-weight:650;
        }

        .cta{
          display:inline-flex;
          align-items:center;
          gap:8px;
          color:#bfdbfe;
          font-weight:900;
        }

        @media(max-width:1180px){
          .alertGrid{
            grid-template-columns:repeat(2,minmax(0,1fr));
          }

          .grid{
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
        }

        @media(max-width:760px){
          .alertGrid{grid-template-columns:1fr;}

          .page{
            padding:28px 14px 110px;
          }

          .grid{
            grid-template-columns:1fr;
          }

          .hero{
            align-items:flex-start;
          }

          .heroIcon{
            width:62px;
            height:62px;
            border-radius:22px;
          }

          .hero h1{
            font-size:40px;
          }

          .card{
            min-height:auto;
          }
        }
      `}</style>
    </main>
  );
}
