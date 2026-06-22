"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Compass, PenLine, Users, User, Shield, Zap,
  BookOpen, LayoutDashboard, Wallet,
} from "lucide-react";
import { useAuth } from "../../lib/auth";

const NAV = [
  { href: "/",              icon: Home,       label: "Home"    },
  { href: "/explore",       icon: Compass,    label: "Explore" },
  { href: "/write",         icon: PenLine,    label: "Write"   },
  { href: "/contribute",    icon: Users,      label: "Contribute" },
  { href: "/profile",       icon: User,       label: "Profile" },
];

export default function AppNav() {
  const path     = usePathname();
  const { isAuth, address, isAdmin } = useAuth();

  function isActive(href: string) {
    if (href === "/") return path === "/";
    return path.startsWith(href);
  }

  const profileHref = isAuth && address ? `/profile/${address}` : "/profile";

  const items = NAV.map(n => ({
    ...n,
    href: n.href === "/profile" ? profileHref : n.href,
  }));

  // Hide on admin pages — they have their own nav
  if (path.startsWith("/admin")) return null;

  return (
    <>
      {/* ── Mobile bottom bar ────────────────────────────── */}
      <nav className="app-bottom-nav" aria-label="Main navigation">
        {items.map(n => {
          const active = isActive(n.href);
          return (
            <Link key={n.href} href={n.href}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 4, padding: "6px 0", textDecoration: "none",
                color: active ? "var(--brand)" : "var(--text-4)",
                position: "relative", transition: "color .15s",
              }}>
              {n.href === "/write" ? (
                /* Write button — elevated center */
                <div style={{
                  width: 46, height: 46, borderRadius: "50%",
                  background: active ? "var(--brand)" : "var(--bg-alt)",
                  border: `2px solid ${active ? "var(--brand)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: active ? "0 4px 14px rgba(109,40,217,.35)" : "0 2px 8px rgba(0,0,0,.1)",
                  transition: "all .2s", marginTop: -14,
                }}>
                  <n.icon size={20} color={active ? "white" : "var(--text-3)"} />
                </div>
              ) : (
                <n.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              )}
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, lineHeight: 1, fontFamily: "Outfit,sans-serif" }}>
                {n.label}
              </span>
              {active && n.href !== "/write" && (
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 20, height: 3, borderRadius: "0 0 3px 3px", background: "var(--brand)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Desktop side nav ─────────────────────────────── */}
      <aside className="app-side-nav" aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", marginBottom: 20, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,var(--brand),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={16} color="white" strokeWidth={2.5} />
          </div>
          <span className="sidenav-label" style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: 15, color: "var(--text)", letterSpacing: "-.02em", whiteSpace: "nowrap" }}>Readlearc</span>
        </Link>

        {/* Nav items */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map(n => {
            const active = isActive(n.href);
            return (
              <Link key={n.href} href={n.href}
                style={{
                  display: "flex", alignItems: "center", gap: 11, padding: "10px 14px",
                  borderRadius: "var(--r)", textDecoration: "none", transition: "background .12s",
                  background: active ? "var(--brand-muted)" : "transparent",
                  color: active ? "var(--brand)" : "var(--text-3)",
                }}>
                <n.icon size={18} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                <span className="sidenav-label" style={{ fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: "nowrap" }}>{n.label}</span>
                {active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }} />}
              </Link>
            );
          })}

          {isAdmin && (
            <Link href="/admin"
              style={{
                display: "flex", alignItems: "center", gap: 11, padding: "10px 14px",
                borderRadius: "var(--r)", textDecoration: "none", marginTop: 8,
                background: isActive("/admin") ? "var(--brand-muted)" : "transparent",
                color: isActive("/admin") ? "var(--brand)" : "var(--text-4)",
              }}>
              <Shield size={18} style={{ flexShrink: 0 }} />
              <span className="sidenav-label" style={{ fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>Admin</span>
            </Link>
          )}
        </div>

        {/* Bottom links */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 2 }}>
          <Link href="/creator" style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 14px", borderRadius: "var(--r)", textDecoration: "none", color: "var(--text-4)", background: isActive("/creator") ? "var(--bg-alt)" : "transparent" }}>
            <LayoutDashboard size={17} style={{ flexShrink: 0 }} />
            <span className="sidenav-label" style={{ fontFamily: "Outfit,sans-serif", fontSize: 12, whiteSpace: "nowrap" }}>Creator</span>
          </Link>
          <Link href="/wallet-app" style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 14px", borderRadius: "var(--r)", textDecoration: "none", color: "var(--text-4)", background: isActive("/wallet-app") ? "var(--bg-alt)" : "transparent" }}>
            <Wallet size={17} style={{ flexShrink: 0 }} />
            <span className="sidenav-label" style={{ fontFamily: "Outfit,sans-serif", fontSize: 12, whiteSpace: "nowrap" }}>Wallet</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
