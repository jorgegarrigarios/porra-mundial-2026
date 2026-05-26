"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Shield,
  Star,
  Trophy,
  Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminHomePage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

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

        .grid{
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
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

        @media(max-width:1100px){
          .grid{
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
        }

        @media(max-width:760px){
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
