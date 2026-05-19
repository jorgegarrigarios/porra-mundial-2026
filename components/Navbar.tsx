"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  Home,
  CalendarDays,
  Target,
  Table2,
  LogIn,
  LogOut,
  Shield,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const links = [
  {
    href: "/",
    label: "Inicio",
    icon: Home,
    public: true,
  },
  {
    href: "/partidos",
    label: "Partidos",
    icon: CalendarDays,
    public: true,
  },
  {
    href: "/mis-pronosticos",
    label: "Pronósticos",
    icon: Target,
    public: false,
  },
  {
    href: "/clasificacion",
    label: "Clasificación",
    icon: Table2,
    public: true,
  },
  {
    href: "/ligas",
    label: "Ligas",
    icon: Users,
    public: true,
  },
  {
    href: "/reglas",
    label: "Reglas",
    icon: Shield,
    public: false,
  },
];

type ParticipanteNavbar = {
  role?: string | null;
  nickname?: string | null;
  nombre?: string | null;
};

function obtenerNombreVisible(
  participante: ParticipanteNavbar | null,
  email?: string | null
) {
  return (
    participante?.nickname?.trim() ||
    participante?.nombre?.trim() ||
    email?.trim() ||
    "Usuario"
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [nombreVisible, setNombreVisible] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const estaLogado = !!nombreVisible;

  const visibleLinks = useMemo(() => {
    return links.filter((link) => link.public || estaLogado);
  }, [estaLogado]);

  useEffect(() => {
    let mounted = true;

    async function cargarUsuario(userId: string, email?: string | null) {
      const { data: participante } = await supabase
        .from("participantes")
        .select("role, nickname, nombre")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (!mounted) return;

      setNombreVisible(obtenerNombreVisible(participante, email));
      setIsAdmin(participante?.role === "admin");
    }

    async function cargarSesion() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        const user = session?.user;

        if (!user) {
          setNombreVisible(null);
          setIsAdmin(false);
          return;
        }

        await cargarUsuario(user.id, user.email);
      } catch (error) {
        console.error("Error cargando sesión navbar:", error);
      }
    }

    cargarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const user = session?.user;

      if (!user) {
        setNombreVisible(null);
        setIsAdmin(false);
        return;
      }

      await cargarUsuario(user.id, user.email);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function cerrarSesion() {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
    }
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <nav className="desktopNav">
        <div className="navInner">
          <Link href="/" className="brand">
            <img
              src="/worldcup-logo.png"
              alt="Mundial 2026"
              className="brandLogo"
            />

            <span>Porra Mundial</span>
          </Link>

          <div className="navLinks">
            {visibleLinks.map((link) => {
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`navLink ${active ? "activeNavLink" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="rightSide">
            {nombreVisible && (
              <div className="userBadge" title={nombreVisible}>
                {nombreVisible}
              </div>
            )}

            {isAdmin && (
              <Link
                href="/admin/ligas"
                className={`adminButton ${
                  pathname.startsWith("/admin") ? "activeAdminButton" : ""
                }`}
              >
                <Shield size={17} />
                Admin
              </Link>
            )}

            {nombreVisible ? (
              <button onClick={cerrarSesion} className="authButton logout">
                <LogOut size={17} />
                Salir
              </button>
            ) : (
              <Link href="/login" className="authButton">
                <LogIn size={17} />
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      <nav
        className="mobileNav"
        style={{
          gridTemplateColumns: `repeat(${visibleLinks.length}, 1fr)`,
        }}
      >
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`mobileLink ${active ? "activeMobileLink" : ""}`}
            >
              <Icon size={22} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mobileTopActions">
        {nombreVisible && (
          <div className="mobileUserBadge" title={nombreVisible}>
            {nombreVisible}
          </div>
        )}

        {isAdmin && (
          <Link
            href="/admin/ligas"
            className={`mobileTopButton ${
              pathname.startsWith("/admin") ? "activeMobileTopButton" : ""
            }`}
          >
            <Shield size={18} />
            Admin
          </Link>
        )}

        {nombreVisible ? (
          <button onClick={cerrarSesion} className="mobileTopButton">
            <LogOut size={18} />
            Salir
          </button>
        ) : (
          <Link href="/login" className="mobileTopButton">
            <LogIn size={18} />
            Login
          </Link>
        )}
      </div>

      <style>{`
        .desktopNav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(2, 6, 23, 0.88);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.10);
        }

        .navInner {
          max-width: 1360px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 36px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          text-decoration: none;
          font-size: 22px;
          font-weight: 900;
          white-space: nowrap;
        }

        .brandLogo {
          width: 34px;
          height: 34px;
          object-fit: contain;
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 800;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 6px;
          border-radius: 999px;
        }

        .navLink {
          color: #cbd5e1;
          text-decoration: none;
          transition: 0.2s ease;
          padding: 10px 16px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .navLink:hover {
          color: white;
          background: rgba(255,255,255,0.08);
        }

        .activeNavLink {
          color: white;
          background: #2563eb;
          box-shadow: 0 0 24px rgba(37,99,235,0.45);
        }

        .rightSide {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-left: 12px;
        }

        .userBadge {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #dbeafe;
          background: rgba(37,99,235,0.14);
          border: 1px solid rgba(96,165,250,0.28);
          border-radius: 999px;
          padding: 0 16px;
          height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 14px;
        }

        .authButton,
        .adminButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          padding: 0 18px;
          height: 52px;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          font-size: 15px;
          box-sizing: border-box;
        }

        .adminButton {
          background: rgba(220,38,38,0.16);
          border: 1px solid rgba(220,38,38,0.36);
          color: #fecaca;
        }

        .activeAdminButton {
          background: #dc2626;
          color: white;
          box-shadow: 0 0 24px rgba(220,38,38,0.45);
        }

        .authButton.logout {
          background: rgba(239,68,68,0.14);
          border: 1px solid rgba(239,68,68,0.28);
        }

        .mobileNav,
        .mobileTopActions {
          display: none;
        }

        @media (max-width: 1080px) {
          .navInner {
            gap: 14px;
          }

          .brand span {
            display: none;
          }

          .navLinks {
            gap: 6px;
            overflow-x: auto;
            scrollbar-width: none;
          }

          .navLinks::-webkit-scrollbar {
            display: none;
          }

          .navLink {
            padding: 10px 12px;
            font-size: 14px;
          }

          .userBadge {
            max-width: 110px;
          }
        }

        @media (max-width: 860px) {
          .desktopNav {
            display: none;
          }

          .mobileNav {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: 12px;
            z-index: 100;
            display: grid;
            gap: 6px;
            padding: 10px;
            border-radius: 24px;
            background: rgba(2, 6, 23, 0.92);
            backdrop-filter: blur(18px);
            border: 1px solid rgba(255,255,255,0.12);
            box-shadow: 0 20px 60px rgba(0,0,0,0.45);
          }

          .mobileLink {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            color: #cbd5e1;
            text-decoration: none;
            font-size: 10px;
            font-weight: 800;
            padding: 8px 4px;
            border-radius: 16px;
            transition: 0.2s ease;
            min-height: 58px;
          }

          .activeMobileLink {
            background: #2563eb;
            color: white;
            box-shadow: 0 0 22px rgba(37,99,235,0.55);
          }

          .mobileTopActions {
            position: fixed;
            top: 12px;
            right: 12px;
            z-index: 101;
            display: flex;
            gap: 8px;
          }

          .mobileUserBadge,
          .mobileTopButton {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: white;
            text-decoration: none;
            background: rgba(2,6,23,0.88);
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 999px;
            padding: 10px 13px;
            font-weight: 900;
            backdrop-filter: blur(18px);
            font-family: inherit;
            font-size: 14px;
          }

          .mobileUserBadge {
            max-width: 105px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .activeMobileTopButton {
            background: #dc2626;
          }

          body {
            padding-bottom: 95px;
          }
        }
      `}</style>
    </>
  );
}