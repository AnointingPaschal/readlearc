"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, LayoutDashboard, Settings, Palette, Search, Bot, Server, Cpu, FileText, BookOpen,
  Flag, Users, PenTool, UserCheck, Shield, DollarSign, Percent, CreditCard,
  FileCode, Lock, ScrollText, Bell, ChevronRight, LogOut, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../lib/theme";
import { Sun, Moon } from "lucide-react";

const NAV_GROUPS = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Site", items: [
    { href: "/admin/site", label: "General", icon: Settings },
    { href: "/admin/site/branding", label: "Branding", icon: Palette },
    { href: "/admin/site/theme", label: "Theme", icon: Cpu },
    { href: "/admin/site/seo", label: "SEO", icon: Search },
  ]},
  { label: "AI", items: [
    { href: "/admin/ai", label: "Overview", icon: Bot },
    { href: "/admin/ai/providers", label: "Providers", icon: Server },
    { href: "/admin/ai/models", label: "Models", icon: Cpu },
    { href: "/admin/ai/prompts", label: "Prompts", icon: FileText },
  ]},
  { label: "Content", items: [
    { href: "/admin/content", label: "Overview", icon: BookOpen },
    { href: "/admin/content/articles", label: "Articles", icon: FileText },
    { href: "/admin/content/moderation", label: "Moderation", icon: Flag },
  ]},
  { label: "Users", items: [
    { href: "/admin/users", label: "Overview", icon: Users },
    { href: "/admin/users/writers", label: "Writers", icon: PenTool },
    { href: "/admin/users/readers", label: "Readers", icon: UserCheck },
  ]},
  { label: "Finance", items: [
    { href: "/admin/finance", label: "Overview", icon: DollarSign },
    { href: "/admin/finance/fees", label: "Fees", icon: Percent },
    { href: "/admin/finance/payouts", label: "Payouts", icon: CreditCard },
    { href: "/admin/finance/contracts", label: "Contracts", icon: FileCode },
  ]},
  { label: "System", items: [
    { href: "/admin/security", label: "Security", icon: Lock },
    { href: "/admin/logs", label: "Logs", icon: ScrollText },
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>
      <style>{`
        @media (min-width: 1024px) { .admin-overlay { display: none !important; } }
        @media (max-width: 1023px) { .admin-sidebar-inner { transform: translateX(-100%) !important; } .admin-sidebar-inner.open { transform: translateX(0) !important; } }
      `}</style>

      {/* Sidebar */}
      <aside className={`admin-sidebar-inner ${sidebarOpen ? "open" : ""}`} style={{
        position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50,
        width: 224, display: "flex", flexDirection: "column",
        background: "var(--bg-card)", borderRight: "1px solid var(--border)",
        transition: "transform 0.25s ease",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px", height: 60, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, var(--brand), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 14, color: "var(--text)" }}>Readlearc</div>
            <div style={{ fontSize: 10, color: "var(--text-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Admin</div>
          </div>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", display: "none" }} className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px", marginBottom: 4 }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 10px", borderRadius: "var(--radius-sm)",
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    color: active ? "var(--brand)" : "var(--text-3)",
                    background: active ? "var(--brand-muted)" : "transparent",
                    border: active ? "1px solid var(--border-brand)" : "1px solid transparent",
                    textDecoration: "none", transition: "all 0.12s", marginBottom: 1,
                  }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-alt)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; } }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-3)"; } }}
                  >
                    <item.icon size={14} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {active && <ChevronRight size={12} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--accent))", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Super Admin</div>
              <div style={{ fontSize: 10, color: "var(--text-4)" }}>admin@readlearc.io</div>
            </div>
          </div>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--text-4)", textDecoration: "none", transition: "all 0.12s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-alt)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
          >
            <LogOut size={13} /> Exit Admin
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="admin-overlay" onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }} />
      )}

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 224, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30, height: 60,
          background: "var(--nav-bg)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "none", padding: 4 }}>
              <Menu size={20} />
            </button>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              {pathname.split("/").filter(Boolean).map((seg, i, arr) => (
                <span key={seg} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {i > 0 && <ChevronRight size={12} style={{ color: "var(--text-4)" }} />}
                  <span style={{ color: i === arr.length - 1 ? "var(--text)" : "var(--text-4)", fontWeight: i === arr.length - 1 ? 600 : 400, textTransform: "capitalize" }}>
                    {seg}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="badge badge-accent" style={{ fontSize: 10 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "rl-pulse 2s infinite" }} />
              Arc Testnet · Live
            </span>
            <button onClick={toggle} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg-alt)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button style={{ position: "relative", width: 32, height: 32, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg-alt)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
              <Bell size={13} />
              <span style={{ position: "absolute", top: -2, right: -2, width: 14, height: 14, background: "#ef4444", borderRadius: "50%", fontSize: 8, color: "white", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg-card)" }}>2</span>
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: "24px 20px", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
      <style>{`@keyframes rl-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </div>
  );
}
