import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

import Navbar from "@/components/Navbar";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.porrafutbol.futbol"),
  title: {
    default: "Porra Mundial 2026",
    template: "%s | Porra Mundial 2026",
  },
  description:
    "Crea ligas privadas, invita a tus amigos y compite con tus pronósticos en la Porra Mundial 2026.",
  applicationName: "Porra Mundial 2026",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Porra Mundial",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Porra Mundial 2026",
    description:
      "Crea ligas privadas, invita a tus amigos y compite con tus pronósticos en la Porra Mundial 2026.",
    url: "https://www.porrafutbol.futbol",
    siteName: "Porra Mundial 2026",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Porra Mundial 2026",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          background: "#020617",
          color: "white",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <Navbar />
        <PwaInstallPrompt />

        <main
          style={{
            minHeight: "100vh",
          }}
        >
          {children}
        </main>

        <footer className="globalFooter">
          <div className="globalFooterInner">
            <div className="footerBrand">
              <strong>Porra Mundial 2026</strong>
              <span>Compite con tus amigos en ligas privadas.</span>
            </div>

            <nav className="footerLinks" aria-label="Enlaces legales y soporte">
              <Link href="/aviso-legal">Aviso legal</Link>
              <Link href="/privacidad">Privacidad</Link>
              <Link href="/terminos">Términos</Link>
              <Link href="/soporte">Soporte</Link>
            </nav>
          </div>

          <div className="footerBottom">
            © 2026 Porra Mundial. Todos los derechos reservados.
          </div>
        </footer>

        <style>{`
          .globalFooter {
            border-top: 1px solid rgba(255,255,255,0.10);
            background:
              radial-gradient(circle at 50% 0%, rgba(37,99,235,0.10), transparent 34%),
              rgba(2,6,23,0.96);
            color: #94a3b8;
            padding: 28px 20px calc(34px + env(safe-area-inset-bottom));
          }

          .globalFooterInner {
            width: 100%;
            max-width: 1280px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
          }

          .footerBrand {
            display: flex;
            flex-direction: column;
            gap: 5px;
            min-width: 0;
          }

          .footerBrand strong {
            color: white;
            font-size: 15px;
            font-weight: 950;
          }

          .footerBrand span {
            color: #94a3b8;
            font-size: 13px;
            line-height: 1.4;
            font-weight: 700;
          }

          .footerLinks {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            flex-wrap: wrap;
            gap: 10px 16px;
          }

          .footerLinks a {
            color: #bfdbfe;
            text-decoration: none;
            font-size: 13px;
            font-weight: 850;
            transition: color 0.18s ease, opacity 0.18s ease;
          }

          .footerLinks a:hover {
            color: white;
          }

          .footerBottom {
            width: 100%;
            max-width: 1280px;
            margin: 18px auto 0;
            padding-top: 16px;
            border-top: 1px solid rgba(255,255,255,0.07);
            color: #64748b;
            font-size: 12px;
            font-weight: 750;
          }

          @media (max-width: 860px) {
            .globalFooter {
              padding: 24px 16px calc(118px + env(safe-area-inset-bottom));
            }

            .globalFooterInner {
              flex-direction: column;
              align-items: flex-start;
              gap: 18px;
            }

            .footerLinks {
              justify-content: flex-start;
            }

            .footerBottom {
              margin-top: 16px;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
