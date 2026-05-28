"use client";

import Link from "next/link";
import { Lock, Users, ArrowRight } from "lucide-react";

export default function ReglasPrivadasPage() {
  return (
    <main className="page">
      <section className="card">
        <div className="iconWrap">
          <Lock size={34} />
        </div>

        <p className="eyebrow">Reglas privadas</p>

        <h1>Las reglas se consultan dentro de cada liga</h1>

        <p className="text">
          Para ver el sistema de puntuación y las condiciones de una liga debes
          iniciar sesión y pertenecer a esa liga privada. Así evitamos mostrar
          información fuera del contexto de cada competición.
        </p>

        <Link href="/ligas" className="primaryButton">
          <Users size={19} />
          Ir a mis ligas
          <ArrowRight size={18} />
        </Link>
      </section>

      <style>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 34px 16px 120px;
          background:
            radial-gradient(circle at top, rgba(37,99,235,0.22), transparent 35%),
            linear-gradient(180deg, #020617 0%, #0f172a 100%);
          color: white;
        }

        .card {
          width: min(100%, 620px);
          border-radius: 34px;
          border: 1px solid rgba(255,255,255,0.12);
          background:
            radial-gradient(circle at top right, rgba(37,99,235,0.18), transparent 38%),
            rgba(15,23,42,0.88);
          box-shadow: 0 30px 90px rgba(0,0,0,0.32);
          padding: 34px;
          text-align: center;
        }

        .iconWrap {
          width: 78px;
          height: 78px;
          margin: 0 auto 18px;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(37,99,235,0.18);
          border: 1px solid rgba(96,165,250,0.28);
          color: #bfdbfe;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #60a5fa;
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        h1 {
          margin: 0;
          font-size: clamp(34px, 6vw, 52px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.055em;
        }

        .text {
          margin: 18px auto 0;
          max-width: 500px;
          color: #cbd5e1;
          line-height: 1.65;
          font-weight: 750;
        }

        .primaryButton {
          margin-top: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 16px 20px;
          border-radius: 18px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          text-decoration: none;
          font-weight: 950;
          box-shadow: 0 18px 44px rgba(37,99,235,0.30);
        }

        @media (max-width: 560px) {
          .card {
            padding: 26px 20px;
            border-radius: 28px;
          }

          .primaryButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
