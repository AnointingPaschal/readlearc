import { useState } from "react";
import { Link } from "@/lib/nav";
import { usePathname } from "@/lib/nav";
import {
  Home, Compass, PenLine, Users, User, Shield, Zap,
  BookOpen, LayoutDashboard, Wallet, Play, Plus, FileText, Video, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/",              icon: Home,       label: "Home"    },
  { href: "/explore",       icon: Compass,    label: "Articles" },
  { href: "/videos",        icon: Play,       label: "Videos"  },
  { href: "/write",         icon: PenLine,    label: "Create"  },
  { href: "/profile",       icon: User,       label: "Profile" },
];

const CREATE = [
  { href: "/write",           icon: PenLine,  label: "Write a post",   hint: "Share a quick update with your community" },
  { href: "/write/article",   icon: FileText, label: "Write an article", hint: "Publish a full article on-chain" },
  { href: "/contribute/video", icon: Video,   label: "Upload a video", hint: "Stream and earn from your video" },
];
const cell = (active: boolean): React.CSSProperties => ({
  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 0",
  textDecoration: "none", color: active ? "var(--brand)" : "var(--text-4)", position: "relative", transition: "color .15s", minWidth: 0,
});
const lbl = (active: boolean): React.CSSProperties => ({ fontSize: 10, fontWeight: active ? 700 : 500, lineHeight: 1, fontFamily: "Outfit,sans-serif" });

export default function AppNav() {
  const path     = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const { isAuth, address, isAdmin } = useAuth();

  function isActive(href: string) {
    if (href === "/") return path === "/";
    return path.startsWith(href);
  }

  const profileHref = (isAuth && address) ? `/profile/${address}` : "/wallet-app";

  const items = NAV.map(n => ({
    ...n,
    href: n.href === "/profile" ? profileHref : n.href,
  }));

  // Hide on admin pages — they have their own nav
  if (path.startsWith("/admin")) return null;

  return (
    <>
      {/* ── Mobile bottom bar ────────────────────────────── */}
      {createOpen && (
        <div onClick={() => setCreateOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(0,0,0,.45)", backdropFilter: "blur(3px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", left: 12, right: 12, bottom: "calc(var(--bottom-nav-h,62px) + 12px)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 18, padding: 12, boxShadow: "0 12px 40px rgba(0,0,0,.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px 10px" }}>
              <span style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Create</span>
              <button onClick={() => setCreateOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", display: "flex" }}><X size={18} /></button>
            </div>
            {CREATE.map((c) => (
              <Link key={c.href} href={c.href} onClick={() => setCreateOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 10px", borderRadius: 12, textDecoration: "none", color: "var(--text)" }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,var(--brand),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><c.icon size={18} color="white" /></span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, fontFamily: "Outfit,sans-serif" }}>{c.label}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-4)" }}>{c.hint}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav className="app-bottom-nav" aria-label="Main navigation">
        {/* left */}
        <Link href="/" style={cell(isActive("/"))}><Home size={22} strokeWidth={isActive("/") ? 2.5 : 1.8} /><span style={lbl(isActive("/"))}>Home</span></Link>
        <button type="button" onClick={() => setCreateOpen((v) => !v)} style={{ ...cell(createOpen || isActive("/write") || isActive("/contribute/video")), background: "none", border: "none", cursor: "pointer" }}>
          <Plus size={22} strokeWidth={createOpen ? 2.8 : 2} /><span style={lbl(createOpen || isActive("/write"))}>Create</span>
        </button>
        {/* centre: Articles + Videos on a gradient pill */}
        <div style={{ flex: 2.1, display: "flex", alignItems: "center", justifyContent: "center", padding: "7px 2px" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 18, background: "linear-gradient(135deg,var(--brand),var(--accent))", display: "flex", boxShadow: "0 4px 14px rgba(109,40,217,.3)", padding: 3, gap: 3 }}>
            {[{ href: "/explore", icon: Compass, label: "Articles" }, { href: "/videos", icon: Play, label: "Videos" }].map((n) => {
              const on = isActive(n.href);
              return (
                <Link key={n.href} href={n.href} onClick={() => setCreateOpen(false)}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 15, textDecoration: "none", color: "white", background: on ? "rgba(255,255,255,.24)" : "transparent", transition: "background .15s" }}>
                  <n.icon size={19} strokeWidth={on ? 2.6 : 2} />
                  <span style={{ fontSize: 10, fontWeight: on ? 800 : 600, lineHeight: 1, fontFamily: "Outfit,sans-serif" }}>{n.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        {/* right */}
        <Link href="/wallet-app" style={cell(isActive("/wallet-app"))}><Wallet size={22} strokeWidth={isActive("/wallet-app") ? 2.5 : 1.8} /><span style={lbl(isActive("/wallet-app"))}>Wallet</span></Link>
        <Link href={profileHref} style={cell(isActive("/profile"))}><User size={22} strokeWidth={isActive("/profile") ? 2.5 : 1.8} /><span style={lbl(isActive("/profile"))}>Profile</span></Link>
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
