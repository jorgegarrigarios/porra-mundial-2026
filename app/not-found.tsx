import Link from "next/link";
import { SearchX, Home, Trophy } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="notFoundPage">
      <div className="card">
        <div className="iconWrapper">
          <SearchX size={44} />
        </div>

        <div className="badge">404</div>

        <h1>Página no encontrada</h1>

        <p>
          La página que estás buscando no existe o ha sido movida.
        </p>

        <div className="actions">
          <Link href="/" className="primaryButton">
            <Home size={18} />
            Ir al inicio
          </Link>

          <Link href="/ranking" className="secondaryButton">
            <Trophy size={18} />
            Ver ranking
          </Link>
        </div>
      </div>

      <style>{`
        .notFoundPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 35%),
            linear-gradient(180deg, #020617 0%, #111827 100%);
          color: white;
        }

        .card {
          width: 100%;
          max-width: 540px;
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
          width: 96px;
          height: 96px;
          margin: 0 auto 24px;
          border-radius: 30px;
          background: rgba(37,99,235,0.14);
          border: 1px solid rgba(37,99,235,0.30);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #93c5fd;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.10);
          padding: 8px 14px;
          font-weight: 900;
          font-size: 14px;
          margin-bottom: 18px;
        }

        h1 {
          margin: 0;
          font-size: 42px;
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

        .primaryButton,
        .secondaryButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 18px;
          padding: 14px 20px;
          font-weight: 900;
          font-size: 15px;
          text-decoration: none;
          transition: 0.2s ease;
        }

        .primaryButton {
          background: #2563eb;
          color: white;
        }

        .primaryButton:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .secondaryButton {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          color: white;
        }

        .secondaryButton:hover {
          background: rgba(255,255,255,0.10);
          transform: translateY(-1px);
        }

        @media (max-width: 640px) {
          .card {
            padding: 32px 22px;
            border-radius: 26px;
          }

          h1 {
            font-size: 34px;
          }

          .actions {
            flex-direction: column;
          }

          .primaryButton,
          .secondaryButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}