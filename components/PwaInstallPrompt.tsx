"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISSED_KEY = "porra_pwa_install_dismissed";
const INSTALLED_KEY = "porra_pwa_installed";

function estaInstalada() {
  if (typeof window === "undefined") return false;

  const standaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return standaloneMedia || iosStandalone || window.localStorage.getItem(INSTALLED_KEY) === "1";
}

function esIOS() {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const plataforma = window.navigator.platform?.toLowerCase() ?? "";

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (plataforma === "macintel" && window.navigator.maxTouchPoints > 1)
  );
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [instalada, setInstalada] = useState(false);
  const [esDispositivoIOS, setEsDispositivoIOS] = useState(false);

  const puedeInstalar = Boolean(deferredPrompt);
  const mostrarAyudaIOS = esDispositivoIOS && !instalada;

  const titulo = useMemo(() => {
    if (puedeInstalar) return "Instala Porra Mundial";
    if (mostrarAyudaIOS) return "Añade la app al inicio";
    return "";
  }, [puedeInstalar, mostrarAyudaIOS]);

  const texto = useMemo(() => {
    if (puedeInstalar) {
      return "Accede más rápido desde tu móvil, como si fuera una app.";
    }

    if (mostrarAyudaIOS) {
      return "En iPhone: pulsa Compartir y después “Añadir a pantalla de inicio”.";
    }

    return "";
  }, [puedeInstalar, mostrarAyudaIOS]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const yaInstalada = estaInstalada();
    const esIOSActual = esIOS();
    const seDescarto = window.localStorage.getItem(DISMISSED_KEY) === "1";

    setInstalada(yaInstalada);
    setEsDispositivoIOS(esIOSActual);

    if (yaInstalada) {
      setVisible(false);
      return;
    }

    if (esIOSActual && !seDescarto) {
      const timer = window.setTimeout(() => {
        setVisible(true);
      }, 1200);

      return () => window.clearTimeout(timer);
    }

    function manejarBeforeInstallPrompt(event: Event) {
      event.preventDefault();

      const promptEvent = event as BeforeInstallPromptEvent;

      setDeferredPrompt(promptEvent);

      if (window.localStorage.getItem(DISMISSED_KEY) !== "1") {
        setVisible(true);
      } else {
        setMinimizado(true);
      }
    }

    function manejarAppInstalada() {
      window.localStorage.setItem(INSTALLED_KEY, "1");
      setInstalada(true);
      setVisible(false);
      setMinimizado(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", manejarBeforeInstallPrompt);
    window.addEventListener("appinstalled", manejarAppInstalada);

    return () => {
      window.removeEventListener("beforeinstallprompt", manejarBeforeInstallPrompt);
      window.removeEventListener("appinstalled", manejarAppInstalada);
    };
  }, []);

  async function instalar() {
    if (!deferredPrompt) {
      setVisible(true);
      setMinimizado(false);
      return;
    }

    await deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      window.localStorage.setItem(INSTALLED_KEY, "1");
      setInstalada(true);
      setVisible(false);
      setMinimizado(false);
      setDeferredPrompt(null);
      return;
    }

    setVisible(false);
    setMinimizado(true);
  }

  function cerrar() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
    setMinimizado(true);
  }

  if (instalada) return null;

  if (!puedeInstalar && !mostrarAyudaIOS) return null;

  if (minimizado && !visible && puedeInstalar) {
    return (
      <button
        type="button"
        className="pwaMiniButton"
        onClick={() => {
          setVisible(true);
          setMinimizado(false);
        }}
        aria-label="Instalar Porra Mundial"
      >
        <Smartphone size={18} />
        Instalar app

        <style>{`
          .pwaMiniButton {
            position: fixed;
            right: 18px;
            bottom: calc(18px + env(safe-area-inset-bottom));
            z-index: 120;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: 1px solid rgba(96,165,250,0.30);
            border-radius: 999px;
            background: rgba(2,6,23,0.92);
            color: white;
            padding: 12px 15px;
            font-family: inherit;
            font-size: 13px;
            font-weight: 950;
            cursor: pointer;
            box-shadow: 0 18px 50px rgba(0,0,0,0.36);
            backdrop-filter: blur(16px);
          }

          @media (max-width: 860px) {
            .pwaMiniButton {
              left: 18px;
              right: 18px;
              bottom: calc(104px + env(safe-area-inset-bottom));
            }
          }
        `}</style>
      </button>
    );
  }

  if (!visible) return null;

  return (
    <aside className="pwaPrompt" role="dialog" aria-label="Instalar aplicación">
      <button
        type="button"
        className="pwaClose"
        onClick={cerrar}
        aria-label="Cerrar aviso de instalación"
      >
        <X size={17} />
      </button>

      <div className="pwaIcon">
        <Smartphone size={25} />
      </div>

      <div className="pwaContent">
        <strong>{titulo}</strong>
        <p>{texto}</p>

        {mostrarAyudaIOS && !puedeInstalar && (
          <small>
            Safari no permite instalar automáticamente. Debes hacerlo desde el menú
            de compartir del navegador.
          </small>
        )}
      </div>

      {puedeInstalar && (
        <button type="button" className="pwaInstallButton" onClick={instalar}>
          <Download size={17} />
          Instalar
        </button>
      )}

      {mostrarAyudaIOS && !puedeInstalar && (
        <button type="button" className="pwaInstallButton" onClick={cerrar}>
          Entendido
        </button>
      )}

      <style>{`
        .pwaPrompt {
          position: fixed;
          right: 18px;
          bottom: calc(18px + env(safe-area-inset-bottom));
          z-index: 120;
          width: min(420px, calc(100vw - 36px));
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 14px;
          align-items: center;
          border-radius: 24px;
          border: 1px solid rgba(96,165,250,0.30);
          background:
            radial-gradient(circle at top left, rgba(37,99,235,0.22), transparent 38%),
            rgba(2,6,23,0.94);
          box-shadow: 0 26px 80px rgba(0,0,0,0.42);
          color: white;
          padding: 16px;
          backdrop-filter: blur(18px);
        }

        .pwaClose {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          color: #cbd5e1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .pwaIcon {
          width: 48px;
          height: 48px;
          border-radius: 18px;
          background: rgba(37,99,235,0.22);
          border: 1px solid rgba(96,165,250,0.26);
          color: #bfdbfe;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pwaContent {
          min-width: 0;
          padding-right: 14px;
        }

        .pwaContent strong {
          display: block;
          font-size: 16px;
          line-height: 1.15;
          font-weight: 950;
        }

        .pwaContent p {
          margin: 5px 0 0;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 750;
        }

        .pwaContent small {
          display: block;
          margin-top: 7px;
          color: #93c5fd;
          font-size: 12px;
          line-height: 1.45;
          font-weight: 750;
        }

        .pwaInstallButton {
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          padding: 12px 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 14px 34px rgba(37,99,235,0.30);
        }

        @media (max-width: 860px) {
          .pwaPrompt {
            left: 14px;
            right: 14px;
            bottom: calc(104px + env(safe-area-inset-bottom));
            width: auto;
            grid-template-columns: auto 1fr;
          }

          .pwaInstallButton {
            grid-column: 1 / -1;
            width: 100%;
          }
        }

        @media (max-width: 420px) {
          .pwaPrompt {
            border-radius: 22px;
            padding: 14px;
          }

          .pwaIcon {
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
    </aside>
  );
}
