"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Mail,
  Lock,
  ShieldCheck,
  User,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [modoRegistro, setModoRegistro] = useState(false);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [nickname, setNickname] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const authUser = data.user;

    if (!authUser) {
      alert("Error creando usuario");
      setLoading(false);
      return;
    }

    await supabase.from("participantes").insert({
      nombre,
      apellidos,
      nickname,
      auth_user_id: authUser.id,
      acepta_privacidad: aceptaPrivacidad,
      acepta_terminos: aceptaTerminos,
      role: "user",
    });

    alert("Cuenta creada correctamente");

    window.location.href = "/";
  }

  async function iniciarSesion() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
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

  return (
    <main className="loginPage">
      <section className="loginCard">
        <div className="iconBox">
          <ShieldCheck size={34} />
        </div>

        <h1>
          {modoRegistro ? "Crear cuenta" : "Accede a tu porra"}
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
                onChange={(e) => setApellidos(e.target.value)}
              />
            </div>

            <label>Nickname</label>

            <div className="inputBox">
              <UserRound size={20} />

              <input
                type="text"
                placeholder="JorgeG"
                value={nickname}
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
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <label>Contraseña</label>

        <div className="inputBox">
          <Lock size={20} />

          <input
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {modoRegistro && (
          <>
            <label className="checkboxRow">
              <input
                type="checkbox"
                checked={aceptaPrivacidad}
                onChange={(e) =>
                  setAceptaPrivacidad(e.target.checked)
                }
              />

              <span>
                He leído y acepto la{" "}
                <Link href="/privacidad" className="legalLink">
                  Política de Privacidad
                </Link>
              </span>
            </label>

            <label className="checkboxRow">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) =>
                  setAceptaTerminos(e.target.checked)
                }
              />

              <span>
                Acepto los{" "}
                <Link href="/terminos" className="legalLink">
                  Términos y Condiciones
                </Link>
              </span>
            </label>

            <p className="legalNotice">
              Al crear una cuenta también aceptas el{" "}
              <Link href="/aviso-legal" className="legalLink">
                Aviso Legal
              </Link>
              .
            </p>
          </>
        )}

        <button
          onClick={
            modoRegistro ? crearCuenta : iniciarSesion
          }
          className="primaryButton"
          disabled={loading}
        >
          {loading
            ? "Cargando..."
            : modoRegistro
            ? "Crear cuenta"
            : "Iniciar sesión"}
        </button>

        <button
          onClick={() => setModoRegistro(!modoRegistro)}
          className="secondaryButton"
        >
          {modoRegistro
            ? "Ya tengo cuenta"
            : "Crear cuenta"}
        </button>
      </section>

      <style>{`
        .loginPage {
          min-height: 100vh;

          background:
            radial-gradient(circle at top, rgba(37,99,235,0.22), transparent 32%),
            linear-gradient(180deg, #020617 0%, #111827 100%);

          color: white;

          padding: 40px 16px 110px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loginCard {
          width: 100%;
          max-width: 460px;

          background:
            linear-gradient(
              145deg,
              rgba(15,23,42,0.98),
              rgba(15,23,42,0.65)
            );

          border: 1px solid rgba(255,255,255,0.12);

          border-radius: 32px;

          padding: 32px;

          box-shadow: 0 30px 90px rgba(0,0,0,0.38);
        }

        .iconBox {
          width: 70px;
          height: 70px;

          border-radius: 24px;

          background: #2563eb;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 22px;
        }

        h1 {
          font-size: 34px;
          font-weight: 900;
          margin: 0;
        }

        .subtitle {
          color: #94a3b8;
          line-height: 1.6;

          margin-top: 10px;
          margin-bottom: 26px;
        }

        label {
          display: block;

          color: #cbd5e1;

          font-size: 13px;
          font-weight: 900;

          text-transform: uppercase;

          letter-spacing: 1px;

          margin-bottom: 8px;
          margin-top: 16px;
        }

        .inputBox {
          display: flex;
          align-items: center;
          gap: 10px;

          background: rgba(0,0,0,0.28);

          border: 1px solid rgba(255,255,255,0.12);

          border-radius: 16px;

          padding: 14px;
        }

        .inputBox input {
          width: 100%;

          background: transparent;

          border: none;
          outline: none;

          color: white;

          font-size: 16px;
        }

        .inputBox input::placeholder {
          color: #64748b;
        }

        .checkboxRow {
          display: flex;
          align-items: flex-start;
          gap: 10px;

          margin-top: 18px;

          font-size: 13px;

          color: #cbd5e1;

          text-transform: none;
          letter-spacing: 0;

          cursor: pointer;
        }

        .checkboxRow input {
          width: 18px;
          height: 18px;
          margin-top: 2px;
        }

        .legalLink {
          color: #60a5fa;
          text-decoration: none;
          font-weight: 800;
        }

        .legalLink:hover {
          text-decoration: underline;
        }

        .legalNotice {
          margin-top: 18px;

          color: #94a3b8;

          font-size: 13px;

          line-height: 1.6;
        }

        .primaryButton,
        .secondaryButton {
          width: 100%;

          border: none;

          border-radius: 16px;

          padding: 15px;

          font-weight: 900;
          font-size: 16px;

          cursor: pointer;

          margin-top: 18px;
        }

        .primaryButton {
          background: #2563eb;
          color: white;
        }

        .secondaryButton {
          background: rgba(255,255,255,0.08);

          color: white;

          border: 1px solid rgba(255,255,255,0.12);
        }

        @media (max-width: 520px) {
          .loginCard {
            padding: 24px;
            border-radius: 26px;
          }

          h1 {
            font-size: 28px;
          }

          .subtitle {
            font-size: 14px;
          }
        }
      `}</style>
    </main>
  );
}