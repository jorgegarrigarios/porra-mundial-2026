"use client";

import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <main className="errorPage">
      <div className="card">
        <div className="iconWrapper">
          <AlertTriangle size={42} />
        </div>

        <h1>Ha ocurrido un error</h1>

        <p>
          Algo no ha salido como esperábamos. Puedes volver a intentarlo o
          regresar al inicio.
        </p>

        <div className="actions">
          <button onClick={() => reset()} className="retryButton">
            <RotateCcw size={18} />
            Reintentar
          </button>

          <Link href="/" className="homeButton">
            <Home size={18} />
            Ir al inicio
          </Link>
        </div>
      </div>

      <style>{`
        .errorPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(circle at top, rgba(239,68,68,0.18), transparent 35%),
            linear-gradient(180deg, #020617 0%, #111827 100%);
          color: white;
        }

        .card {
          width: 100%;
          max-width: 520px;
          background:
            linear-gradient(
              145deg,
              rgba(15,23,42,0.98),
              rgba(15,23,42,0.72)
            );
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 32px;
          padding: 42px 32px;
          text-align: center;
          backdrop-filter: blur(18px);
          box-shadow: 0 24px 80px rgba(0,0,0,0.45);
        }

        .iconWrapper {
          width: 92px;
          height: 92px;
          margin: 0 auto 24px;
          border-radius: 28px;
          background: rgba(239,68,68,0.16);
          border: 1px solid rgba(239,68,68,0.30);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fca5a5;
        }

        h1 {
          margin: 0;
          font-size: 40px;
          font-weight: 900;
        }

        p {
          margin-top: 16px;
          color: #94a3b8;
          line-height: 1.7;
          font-size: 16px;
        }

        .actions {
          margin-top: 34px;
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .retryButton,
        .homeButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 18px;
          padding: 14px 20px;
          font-weight: 900;
          font-size: 15px;
          cursor: pointer;
          transition: 0.2s ease;
          text-decoration: none;
        }

        .retryButton {
          border: none;
          background: #2563eb;
          color: white;
        }

        .retryButton:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .homeButton {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          color: white;
        }

        .homeButton:hover {
          background: rgba(255,255,255,0.10);
          transform: translateY(-1px);
        }

        @media (max-width: 640px) {
          .card {
            padding: 32px 22px;
            border-radius: 26px;
          }

          h1 {
            font-size: 32px;
          }

          .actions {
            flex-direction: column;
          }

          .retryButton,
          .homeButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}