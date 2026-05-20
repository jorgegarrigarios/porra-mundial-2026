"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

function timeoutPromise(ms: number, mensaje: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(mensaje)), ms);
  });
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms = 12000,
  mensaje = "La operación está tardando demasiado. Revisa tu conexión e inténtalo de nuevo."
): Promise<T> {
  return Promise.race([promise, timeoutPromise(ms, mensaje)]);
}

export default function LoginPage() {
  const [modoRegistro, setModoRegistro] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [nickname, setNickname] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [loading, setLoading] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  async function crearCuenta() {
    if (loading) return;

    setMensajeError(null);

    if (!nombre.trim() || !apellidos.trim() || !nickname.trim()) {
      setMensajeError("Completa nombre, apellidos y nickname.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setMensajeError("Introduce email y contraseña.");
      return;
    }

    if (password.length < 6) {
      setMensajeError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!aceptaPrivacidad || !aceptaTerminos) {
      setMensajeError("Debes aceptar la política de privacidad y los términos.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nombre: nombre.trim(),
              apellidos: apellidos.trim(),
              nickname: nickname.trim(),
            },
          },
        }),
        12000
      );

      if (error) {
        setMensajeError(error.message);
        return;
      }

      alert("Cuenta creada correctamente. Revisa tu email para confirmar la cuenta.");

      setModoRegistro(false);
      setPassword("");
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudo crear la cuenta. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  async function iniciarSesion() {
    if (loading) return;

    setMensajeError(null);

    if (!email.trim() || !password.trim()) {
      setMensajeError("Introduce email y contraseña.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        12000
      );

      if (error) {
        setMensajeError(error.message);
        return;
      }

      window.location.assign("/ligas");
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  async function recuperarPassword() {
    if (loading) return;

    setMensajeError(null);

    if (!email.trim()) {
      setMensajeError("Introduce tu email primero.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login`
              : undefined,
        }),
        12000
      );

      if (error) {
        setMensajeError(error.message);
        return;
      }

      alert("Te hemos enviado un email para recuperar tu contraseña.");
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudo enviar el email de recuperación."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginCard">
        <div className="iconBox">
          <ShieldCheck size={34} />
        </div>

        <h1>{modoRegistro ? "Crear cuenta" : "Accede a tu porra"}</h1>

        <p className="subtitle">
          {modoRegistro
            ? "Crea tu cuenta y empieza a competir con tus amigos."
            : "Inicia sesión para guardar tus pronósticos."}
        </p>

        {mensajeError && (
          <div className="errorBox">
            <AlertTriangle size={18} />
            <span>{mensajeError}</span>
          </div>
        )}

        {modoRegistro && (
          <>
            <label>Nombre</label>
            <div className="inputBox">
              <User size={20} />
              <input
                type="text"
                placeholder="Jorge"
                value={nombre}
                disabled={loading}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <label>Apellidos</label>
            <div className="inputBox">
              <User size={20} />
              <input
                type="text"
                placeholder="Garriga"
                value={apellidos}
                disabled={loading}
                onChange={(e) => setApellidos(e.target.value)}
              />
            </div>

            <label>Nickname</label>
            <div className="inputBox">
              <UserRound size={20} />
              <input
                type="text"
                placeholder="Garrigt"
                value={nickname}
                disabled={loading}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          </>
        )}

        <label>Email</label>
        <div className="inputBox">
          <Mail size={20} />
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <label>Contraseña</label>
        <div className="inputBox passwordBox">
          <Lock size={20} />

          <input
            type={mostrarPassword ? "text" : "password"}
            placeholder="********"
            value={password}
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="togglePassword"
            disabled={loading}
            onClick={() => setMostrarPassword(!mostrarPassword)}
          >
            {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {modoRegistro && (
          <>
            <label className="checkboxLabel">
              <input
                type="checkbox"
                checked={aceptaPrivacidad}
                disabled={loading}
                onChange={(e) => setAceptaPrivacidad(e.target.checked)}
              />

              <span>
                Acepto la <Link href="/privacidad">política de privacidad</Link>
              </span>
            </label>

            <label className="checkboxLabel">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                disabled={loading}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
              />

              <span>
                Acepto los <Link href="/terminos">términos y condiciones</Link>
              </span>
            </label>
          </>
        )}

        <button
          type="button"
          className="mainButton"
          disabled={loading}
          onClick={modoRegistro ? crearCuenta : iniciarSesion}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="spin" />
              {modoRegistro ? "Creando cuenta..." : "Entrando..."}
            </>
          ) : modoRegistro ? (
            "Crear cuenta"
          ) : (
            "Entrar"
          )}
        </button>

        {!modoRegistro && (
          <button
            type="button"
            className="linkButton"
            disabled={loading}
            onClick={recuperarPassword}
          >
            ¿Has olvidado tu contraseña?
          </button>
        )}

        <button
          type="button"
          className="switchButton"
          disabled={loading}
          onClick={() => {
            setMensajeError(null);
            setModoRegistro(!modoRegistro);
          }}
        >
          {modoRegistro
            ? "Ya tengo cuenta. Iniciar sesión"
            : "No tengo cuenta. Crear una"}
        </button>
      </section>

      <style>{`
        .loginPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px 120px;
          background:
            radial-gradient(circle at top, rgba(37,99,235,0.20), transparent 34%),
            linear-gradient(180deg, #020617 0%, #111827 100%);
          color: white;
        }

        .loginCard {
          width: 100%;
          max-width: 460px;
          background: rgba(15,23,42,0.92);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 30px;
          padding: 30px;
          box-shadow: 0 30px 90px rgba(0,0,0,0.38);
          backdrop-filter: blur(18px);
        }

        .iconBox {
          width: 70px;
          height: 70px;
          border-radius: 24px;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        h1 {
          font-size: 34px;
          font-weight: 950;
          margin: 0;
        }

        .subtitle {
          color: #94a3b8;
          line-height: 1.5;
          margin: 10px 0 22px;
          font-weight: 700;
        }

        label {
          display: block;
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 900;
          margin: 14px 0 8px;
        }

        .inputBox {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(2,6,23,0.78);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          padding: 0 14px;
          color: #94a3b8;
        }

        .inputBox input {
          width: 100%;
          height: 50px;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-weight: 800;
          font-size: 15px;
        }

        .inputBox input:disabled {
          opacity: 0.7;
        }

        .passwordBox {
          padding-right: 6px;
        }

        .togglePassword {
          width: 42px;
          height: 42px;
          border: none;
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .checkboxLabel {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          line-height: 1.4;
          margin-top: 14px;
          color: #cbd5e1;
        }

        .checkboxLabel input {
          margin-top: 2px;
        }

        .checkboxLabel a {
          color: #93c5fd;
          font-weight: 900;
        }

        .errorBox {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          background: rgba(239,68,68,0.13);
          border: 1px solid rgba(239,68,68,0.28);
          color: #fecaca;
          border-radius: 16px;
          padding: 12px 14px;
          margin: 14px 0;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.35;
        }

        .mainButton {
          width: 100%;
          height: 54px;
          border: none;
          border-radius: 17px;
          background: #2563eb;
          color: white;
          font-weight: 950;
          font-size: 16px;
          margin-top: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          cursor: pointer;
          font-family: inherit;
        }

        .mainButton:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }

        .linkButton,
        .switchButton {
          width: 100%;
          border: none;
          background: transparent;
          color: #93c5fd;
          font-weight: 900;
          cursor: pointer;
          font-family: inherit;
        }

        .linkButton {
          margin-top: 16px;
        }

        .switchButton {
          margin-top: 18px;
          color: #cbd5e1;
        }

        .linkButton:disabled,
        .switchButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 520px) {
          .loginPage {
            align-items: flex-start;
            padding: 24px 12px 120px;
          }

          .loginCard {
            padding: 24px;
            border-radius: 26px;
          }

          h1 {
            font-size: 30px;
          }
        }
      `}</style>
    </main>
  );
}