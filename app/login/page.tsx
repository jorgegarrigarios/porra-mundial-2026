"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Mail,
  Lock,
  ShieldCheck,
  User,
  UserRound,
  Eye,
  EyeOff,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [modoRegistro, setModoRegistro] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [nickname, setNickname] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  const [aceptaPrivacidad, setAceptaPrivacidad] =
    useState(false);

  const [aceptaTerminos, setAceptaTerminos] =
    useState(false);

  const [loading, setLoading] = useState(false);

  async function crearCuenta() {
    if (!nombre || !apellidos || !nickname) {
      alert("Completa todos los campos");
      return;
    }

    if (!aceptaPrivacidad || !aceptaTerminos) {
      alert("Debes aceptar privacidad y términos");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert(
      "Cuenta creada correctamente. Revisa tu email para confirmar la cuenta."
    );

    setLoading(false);
  }

  async function iniciarSesion() {
    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  async function recuperarPassword() {
    if (!email) {
      alert("Introduce tu email primero");
      return;
    }

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login`
              : undefined,
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "Te hemos enviado un email para recuperar tu contraseña"
    );
  }

  return (
    <main className="loginPage">
      <section className="loginCard">
        <div className="iconBox">
          <ShieldCheck size={34} />
        </div>

        <h1>
          {modoRegistro
            ? "Crear cuenta"
            : "Accede a tu porra"}
        </h1>

        <p className="subtitle">
          {modoRegistro
            ? "Crea tu cuenta y empieza a competir con tus amigos."
            : "Inicia sesión para guardar tus pronósticos."}
        </p>

        {modoRegistro && (
          <>
            <label>Nombre</label>

            <div className="inputBox">
              <User size={20} />

              <input
                type="text"
                placeholder="Jorge"
                value={nombre}
                onChange={(e) =>
                  setNombre(e.target.value)
                }
              />
            </div>

            <label>Apellidos</label>

            <div className="inputBox">
              <User size={20} />

              <input
                type="text"
                placeholder="Garriga"
                value={apellidos}
                onChange={(e) =>
                  setApellidos(e.target.value)
                }
              />
            </div>

            <label>Nickname</label>

            <div className="inputBox">
              <UserRound size={20} />

              <input
                type="text"
                placeholder="Garrigt"
                value={nickname}
                onChange={(e) =>
                  setNickname(e.target.value)
                }
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
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            type="button"
            className="togglePassword"
            onClick={() =>
              setMostrarPassword(!mostrarPassword)
            }
          >
            {mostrarPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        {modoRegistro && (
          <>
            <label className="checkboxLabel">
              <input
                type="checkbox"
                checked={aceptaPrivacidad}
                onChange={(e) =>
                  setAceptaPrivacidad(e.target.checked)
                }
              />

              <span>
                Acepto la{" "}
                <Link href="/privacidad">
                  política de privacidad
                </Link>
              </span>
            </label>

            <label className="checkboxLabel">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) =>
                  setAceptaTerminos(e.target.checked)
                }
              />

              <span>
                Acepto los{" "}
                <Link href="/terminos">
                  términos y condiciones
                </Link>
              </span>
            </label>
          </>
        )}

        <button
          className="submitButton"
          onClick={
            modoRegistro
              ? crearCuenta
              : iniciarSesion
          }
          disabled={loading}
        >
          {loading
            ? "Cargando..."
            : modoRegistro
            ? "Crear cuenta"
            : "Iniciar sesión"}
        </button>

        {!modoRegistro && (
          <button
            type="button"
            className="forgotPassword"
            onClick={recuperarPassword}
          >
            ¿Has olvidado tu contraseña?
          </button>
        )}

        <button
          className="switchMode"
          onClick={() =>
            setModoRegistro(!modoRegistro)
          }
        >
          {modoRegistro
            ? "Ya tengo cuenta"
            : "Crear una cuenta"}
        </button>
      </section>

      <style jsx>{`
        .loginPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background:
            radial-gradient(
              circle at top,
              rgba(37, 99, 235, 0.2),
              transparent 40%
            ),
            #020617;
        }

        .loginCard {
          width: 100%;
          max-width: 520px;
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          padding: 40px;
          backdrop-filter: blur(18px);
          box-shadow: 0 0 60px rgba(0, 0, 0, 0.45);
        }

        .iconBox {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 24px;
        }

        h1 {
          font-size: 42px;
          color: white;
          margin-bottom: 12px;
          font-weight: 900;
        }

        .subtitle {
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 34px;
          font-size: 16px;
        }

        label {
          display: block;
          color: #cbd5e1;
          font-weight: 700;
          margin-bottom: 10px;
          margin-top: 18px;
        }

        .inputBox {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 0 18px;
          height: 62px;
          color: #94a3b8;
        }

        .inputBox input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 16px;
        }

        .passwordBox {
          padding-right: 10px;
        }

        .togglePassword {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkboxLabel {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 18px;
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.6;
        }

        .checkboxLabel input {
          margin-top: 3px;
        }

        .checkboxLabel a {
          color: #60a5fa;
          text-decoration: none;
        }

        .submitButton {
          width: 100%;
          margin-top: 30px;
          height: 62px;
          border: none;
          border-radius: 18px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );
          color: white;
          font-size: 18px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .submitButton:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.35);
        }

        .forgotPassword {
          margin-top: 18px;
          background: transparent;
          border: none;
          color: #60a5fa;
          cursor: pointer;
          font-size: 15px;
          font-weight: 700;
          width: 100%;
        }

        .switchMode {
          margin-top: 26px;
          background: transparent;
          border: none;
          color: #cbd5e1;
          cursor: pointer;
          font-size: 15px;
          width: 100%;
        }

        @media (max-width: 640px) {
          .loginCard {
            padding: 30px 22px;
            border-radius: 26px;
          }

          h1 {
            font-size: 34px;
          }
        }
      `}</style>
    </main>
  );
}