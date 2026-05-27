"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ModoFormulario = "login" | "registro" | "reset";
type TipoMensajeEspecial = "registro" | "confirmacion" | "reset" | "invitacion" | null;

const INVITACION_PENDIENTE_KEY = "porra_invitacion_pendiente";

function esDestinoInternoSeguro(destino: string | null): destino is string {
  return Boolean(destino && destino.startsWith("/") && !destino.startsWith("//"));
}

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<ModoFormulario>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [nickname, setNickname] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [tipoMensajeEspecial, setTipoMensajeEspecial] =
    useState<TipoMensajeEspecial>(null);
  const [emailPendienteConfirmacion, setEmailPendienteConfirmacion] = useState("");

  function limpiarAvisos() {
    setMensaje("");
    setError("");
    setTipoMensajeEspecial(null);
  }

  function obtenerNombreGoogle(fullName: string | null | undefined) {
    const partes = (fullName ?? "").trim().split(" ").filter(Boolean);

    if (partes.length === 0) {
      return {
        nombreGoogle: "Usuario",
        apellidosGoogle: null,
      };
    }

    return {
      nombreGoogle: partes[0],
      apellidosGoogle: partes.slice(1).join(" ") || null,
    };
  }

  function obtenerUrlCorreo() {
    const emailNormalizado = (emailPendienteConfirmacion || email).trim().toLowerCase();

    if (emailNormalizado.includes("@gmail.")) {
      return "https://mail.google.com/";
    }

    if (
      emailNormalizado.includes("@outlook.") ||
      emailNormalizado.includes("@hotmail.") ||
      emailNormalizado.includes("@live.") ||
      emailNormalizado.includes("@msn.")
    ) {
      return "https://outlook.live.com/mail/";
    }

    return null;
  }

  function obtenerDestinoPostLogin(): string {
    if (typeof window === "undefined") return "/";

    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");
    const invitacionPendiente = window.localStorage.getItem(INVITACION_PENDIENTE_KEY);

    if (esDestinoInternoSeguro(returnTo)) {
      return returnTo;
    }

    if (esDestinoInternoSeguro(invitacionPendiente)) {
      return invitacionPendiente;
    }

    return "/";
  }

  function redirigirDespuesDeLogin() {
    const destino = obtenerDestinoPostLogin();

    if (typeof window !== "undefined" && destino !== "/") {
      window.localStorage.removeItem(INVITACION_PENDIENTE_KEY);
    }

    router.replace(destino);
    router.refresh();
  }

  async function asegurarParticipanteGoogle() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) return false;

    const { data: participanteExistente, error: participanteError } =
      await supabase
        .from("participantes")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (participanteError) {
      throw new Error(participanteError.message);
    }

    if (participanteExistente?.id) {
      return true;
    }

    const metadata = user.user_metadata ?? {};
    const fullName =
      typeof metadata.full_name === "string"
        ? metadata.full_name
        : typeof metadata.name === "string"
          ? metadata.name
          : "";

    const { nombreGoogle, apellidosGoogle } = obtenerNombreGoogle(fullName);
    const emailUsuario = user.email ?? "";
    const nicknameBase =
      typeof metadata.preferred_username === "string"
        ? metadata.preferred_username
        : fullName || emailUsuario.split("@")[0] || "Usuario";

    const { error: insertError } = await supabase.from("participantes").insert({
      auth_user_id: user.id,
      nombre: nombreGoogle,
      apellidos: apellidosGoogle,
      nickname: nicknameBase,
      acepta_terminos: true,
      acepta_privacidad: true,
      role: "user",
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return true;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const tipo = params.get("type") ?? hashParams.get("type");
    const emailConfirmado =
      params.get("email_confirmed") === "1" ||
      params.get("confirmed") === "1" ||
      tipo === "signup" ||
      tipo === "email_change";
    const resetPassword = tipo === "recovery" || params.get("reset") === "1";
    const invitacionPendiente = window.localStorage.getItem(INVITACION_PENDIENTE_KEY);

    if (emailConfirmado) {
      setModo("login");
      setTipoMensajeEspecial("confirmacion");
      setMensaje(
        invitacionPendiente
          ? "Email confirmado correctamente. Inicia sesión y te llevaremos automáticamente a la liga invitada."
          : "Email confirmado correctamente. Ya puedes iniciar sesión y empezar tu porra."
      );

      supabase.auth.getSession().then(({ data }) => {
        if (data.session && esDestinoInternoSeguro(invitacionPendiente)) {
          window.localStorage.removeItem(INVITACION_PENDIENTE_KEY);
          router.replace(invitacionPendiente as string);
          router.refresh();
          return;
        }

        window.history.replaceState({}, document.title, "/login");
      });

      return;
    }

    if (resetPassword) {
      setModo("login");
      setTipoMensajeEspecial("reset");
      setMensaje("Enlace validado correctamente. Ya puedes iniciar sesión.");
      window.history.replaceState({}, document.title, "/login");
      return;
    }

    if (invitacionPendiente) {
      setTipoMensajeEspecial("invitacion");
      setMensaje("Inicia sesión o crea tu cuenta y te llevaremos automáticamente a la liga invitada.");
    }
  }, [router]);

  useEffect(() => {
    const vieneDeGoogle =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("oauth") === "google";

    if (!vieneDeGoogle) return;

    let activo = true;

    async function finalizarGoogle() {
      setCargando(true);
      setError("");

      try {
        const ok = await asegurarParticipanteGoogle();

        if (!activo) return;

        if (ok) {
          redirigirDespuesDeLogin();
          return;
        }

        setError("No se ha podido completar el inicio de sesión con Google.");
      } catch (err) {
        if (!activo) return;

        const message =
          err instanceof Error
            ? err.message
            : "Error completando el inicio de sesión con Google.";

        setError(message);
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    finalizarGoogle();

    return () => {
      activo = false;
    };
  }, [router]);

  async function iniciarSesionConGoogle() {
    limpiarAvisos();
    setCargando(true);

    const destinoPostLogin = obtenerDestinoPostLogin();
    const returnToParam =
      destinoPostLogin !== "/" ? `&returnTo=${encodeURIComponent(destinoPostLogin)}` : "";
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login?oauth=google${returnToParam}`
        : undefined;

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (googleError) {
      setCargando(false);
      setError(googleError.message);
    }
  }

  async function iniciarSesion() {
    limpiarAvisos();

    if (!email.trim() || !password.trim()) {
      setError("Introduce tu email y contraseña.");
      return;
    }

    setCargando(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setCargando(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    redirigirDespuesDeLogin();
  }

  async function registrarUsuario() {
    limpiarAvisos();

    if (!nombre.trim()) {
      setError("Introduce tu nombre.");
      return;
    }

    if (!nickname.trim()) {
      setError("Introduce un nickname.");
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Introduce tu email y contraseña.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!aceptaTerminos || !aceptaPrivacidad) {
      setError("Debes aceptar los términos y la política de privacidad.");
      return;
    }

    setCargando(true);

    const emailRegistro = email.trim();
    const destinoPostLogin = obtenerDestinoPostLogin();
    const returnToParam =
      destinoPostLogin !== "/" ? `&returnTo=${encodeURIComponent(destinoPostLogin)}` : "";
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login?email_confirmed=1${returnToParam}`
        : undefined;

    const { data, error: registroError } = await supabase.auth.signUp({
      email: emailRegistro,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          nickname: nickname.trim(),
        },
      },
    });

    if (registroError) {
      setCargando(false);
      setError(registroError.message);
      return;
    }

    if (data.user?.id) {
      const { error: participanteError } = await supabase
        .from("participantes")
        .upsert(
          {
            auth_user_id: data.user.id,
            nombre: nombre.trim(),
            apellidos: apellidos.trim() || null,
            nickname: nickname.trim(),
            acepta_terminos: true,
            acepta_privacidad: true,
            role: "user",
          },
          {
            onConflict: "auth_user_id",
          }
        );

      if (participanteError) {
        setCargando(false);
        setError(participanteError.message);
        return;
      }
    }

    setCargando(false);
    setPassword("");
    setEmailPendienteConfirmacion(emailRegistro);
    setTipoMensajeEspecial("registro");
    setMensaje(
      `Te hemos enviado un email de confirmación a ${emailRegistro}. Revisa tu bandeja de entrada y confirma tu cuenta antes de iniciar sesión.`
    );
    setModo("login");
  }

  async function recuperarPassword() {
    limpiarAvisos();

    if (!email.trim()) {
      setError("Introduce tu email para enviarte el enlace de recuperación.");
      return;
    }

    setCargando(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/login?reset=1`
            : undefined,
      }
    );

    setCargando(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setTipoMensajeEspecial("reset");
    setMensaje("Te hemos enviado un email para recuperar tu contraseña.");
    setModo("login");
  }

  const urlCorreo = obtenerUrlCorreo();

  return (
    <main className="page">
      <section className="card">
        <div className="brandBadge">
          <ShieldCheck size={18} />
          Porra Mundial 2026
        </div>

        <h1>
          {modo === "login" && "Entrar"}
          {modo === "registro" && "Crear cuenta"}
          {modo === "reset" && "Recuperar contraseña"}
        </h1>

        <p className="subtitle">
          {modo === "login" &&
            "Accede para guardar tus pronósticos, ver tus ligas y competir con tus amigos."}
          {modo === "registro" &&
            "Crea tu usuario para participar en ligas privadas de la Porra Mundial."}
          {modo === "reset" &&
            "Introduce tu email y te enviaremos un enlace para recuperar el acceso."}
        </p>

        {mensaje && tipoMensajeEspecial && (
          <div className={`heroNotice ${tipoMensajeEspecial}`}>
            <div className="heroNoticeIcon">
              {tipoMensajeEspecial === "registro" ? (
                <Mail size={24} />
              ) : (
                <CheckCircle2 size={24} />
              )}
            </div>

            <div className="heroNoticeContent">
              <h2>
                {tipoMensajeEspecial === "registro" && "Revisa tu email"}
                {tipoMensajeEspecial === "confirmacion" && "Email confirmado"}
                {tipoMensajeEspecial === "reset" && "Revisa tu correo"}
                {tipoMensajeEspecial === "invitacion" && "Invitación guardada"}
              </h2>

              <p>{mensaje}</p>

              {tipoMensajeEspecial === "registro" && (
                <ul className="noticeSteps">
                  <li>Abre el correo de confirmación.</li>
                  <li>Pulsa el enlace para activar la cuenta.</li>
                  <li>Vuelve aquí e inicia sesión.</li>
                </ul>
              )}

              {tipoMensajeEspecial === "registro" && urlCorreo && (
                <a
                  href={urlCorreo}
                  target="_blank"
                  rel="noreferrer"
                  className="mailShortcut"
                >
                  <Mail size={17} />
                  Abrir mi correo
                </a>
              )}
            </div>
          </div>
        )}

        {modo === "login" && (
          <>
            <button
              type="button"
              className="googleButton"
              onClick={iniciarSesionConGoogle}
              disabled={cargando}
            >
              <span className="googleIcon">G</span>
              Continuar con Google
            </button>

            <div className="divider">
              <span />
              o
              <span />
            </div>
          </>
        )}

        <div className="tabs">
          <button
            type="button"
            className={modo === "login" ? "tab active" : "tab"}
            onClick={() => {
              limpiarAvisos();
              setModo("login");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={modo === "registro" ? "tab active" : "tab"}
            onClick={() => {
              limpiarAvisos();
              setModo("registro");
            }}
          >
            Registro
          </button>
        </div>

        {modo === "registro" && (
          <>
            <label>
              Nombre
              <div className="inputBox">
                <UserPlus size={18} />
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>
            </label>

            <label>
              Apellidos
              <div className="inputBox">
                <UserPlus size={18} />
                <input
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Tus apellidos"
                />
              </div>
            </label>

            <label>
              Nickname
              <div className="inputBox">
                <UserPlus size={18} />
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ej. Garrigt"
                />
              </div>
            </label>
          </>
        )}

        <label>
          Email
          <div className="inputBox">
            <Mail size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>
        </label>

        {modo !== "reset" && (
          <label>
            Contraseña
            <div className="inputBox">
              <Lock size={18} />
              <input
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                autoComplete={modo === "login" ? "current-password" : "new-password"}
              />

              <button
                type="button"
                className="eyeButton"
                onClick={() => setMostrarPassword((actual) => !actual)}
                aria-label={
                  mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
        )}

        {modo === "registro" && (
          <div className="checks">
            <label className="checkRow">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
              />
              Acepto los términos y condiciones.
            </label>

            <label className="checkRow">
              <input
                type="checkbox"
                checked={aceptaPrivacidad}
                onChange={(e) => setAceptaPrivacidad(e.target.checked)}
              />
              Acepto la política de privacidad.
            </label>
          </div>
        )}

        {error && (
          <div className="notice error">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {mensaje && !tipoMensajeEspecial && (
          <div className="notice success">
            <CheckCircle2 size={18} />
            {mensaje}
          </div>
        )}

        {modo === "login" && (
          <button
            type="button"
            className="mainButton"
            onClick={iniciarSesion}
            disabled={cargando}
          >
            {cargando ? <Loader2 className="spin" size={18} /> : <LogIn size={18} />}
            Entrar
          </button>
        )}

        {modo === "registro" && (
          <button
            type="button"
            className="mainButton"
            onClick={registrarUsuario}
            disabled={cargando}
          >
            {cargando ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <UserPlus size={18} />
            )}
            Crear cuenta
          </button>
        )}

        {modo === "reset" && (
          <button
            type="button"
            className="mainButton"
            onClick={recuperarPassword}
            disabled={cargando}
          >
            {cargando ? <Loader2 className="spin" size={18} /> : <Mail size={18} />}
            Enviar email
          </button>
        )}

        <div className="secondaryActions">
          {modo !== "reset" ? (
            <button
              type="button"
              onClick={() => {
                limpiarAvisos();
                setModo("reset");
              }}
            >
              ¿Has olvidado tu contraseña?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                limpiarAvisos();
                setModo("login");
              }}
            >
              Volver al login
            </button>
          )}
        </div>
      </section>

      <style>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 36%),
            linear-gradient(180deg, #020617 0%, #111827 100%);
          color: white;
          padding: 38px 16px 120px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .card {
          width: 100%;
          max-width: 520px;
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background:
            linear-gradient(145deg, rgba(15,23,42,0.96), rgba(15,23,42,0.72));
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.35);
          padding: 28px;
        }

        .brandBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(96, 165, 250, 0.34);
          background: rgba(37, 99, 235, 0.16);
          color: #bfdbfe;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        h1 {
          margin: 18px 0 0;
          font-size: clamp(36px, 9vw, 54px);
          line-height: 0.95;
          letter-spacing: -0.06em;
          font-weight: 950;
        }

        .subtitle {
          color: #cbd5e1;
          margin: 12px 0 22px;
          line-height: 1.55;
          font-weight: 650;
        }

        .heroNotice {
          display: flex;
          gap: 14px;
          border-radius: 22px;
          padding: 16px;
          margin: 0 0 20px;
          border: 1px solid rgba(34,197,94,0.34);
          background:
            radial-gradient(circle at top left, rgba(34,197,94,0.18), transparent 36%),
            rgba(22,101,52,0.14);
          color: #dcfce7;
        }

        .heroNotice.registro,
        .heroNotice.invitacion {
          border-color: rgba(96,165,250,0.34);
          background:
            radial-gradient(circle at top left, rgba(96,165,250,0.18), transparent 36%),
            rgba(37,99,235,0.14);
          color: #dbeafe;
        }

        .heroNotice.reset {
          border-color: rgba(250,204,21,0.30);
          background:
            radial-gradient(circle at top left, rgba(250,204,21,0.16), transparent 36%),
            rgba(113,63,18,0.12);
          color: #fef3c7;
        }

        .heroNoticeIcon {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: rgba(255,255,255,0.10);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .heroNoticeContent {
          min-width: 0;
        }

        .heroNoticeContent h2 {
          margin: 0;
          color: white;
          font-size: 21px;
          line-height: 1.1;
          font-weight: 950;
          letter-spacing: -0.03em;
        }

        .heroNoticeContent p {
          margin: 7px 0 0;
          line-height: 1.5;
          font-weight: 750;
        }

        .noticeSteps {
          margin: 10px 0 0;
          padding-left: 18px;
          color: #bfdbfe;
          line-height: 1.55;
          font-size: 13px;
          font-weight: 800;
        }

        .mailShortcut {
          margin-top: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 14px;
          padding: 11px 13px;
          background: #2563eb;
          color: white;
          text-decoration: none;
          font-weight: 950;
          box-shadow: 0 14px 32px rgba(37,99,235,0.26);
        }

        .googleButton {
          width: 100%;
          border: 1px solid rgba(96, 165, 250, 0.36);
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.82);
          color: white;
          font-weight: 950;
          padding: 14px 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
        }

        .googleButton:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .googleIcon {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: white;
          color: #2563eb;
          font-weight: 950;
          font-family: Arial, sans-serif;
        }

        .divider {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
          color: #94a3b8;
          font-weight: 900;
          margin: 18px 0;
        }

        .divider span {
          height: 1px;
          background: rgba(148, 163, 184, 0.22);
        }

        .tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: rgba(2, 6, 23, 0.72);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 18px;
          padding: 6px;
          margin-bottom: 18px;
        }

        .tab {
          border: none;
          border-radius: 13px;
          background: transparent;
          color: #94a3b8;
          font-weight: 950;
          padding: 12px;
          cursor: pointer;
        }

        .tab.active {
          background: #2563eb;
          color: white;
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.34);
        }

        label {
          display: block;
          color: #dbeafe;
          font-size: 13px;
          font-weight: 900;
          margin-top: 14px;
        }

        .inputBox {
          margin-top: 7px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(2, 6, 23, 0.74);
          padding: 0 13px;
        }

        .inputBox input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: white;
          padding: 14px 0;
          font-weight: 750;
          font-size: 15px;
        }

        .inputBox input::placeholder {
          color: #64748b;
        }

        .eyeButton {
          border: none;
          background: transparent;
          color: #cbd5e1;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .checks {
          margin-top: 14px;
          display: grid;
          gap: 10px;
        }

        .checkRow {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.4;
          margin: 0;
        }

        .checkRow input {
          width: 16px;
          height: 16px;
          accent-color: #2563eb;
        }

        .mainButton {
          margin-top: 18px;
          width: 100%;
          border: none;
          border-radius: 16px;
          background: #2563eb;
          color: white;
          font-weight: 950;
          padding: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 18px 40px rgba(37, 99, 235, 0.32);
        }

        .mainButton:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .secondaryActions {
          margin-top: 16px;
          text-align: center;
        }

        .secondaryActions button {
          border: none;
          background: transparent;
          color: #bfdbfe;
          font-weight: 850;
          cursor: pointer;
        }

        .notice {
          margin-top: 14px;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-weight: 850;
          line-height: 1.45;
        }

        .notice.error {
          background: rgba(239,68,68,0.14);
          border: 1px solid rgba(239,68,68,0.30);
          color: #fca5a5;
        }

        .notice.success {
          background: rgba(22,163,74,0.14);
          border: 1px solid rgba(22,163,74,0.30);
          color: #86efac;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 760px) {
          .page {
            padding: 24px 14px 110px;
          }

          .card {
            padding: 22px;
            border-radius: 26px;
          }

          .heroNotice {
            gap: 12px;
            padding: 14px;
            border-radius: 20px;
          }

          .heroNoticeIcon {
            width: 40px;
            height: 40px;
            border-radius: 14px;
          }

          .heroNoticeContent h2 {
            font-size: 19px;
          }

          .heroNoticeContent p {
            font-size: 14px;
          }

          .mailShortcut {
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .page {
            padding-left: 12px;
            padding-right: 12px;
          }

          .card {
            padding: 18px;
          }

          .heroNotice {
            flex-direction: column;
          }

          h1 {
            font-size: 40px;
          }

          .subtitle {
            font-size: 14px;
          }
        }
      `}</style>
    </main>
  );
}
