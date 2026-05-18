"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  Home,
  CalendarDays,
  Target,
  Trophy,
  Table2,
  LogIn,
  LogOut,
  Shield,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const links = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/partidos", label: "Partidos", icon: CalendarDays },
  { href: "/mis-pronosticos", label: "Pronósticos", icon: Target },
  { href: "/clasificacion", label: "Clasificación", icon: Table2 },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/ligas", label: "Ligas", icon: Users },
  { href: "/reglas", label: "Reglas", icon: Shield },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function cargarSesion() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        const user = session?.user;

        setEmail(user?.email ?? null);

        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data: participante } = await supabase
          .from("participantes")
          .select("role")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!mounted) return;

        setIsAdmin(participante?.role === "admin");
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

      setEmail(user?.email ?? null);

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: participante } = await supabase
        .from("participantes")
        .select("role")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      setIsAdmin(participante?.role === "admin");
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
            {links.map((link) => {
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
            {isAdmin && (
              <Link
                href="/admin/ligas"
                className={`adminButton ${
                  pathname.startsWith("/admin")
                    ? "activeAdminButton"
                    : ""
                }`}
              >
                <Shield size={17} />
                Admin
              </Link>
            )}

            {email ? (
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

      <nav className="mobileNav">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`mobileLink ${
                active ? "activeMobileLink" : ""
              }`}
            >
              <Icon size={22} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mobileTopActions">
        {isAdmin && (
          <Link
            href="/admin/ligas"
            className={`mobileTopButton ${
              pathname.startsWith("/admin")
                ? "activeMobileTopButton"
                : ""
            }`}
          >
            <Shield size={18} />
            Admin
          </Link>
        )}

        {email ? (
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
          max-width: 1280px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
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
          gap: 10px;
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
            grid-template-columns: repeat(7, 1fr);
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

          .activeMobileTopButton {
            background: #dc2626;
            border-color: rgba(220,38,38,0.55);
            box-shadow: 0 0 22px rgba(220,38,38,0.45);
          }
        }
      `}</style>
    </>
  );
}