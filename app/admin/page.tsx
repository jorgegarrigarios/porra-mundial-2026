"use client";

import Link from "next/link";
import { Shield, Trophy, Upload, ArrowRight } from "lucide-react";

export default function AdminHomePage() {
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
  ];

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
      .container{max-width:1180px;margin:0 auto;}
      .hero{
        display:flex;align-items:center;gap:16px;
        margin-bottom:28px;
      }
      .heroIcon{
        width:74px;height:74px;border-radius:24px;
        background:#dc2626;display:flex;align-items:center;justify-content:center;
      }
      .hero h1{margin:0;font-size:52px;font-weight:950;}
      .hero p{margin:6px 0 0;color:#94a3b8;font-weight:700;}
      .grid{
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:18px;
      }
      .card{
        text-decoration:none;color:white;
        background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(15,23,42,.65));
        border:1px solid rgba(255,255,255,.10);
        border-radius:30px;
        padding:28px;
        transition:.2s ease;
      }
      .card:hover{
        transform:translateY(-3px);
        border-color:rgba(96,165,250,.35);
      }
      .cardIcon{
        width:64px;height:64px;border-radius:22px;
        background:rgba(37,99,235,.18);
        display:flex;align-items:center;justify-content:center;
        color:#93c5fd;margin-bottom:18px;
      }
      .card h2{margin:0;font-size:28px;font-weight:950;}
      .card p{color:#94a3b8;line-height:1.6;margin:10px 0 20px;}
      .cta{
        display:inline-flex;align-items:center;gap:8px;
        color:#bfdbfe;font-weight:900;
      }
      @media(max-width:900px){
        .grid{grid-template-columns:1fr;}
        .hero h1{font-size:40px;}
      }
      `}</style>
    </main>
  );
}
