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
  ScrollText,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  obtenerNombreVisibleParticipante,
  obtenerParticipanteActual,
} from "@/lib/participante";

const links = [
  { href: "/", label: "Inicio", icon: Home, public: true },
  { href: "/partidos", label: "Partidos", icon: CalendarDays, public: true },
  { href: "/mis-pronosticos", label: "Pronósticos", icon: Target, public: false },
  { href: "/clasificacion", label: "Clasificación", icon: Table2, public: true },
  { href: "/ligas", label: "Ligas", icon: Users, public: true },
];

type LigaNavbar = {
  id: number;
  liga_id?: number;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [haySesion, setHaySesion] = useState(false);
  const [nombreVisible, setNombreVisible] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [alertasAdmin, setAlertasAdmin] = useState(0);
  const [reglasHref, setReglasHref] = useState<string | null>(null);

  const visibleLinks = useMemo(() => {
    const enlaces = links.filter((link) => link.public || haySesion);

    if (haySesion && reglasHref) {
      enlaces.push({
        href: reglasHref,
        label: "Reglas",
        icon: ScrollText,
        public: false,
      });
    }

    return enlaces;
  }, [haySesion, reglasHref]);


  async function cargarRutaReglasUsuario(participanteId: number) {
    try {
      const { data, error } = await supabase
        .from("liga_participantes")
        .select("liga_id")
        .eq("participante_id", participanteId)
        .limit(1);

      if (error || !data || data.length === 0) {
        setReglasHref(null);
        return;
      }

      const ligas = data as LigaNavbar[];
      const primeraLigaId = ligas[0]?.liga_id;

      if (!primeraLigaId) {
        setReglasHref(null);
        return;
      }

      setReglasHref(`/ligas/${primeraLigaId}/reglas`);
    } catch {
      setReglasHref(null);
    }
  }

  
  async function cargarAlertasAdmin() {
    try {
      const ahora = new Date().toISOString();

      const [ligasPendientes, partidosPendientes, ligasActivasRes, relacionesRes, pagosRes] =
        await Promise.all([
          supabase
            .from("ligas")
            .select("*", { count: "exact", head: true })
            .eq("estado", "pendiente"),
          supabase
            .from("partidos")
            .select("*", { count: "exact", head: true })
            .lte("fecha_inicio", ahora)
            .is("resultado_local", null),
          supabase
            .from("ligas")
            .select("id")
            .eq("estado", "activa"),
          supabase
            .from("liga_participantes")
            .select("liga_id, participante_id"),
          supabase
            .from("liga_pagos")
            .select("liga_id, participante_id, pagado"),
        ]);

      const ligasActivasIds = new Set(
        (ligasActivasRes.data ?? []).map((liga) => liga.id)
      );

      const miembrosActivos = (relacionesRes.data ?? []).filter((row) =>
        ligasActivasIds.has(row.liga_id)
      );

      const pagosConfirmados = new Set<string>();

      (pagosRes.data ?? []).forEach((pago) => {
        if (!ligasActivasIds.has(pago.liga_id)) return;
        if (!pago.pagado) return;

        pagosConfirmados.add(`${pago.liga_id}:${pago.participante_id}`);
      });

      const pagosPendientesReales = miembrosActivos.filter((miembro) => {
        const clave = `${miembro.liga_id}:${miembro.participante_id}`;
        return !pagosConfirmados.has(clave);
      }).length;

      const totalAlertas =
        (ligasPendientes.count ?? 0) +
        (partidosPendientes.count ?? 0) +
        pagosPendientesReales;

      setAlertasAdmin(totalAlertas);
    } catch {
      setAlertasAdmin(0);
    }
  }


  useEffect(() => {
    let mounted = true;

    async function aplicarSesion(
      session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]
    ) {
      if (!mounted) return;

      const user = session?.user;

      if (!user) {
        setHaySesion(false);
        setNombreVisible(null);
        setIsAdmin(false);
        setAlertasAdmin(0);
        setReglasHref(null);
        return;
      }

      setHaySesion(true);

      try {
        const participante = await obtenerParticipanteActual();

        if (!mounted) return;

        if (participante) {
          setNombreVisible(
            obtenerNombreVisibleParticipante(participante, user.email)
          );
          setIsAdmin(participante.role === "admin");
          await cargarRutaReglasUsuario(participante.id);
          if (participante.role === "admin") {
            await cargarAlertasAdmin();
          }
        } else {
          setNombreVisible(user.email || "Usuario");
          setIsAdmin(false);
          setReglasHref(null);
        }
      } catch {
        if (!mounted) return;

        setNombreVisible(user.email || "Usuario");
        setIsAdmin(false);
        setReglasHref(null);
      }
    }

    async function cargarUsuarioDesdeSesion() {
      try {
        const { data } = await supabase.auth.getSession();
        await aplicarSesion(data.session);
      } catch {
        if (!mounted) return;

        setHaySesion(false);
        setNombreVisible(null);
        setIsAdmin(false);
        setReglasHref(null);
      }
    }

    cargarUsuarioDesdeSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      aplicarSesion(session);
    });

    const ligasChannel = supabase
      .channel("admin-alertas-ligas-navbar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ligas" },
        () => {
          cargarAlertasAdmin();
        }
      )
      .subscribe();

    const partidosChannel = supabase
      .channel("admin-alertas-partidos-navbar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partidos" },
        () => {
          cargarAlertasAdmin();
        }
      )
      .subscribe();

    const pagosChannel = supabase
      .channel("admin-alertas-pagos-navbar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "liga_pagos" },
        () => {
          cargarAlertasAdmin();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(ligasChannel);
      supabase.removeChannel(partidosChannel);
      supabase.removeChannel(pagosChannel);
    };
  }, []);

  async function cerrarSesion() {
    try {
      await supabase.auth.signOut();
      setHaySesion(false);
      setNombreVisible(null);
      setIsAdmin(false);
      setReglasHref(null);
    } finally {
      router.replace("/login");
      router.refresh();
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
            {haySesion && nombreVisible && (
              <div className="userBadge" title={nombreVisible}>
                {nombreVisible}
              </div>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className={`adminButton ${
                  pathname.startsWith("/admin") ? "activeAdminButton" : ""
                }`}
              >
                <Shield size={17} />
                Admin
                {alertasAdmin > 0 && (
                  <span className="adminAlertBadge">{alertasAdmin}</span>
                )}
              </Link>
            )}

            {haySesion ? (
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

      <header className="mobileHeader">
        <Link href="/" className="mobileBrand" aria-label="Ir al inicio">
          <img
            src="/worldcup-logo.png"
            alt="Mundial 2026"
            className="mobileBrandLogo"
          />
          <span>Porra Mundial</span>
        </Link>

        <div className="mobileTopActions">
          {haySesion && nombreVisible && (
            <div className="mobileUserBadge" title={nombreVisible}>
              {nombreVisible}
            </div>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className={`mobileTopButton ${
                pathname.startsWith("/admin") ? "activeMobileTopButton" : ""
              }`}
              aria-label="Administración"
            >
              <Shield size={17} />
              <span className="mobileTopButtonText">Admin</span>
              {alertasAdmin > 0 && (
                <span className="adminAlertBadge mobile">{alertasAdmin}</span>
              )}
            </Link>
          )}

          {haySesion ? (
            <button onClick={cerrarSesion} className="mobileTopButton">
              <LogOut size={17} />
              <span className="mobileTopButtonText">Salir</span>
            </button>
          ) : (
            <Link href="/login" className="mobileTopButton">
              <LogIn size={17} />
              <span className="mobileTopButtonText">Login</span>
            </Link>
          )}
        </div>
      </header>

      <nav
        className="mobileNav"
        style={{
          gridTemplateColumns: `repeat(${visibleLinks.length}, minmax(0, 1fr))`,
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
              <Icon size={21} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        .desktopNav {
          position: sticky;
          top: 0;
          z-index: 100;
          height: 82px;
          background: rgba(2, 6, 23, 0.92);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.10);
          display: flex;
          align-items: center;
        }

        .navInner {
          width: 100%;
          max-width: 1480px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: minmax(240px, 1fr) auto minmax(240px, 1fr);
          align-items: center;
          gap: 22px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          text-decoration: none;
          font-size: 25px;
          font-weight: 950;
          white-space: nowrap;
          min-width: 0;
        }

        .brandLogo {
          width: 38px;
          height: 38px;
          object-fit: contain;
          flex: 0 0 auto;
        }

        .navLinks {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 900;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.10);
          padding: 7px;
          border-radius: 999px;
          min-width: 0;
        }

        .navLink {
          color: #cbd5e1;
          text-decoration: none;
          transition: 0.2s ease;
          padding: 11px 18px;
          border-radius: 999px;
          white-space: nowrap;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
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
          justify-content: flex-end;
          gap: 12px;
          min-width: 0;
        }

        .userBadge {
          max-width: 180px;
          min-width: 92px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #dbeafe;
          background: rgba(37,99,235,0.14);
          border: 1px solid rgba(96,165,250,0.28);
          border-radius: 999px;
          padding: 0 16px;
          height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 14px;
          line-height: 1;
          box-sizing: border-box;
        }

        .authButton,
        .adminButton {
          height: 46px;
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
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          font-size: 15px;
          line-height: 1;
          box-sizing: border-box;
        }

        .adminButton {
          background: rgba(220,38,38,0.16);
          border: 1px solid rgba(220,38,38,0.36);
          color: #fecaca;
        }

        
        .adminAlertBadge{
          min-width:22px;
          height:22px;
          border-radius:999px;
          background:#ef4444;
          color:white;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding:0 6px;
          font-size:12px;
          font-weight:950;
          box-shadow:0 0 18px rgba(239,68,68,.45);
        }

        .adminAlertBadge.mobile{
          min-width:18px;
          height:18px;
          font-size:10px;
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

        .authButton.logout:hover,
        .authButton:hover,
        .adminButton:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .mobileHeader,
        .mobileNav {
          display: none;
        }

        @media (max-width: 1220px) {
          .navInner {
            grid-template-columns: auto 1fr auto;
            gap: 14px;
          }

          .brand span {
            display: none;
          }

          .navLinks {
            justify-content: flex-start;
            overflow-x: auto;
            scrollbar-width: none;
          }

          .navLinks::-webkit-scrollbar {
            display: none;
          }

          .navLink {
            padding: 11px 14px;
            font-size: 14px;
          }

          .userBadge {
            max-width: 130px;
          }

          .authButton,
          .adminButton {
            padding: 0 15px;
          }
        }

        @media (max-width: 860px) {
          .desktopNav {
            display: none;
          }

          .mobileHeader {
            position: sticky;
            top: 0;
            z-index: 100;
            min-height: 72px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: calc(10px + env(safe-area-inset-top)) 14px 10px;
            background: rgba(2, 6, 23, 0.94);
            backdrop-filter: blur(18px);
            border-bottom: 1px solid rgba(255,255,255,0.10);
            box-sizing: border-box;
          }

          .mobileBrand {
            min-width: 0;
            display: inline-flex;
            align-items: center;
            gap: 9px;
            color: white;
            text-decoration: none;
            font-size: 16px;
            font-weight: 950;
            line-height: 1;
          }

          .mobileBrandLogo {
            width: 34px;
            height: 34px;
            object-fit: contain;
            flex: 0 0 auto;
          }

          .mobileBrand span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .mobileTopActions {
            min-width: 0;
            display: flex;
            gap: 7px;
            align-items: center;
            justify-content: flex-end;
            flex: 0 1 auto;
          }

          .mobileUserBadge,
          .mobileTopButton {
            min-height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            color: white;
            text-decoration: none;
            background: rgba(15,23,42,0.94);
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 999px;
            padding: 0 12px;
            font-weight: 900;
            backdrop-filter: blur(18px);
            font-family: inherit;
            font-size: 13px;
            cursor: pointer;
            line-height: 1;
            box-sizing: border-box;
            white-space: nowrap;
          }

          .mobileUserBadge {
            max-width: 104px;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #dbeafe;
            background: rgba(37,99,235,0.16);
            border-color: rgba(96,165,250,0.3);
          }

          .activeMobileTopButton {
            background: #dc2626;
          }

          .mobileNav {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: calc(12px + env(safe-area-inset-bottom));
            z-index: 100;
            display: grid;
            gap: 6px;
            padding: 9px;
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
            font-weight: 850;
            padding: 8px 3px;
            border-radius: 16px;
            transition: 0.2s ease;
            min-height: 56px;
            min-width: 0;
          }

          .mobileLink span {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .activeMobileLink {
            background: #2563eb;
            color: white;
            box-shadow: 0 0 22px rgba(37,99,235,0.55);
          }

          body {
            padding-bottom: calc(104px + env(safe-area-inset-bottom));
          }
        }

        @media (max-width: 430px) {
          .mobileHeader {
            padding-left: 10px;
            padding-right: 10px;
          }

          .mobileBrand span {
            display: none;
          }

          .mobileUserBadge {
            max-width: 92px;
          }

          .mobileTopButton {
            padding: 0 10px;
          }

          .mobileTopButtonText {
            display: none;
          }
        }

        @media (max-width: 360px) {
          .mobileUserBadge {
            max-width: 76px;
          }

          .mobileTopButton {
            width: 40px;
            padding: 0;
          }
        }
      `}</style>
    </>
  );
}
