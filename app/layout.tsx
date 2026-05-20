import type { Metadata, Viewport } from "next";
import "./globals.css";

import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://porra-mundial-2026-six.vercel.app"),
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
    url: "https://porra-mundial-2026-six.vercel.app",
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
          background: "#020617",
          color: "white",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <Navbar />

        <main>{children}</main>
      </body>
    </html>
  );
}