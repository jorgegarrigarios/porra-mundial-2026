"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogIn,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

import { obtenerParticipanteActual } from "@/lib/participante";
import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ codigo: string }>;
};

type Liga = {
  id: number;
  nombre: string;
  codigo: string;
};

type Estado = "cargando" | "login" | "unido" | "yaDentro" | "error";

async function conTimeout<T>(
  operacion: PromiseLike<T>,
  ms: number,
  mensaje = "La operación ha tardado demasiado."
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(mensaje));
    }, ms);
  });

  try {
    return await Promise.race([Promise.resolve(operacion), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default function InvitarLigaPage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();

  const codigoInvitacion = decodeURIComponent(resolvedParams.codigo || "")
    .trim()
    .toUpperCase();

  const [estado, setEstado] = useState<Estado>("cargando");
  const [liga, setLiga] = useState<Liga | null>(null);
  const [mensaje, setMensaje] = useState("Preparando invitación...");

  const procesarInvitacion = useCallback(async () => {
    setEstado("cargando");
    setMensaje("Comprobando la invitación...");

    try {
      if (!codigoInvitacion) {
        setEstado("error");
        setMensaje("El enlace de invitación no es válido.");
        return;
      }

      const { data: ligaData, error: ligaError } = await conTimeout(
        supabase
          .from("ligas")
          .select("id, nombre, codigo")
          .ilike("codigo", codigoInvitacion)
          .maybeSingle(),
        10000,
        "No se ha podido comprobar la liga."
      );

      if (ligaError || !ligaData) {
        setEstado("error");
        setMensaje("No hemos encontrado ninguna liga con este enlace.");
        return;
      }

      const ligaEncontrada = ligaData as Liga;
      setLiga(ligaEncontrada);

      const participante = await conTimeout(
        obtenerParticipanteActual(),
        10000,
        "No se ha podido cargar tu perfil."
      );

      if (!participante) {
        setEstado("login");
        setMensaje(
          "Para unirte a esta liga necesitas iniciar sesión o crear tu cuenta."
        );
        return;
      }

      setMensaje("Comprobando si ya perteneces a la liga...");

      const { data: yaPertenece, error: perteneceError } = await conTimeout(
        supabase
          .from("liga_participantes")
          .select("id")
          .eq("liga_id", ligaEncontrada.id)
          .eq("participante_id", participante.id)
          .maybeSingle(),
        10000,
        "No se ha podido comprobar tu acceso a la liga."
      );

      if (perteneceError) {
        setEstado("error");
        setMensaje("No se ha podido comprobar si ya perteneces a esta liga.");
        return;
      }

      if (yaPertenece) {
        setEstado("yaDentro");
        setMensaje("Ya perteneces a esta liga. Te llevamos dentro.");

        setTimeout(() => {
          router.replace(`/ligas/${ligaEncontrada.id}`);
        }, 900);

        return;
      }

      setMensaje("Uniéndote a la liga...");

      const { error: insertError } = await conTimeout(
        supabase.from("liga_participantes").insert({
          liga_id: ligaEncontrada.id,
          participante_id: participante.id,
        }),
        10000,
        "No se ha podido completar la unión a la liga."
      );

      if (insertError) {
        setEstado("error");
        setMensaje(
          "No se ha podido unirte a la liga. Puede que el enlace haya caducado o que no tengas permisos."
        );
        return;
      }

      setEstado("unido");
      setMensaje("Te has unido correctamente. Te llevamos a la liga.");

      setTimeout(() => {
        router.replace(`/ligas/${ligaEncontrada.id}`);
      }, 1100);
    } catch (err) {
      console.error("Error procesando invitación:", err);
      setEstado("error");
      setMensaje(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error procesando la invitación."
      );
    }
  }, [codigoInvitacion, router]);

  useEffect(() => {
    procesarInvitacion();
  }, [procesarInvitacion]);

  const titulo =
    estado === "login"
      ? "Inicia sesión para unirte"
      : estado === "unido"
        ? "¡Ya estás dentro!"
        : estado === "yaDentro"
          ? "Ya perteneces a esta liga"
          : estado === "error"
            ? "No se ha podido usar la invitación"
            : "Uniéndote a la liga";

  return (
    <main className="page">
      <section className="inviteCard">
        <div className="glow" />

        <div className="iconWrap">
          {estado === "cargando" ? (
            <Loader2 size={38} className="spin" />
          ) : estado === "error" ? (
            <Shield size={38} />
          ) : estado === "login" ? (
            <LogIn size={38} />
          ) : (
            <CheckCircle2 size={38} />
          )}
        </div>

        <p className="eyebrow">Invitación de liga privada</p>

        <h1>{titulo}</h1>

        {liga && (
          <div className="leagueBox">
            <Trophy size={21} />
            <div>
              <span>Liga</span>
              <strong>{liga.nombre}</strong>
            </div>
          </div>
        )}

        <p className="message">{mensaje}</p>

        {estado === "login" && (
          <div className="actions">
            <Link href="/login" className="primaryButton">
              Iniciar sesión
              <ArrowRight size={18} />
            </Link>

            <p className="helpText">
              Después de iniciar sesión, vuelve a abrir este enlace de invitación.
            </p>
          </div>
        )}

        {estado === "error" && (
          <div className="actions">
            <button
              type="button"
              className="primaryButton"
              onClick={procesarInvitacion}
            >
              Reintentar
            </button>

            <Link href="/ligas" className="secondaryButton">
              Ir a mis ligas
            </Link>
          </div>
        )}

        {(estado === "unido" || estado === "yaDentro") && liga && (
          <Link href={`/ligas/${liga.id}`} className="primaryButton">
            Entrar en la liga
            <ArrowRight size={18} />
          </Link>
        )}

        {estado === "cargando" && (
          <div className="loadingLine">
            <Users size={18} />
            Validando acceso privado...
          </div>
        )}
      </section>

      <style>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 16px 120px;
          background:
            radial-gradient(circle at 50% 0%, rgba(37,99,235,0.28), transparent 34%),
            radial-gradient(circle at 18% 20%, rgba(250,204,21,0.12), transparent 25%),
            linear-gradient(180deg, #020617 0%, #0f172a 52%, #020617 100%);
          color: white;
        }

        .inviteCard {
          position: relative;
          overflow: hidden;
          width: min(100%, 560px);
          border-radius: 34px;
          padding: 34px;
          text-align: center;
          background:
            linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.76)),
            radial-gradient(circle at top right, rgba(37,99,235,0.22), transparent 38%);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 32px 100px rgba(0,0,0,0.32);
        }

        .glow {
          position: absolute;
          width: 240px;
          height: 240px;
          right: -100px;
          top: -120px;
          border-radius: 999px;
          background: rgba(250,204,21,0.18);
          filter: blur(18px);
        }

        .iconWrap,
        .eyebrow,
        .inviteCard h1,
        .leagueBox,
        .message,
        .actions,
        .primaryButton,
        .secondaryButton,
        .loadingLine {
          position: relative;
          z-index: 1;
        }

        .iconWrap {
          width: 82px;
          height: 82px;
          border-radius: 28px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fef3c7;
          background: linear-gradient(135deg, rgba(37,99,235,0.32), rgba(250,204,21,0.16));
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 20px 60px rgba(37,99,235,0.20);
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #93c5fd;
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .inviteCard h1 {
          margin: 0;
          font-size: clamp(34px, 6vw, 52px);
          line-height: 0.98;
          font-weight: 950;
          letter-spacing: -0.055em;
        }

        .leagueBox {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: fit-content;
          max-width: 100%;
          margin: 22px auto 0;
          padding: 14px 18px;
          border-radius: 20px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          text-align: left;
        }

        .leagueBox svg {
          color: #facc15;
          flex-shrink: 0;
        }

        .leagueBox span {
          display: block;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .leagueBox strong {
          display: block;
          margin-top: 2px;
          color: white;
          font-size: 18px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .message {
          margin: 22px auto 0;
          max-width: 430px;
          color: #cbd5e1;
          line-height: 1.65;
          font-weight: 750;
        }

        .actions {
          display: grid;
          gap: 12px;
          margin-top: 24px;
        }

        .primaryButton,
        .secondaryButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-radius: 18px;
          border: none;
          padding: 15px 18px;
          color: white;
          text-decoration: none;
          font-family: inherit;
          font-weight: 950;
          font-size: 15px;
          cursor: pointer;
        }

        .primaryButton {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 18px 44px rgba(37,99,235,0.30);
          margin-top: 24px;
        }

        .actions .primaryButton {
          margin-top: 0;
        }

        .secondaryButton {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: #dbeafe;
        }

        .helpText {
          margin: 0;
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 750;
        }

        .loadingLine {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 22px;
          color: #bfdbfe;
          font-weight: 900;
        }

        @media (max-width: 640px) {
          .page {
            align-items: flex-start;
            padding: 26px 12px 120px;
          }

          .inviteCard {
            border-radius: 28px;
            padding: 26px 20px;
          }

          .iconWrap {
            width: 68px;
            height: 68px;
            border-radius: 24px;
          }
        }
      `}</style>
    </main>
  );
}
