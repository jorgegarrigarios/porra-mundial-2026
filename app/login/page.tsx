"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User, Trophy, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { obtenerParticipanteActual } from "@/lib/participante";

type Modo = "login" | "registro" | "recuperar";

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function conTimeout<T>(
  promesa: Promise<T>,
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
    return await Promise.race([promesa, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function esperarSesionReal(intentos = 12, pausaMs = 250) {
  for (let i = 0; i < intentos; i++) {
    const { data, error } = await supabase.auth.getSession();

    if (!error && data.session?.user) {
      return data.session;
    }

    await esperar(pausaMs);
  }

  return null;
}

function traducirErrorAuth(mensaje: string) {
  const texto = mensaje.toLowerCase();

  if (texto.includes("invalid login credentials")) {
    return "Email o contraseña incorrectos.";
  }

  if (texto.includes("email not confirmed")) {
    return "Tu email todavía no está confirmado. Revisa tu correo antes de entrar.";
  }

  if (texto.includes("rate limit")) {
    return "Has hecho demasiados intentos. Espera un momento y vuelve a probar.";
  }

  if (texto.includes("timeout") || texto.includes("tardado demasiado")) {
    return "La conexión ha tardado demasiado. Revisa tu conexión e inténtalo de nuevo.";
  }

  return mensaje || "No se ha podido completar la operación.";
}

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [nickname, setNickname] = useState("");

  const [aceptaLegal, setAceptaLegal] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  function limpiarMensajes() {
    setError("");
    setMensaje("");
  }

  function validarEmailPassword() {
    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado) {
      setError("Introduce tu email.");
      return false;
    }

    if (!emailNormalizado.includes("@")) {
      setError("Introduce un email válido.");
      return false;
    }

    if (modo !== "recuperar" && !password.trim()) {
      setError("Introduce tu contraseña.");
      return false;
    }

    if (modo !== "recuperar" && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }

    return true;
  }

  async function handleLogin() {
    limpiarMensajes();

    if (!validarEmailPassword()) return;

    setLoading(true);

    try {
      const emailNormalizado = email.trim().toLowerCase();

      await supabase.auth.signOut();

      const { data, error: loginError } = await conTimeout(
        supabase.auth.signInWithPassword({
          email: emailNormalizado,
          password,
        }),
        10000,
        "El inicio de sesión ha tardado demasiado."
      );

      if (loginError) {
        setError(traducirErrorAuth(loginError.message));
        return;
      }

      if (!data.user) {
        setError("No se ha podido iniciar sesión. Inténtalo de nuevo.");
        return;
      }

      const session = await esperarSesionReal();

      if (!session?.user) {
        setError(
          "No se ha podido confirmar la sesión. Pulsa de nuevo en Entrar o recarga la página."
        );
        return;
      }

      const participante = await conTimeout(
        obtenerParticipanteActual(),
        10000,
        "La preparación de tu perfil ha tardado demasiado."
      );

      if (!participante) {
        setError(
          "Has iniciado sesión, pero no se ha podido cargar tu perfil de participante. Revisa la tabla participantes/RLS."
        );
        return;
      }

      window.location.href = "/ligas";
    } catch (err) {
      console.error("Error login:", err);

      const mensajeError =
        err instanceof Error
          ? traducirErrorAuth(err.message)
          : "Ha ocurrido un error iniciando sesión. Inténtalo de nuevo.";

      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegistro() {
    limpiarMensajes();

    if (!validarEmailPassword()) return;

    if (!nombre.trim()) {
      setError("Introduce tu nombre.");
      return;
    }

    if (!apellidos.trim()) {
      setError("Introduce tus apellidos.");
      return;
    }

    if (!nickname.trim()) {
      setError("Introduce un nickname.");
      return;
    }

    if (!aceptaLegal) {
      setError("Debes aceptar la política de privacidad y los términos.");
      return;
    }

    setLoading(true);

    try {
      const emailNormalizado = email.trim().toLowerCase();

      const { data, error: registroError } = await conTimeout(
        supabase.auth.signUp({
          email: emailNormalizado,
          password,
          options: {
            data: {
              nombre: nombre.trim(),
              apellidos: apellidos.trim(),
              nickname: nickname.trim(),
            },
          },
        }),
        10000,
        "El registro ha tardado demasiado."
      );

      if (registroError) {
        setError(traducirErrorAuth(registroError.message));
        return;
      }

      if (data.session?.user) {
        const participante = await conTimeout(
          obtenerParticipanteActual(),
          10000,
          "La preparación de tu perfil ha tardado demasiado."
        );

        if (!participante) {
          setError(
            "Cuenta creada, pero no se ha podido preparar tu perfil. Revisa participantes/RLS."
          );
          return;
        }

        window.location.href = "/ligas";
        return;
      }

      setMensaje(
        "Cuenta creada. Revisa tu email para confirmar el registro antes de iniciar sesión."
      );
      setModo("login");
    } catch (err) {
      console.error("Error registro:", err);

      const mensajeError =
        err instanceof Error
          ? traducirErrorAuth(err.message)
          : "Ha ocurrido un error creando la cuenta. Inténtalo de nuevo.";

      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecuperarPassword() {
    limpiarMensajes();

    if (!email.trim()) {
      setError("Introduce tu email.");
      return;
    }

    setLoading(true);

    try {
      const emailNormalizado = email.trim().toLowerCase();

      const { error: recuperarError } = await conTimeout(
        supabase.auth.resetPasswordForEmail(emailNormalizado, {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/login`
              : undefined,
        }),
        10000,
        "La recuperación de contraseña ha tardado demasiado."
      );

      if (recuperarError) {
        setError(traducirErrorAuth(recuperarError.message));
        return;
      }

      setMensaje("Te hemos enviado un email para recuperar la contraseña.");
    } catch (err) {
      console.error("Error recuperación:", err);

      const mensajeError =
        err instanceof Error
          ? traducirErrorAuth(err.message)
          : "Ha ocurrido un error enviando el email de recuperación.";

      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    if (modo === "login") {
      await handleLogin();
      return;
    }

    if (modo === "registro") {
      await handleRegistro();
      return;
    }

    await handleRecuperarPassword();
  }

  async function handleReintentarLogin() {
    if (loading) return;

    if (modo !== "login") {
      setModo("login");
      return;
    }

    await handleLogin();
  }

  const titulo =
    modo === "login"
      ? "Entrar en la porra"
      : modo === "registro"
        ? "Crear cuenta"
        : "Recuperar contraseña";

  const subtitulo =
    modo === "login"
      ? "Accede a tus ligas, pronósticos y rankings privados."
      : modo === "registro"
        ? "Crea tu usuario para competir en la Porra Mundial 2026."
        : "Introduce tu email y te enviaremos un enlace de recuperación.";

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-500/20 border border-blue-400/30 shadow-2xl shadow-blue-500/20">
            <Trophy className="h-8 w-8 text-blue-300" />
          </div>

          <h1 className="text-3xl font-black tracking-tight">{titulo}</h1>
          <p className="mt-3 text-sm text-slate-400">{subtitulo}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur"
        >
          {error && (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="w-full">
                  <p>{error}</p>

                  {modo === "login" && (
                    <button
                      type="button"
                      onClick={handleReintentarLogin}
                      disabled={loading}
                      className="mt-3 rounded-xl bg-red-400/20 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-400/30 disabled:opacity-60"
                    >
                      Reintentar login
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {mensaje && (
            <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {mensaje}
            </div>
          )}

          {modo === "registro" && (
            <>
              <label className="mb-3 block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
                  Nombre
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                  <User className="h-4 w-4 text-slate-500" />
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
                    placeholder="Tu nombre"
                    autoComplete="given-name"
                  />
                </div>
              </label>

              <label className="mb-3 block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
                  Apellidos
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                  <User className="h-4 w-4 text-slate-500" />
                  <input
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
                    placeholder="Tus apellidos"
                    autoComplete="family-name"
                  />
                </div>
              </label>

              <label className="mb-3 block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
                  Nickname
                </span>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                  <Trophy className="h-4 w-4 text-slate-500" />
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
                    placeholder="Ej: Garrigt"
                    autoComplete="nickname"
                  />
                </div>
              </label>
            </>
          )}

          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
              Email
            </span>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
              <Mail className="h-4 w-4 text-slate-500" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
                placeholder="tu@email.com"
                type="email"
                autoComplete="email"
              />
            </div>
          </label>

          {modo !== "recuperar" && (
            <label className="mb-4 block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
                Contraseña
              </span>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <Lock className="h-4 w-4 text-slate-500" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
                  placeholder="Mínimo 6 caracteres"
                  type={mostrarPassword ? "text" : "password"}
                  autoComplete={modo === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((prev) => !prev)}
                  className="text-slate-400 hover:text-white"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {mostrarPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
          )}

          {modo === "registro" && (
            <label className="mb-4 flex items-start gap-3 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={aceptaLegal}
                onChange={(e) => setAceptaLegal(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Acepto la política de privacidad y los términos de uso de la Porra Mundial.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-500/25 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Entrando..."
              : modo === "login"
                ? "Entrar"
                : modo === "registro"
                  ? "Crear cuenta"
                  : "Enviar recuperación"}
          </button>

          <div className="mt-5 flex flex-col gap-2 text-center text-sm">
            {modo !== "login" && (
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setModo("login");
                }}
                className="text-blue-300 hover:text-blue-200"
              >
                Ya tengo cuenta
              </button>
            )}

            {modo !== "registro" && (
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setModo("registro");
                }}
                className="text-slate-300 hover:text-white"
              >
                Crear cuenta nueva
              </button>
            )}

            {modo !== "recuperar" && (
              <button
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setModo("recuperar");
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                He olvidado mi contraseña
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}