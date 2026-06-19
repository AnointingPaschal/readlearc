"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, LayoutDashboard, Settings, Palette, Search, Bot, Server, Cpu, FileText, BookOpen,
  Flag, Users, PenTool, UserCheck, Shield, DollarSign, Percent, CreditCard,
  FileCode, Lock, ScrollText, Bell, ChevronRight, LogOut, Menu, X, Sun, Moon,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../lib/theme";

const NAV_GROUPS = [
  { label: "Overview", items: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { label: "Site", items: [
    { href: "/admin/site",          label: "General",  icon: Settings },
    { href: "/admin/site/branding", label: "Branding", icon: Palette  },
    { href: "/admin/site/theme",    label: "Theme",    icon: Cpu      },
    { href: "/admin/site/seo",      label: "SEO",      icon: Search   },
  ]},
  { label: "AI", items: [
    { href: "/admin/ai",            label: "Overview",  icon: Bot      },
    { href: "/admin/ai/providers",  label: "Providers", icon: Server   },
    { href: "/admin/ai/models",     label: "Models",    icon: Cpu      },
    { href: "/admin/ai/prompts",    label: "Prompts",   icon: FileText },
  ]},
  { label: "Content", items: [
    { href: "/admin/content",             label: "Overview",   icon: BookOpen },
    { href: "/admin/content/articles",    label: "Articles",   icon: FileText },
    { href: "/admin/content/moderation",  label: "Moderation", icon: Flag     },
  ]},
  { label: "Users", items: [
    { href: "/admin/users",         label: "Overview", icon: Users     },
    { href: "/admin/users/writers", label: "Writers",  icon: PenTool   },
    { href: "/admin/users/readers", label: "Readers",  icon: UserCheck },
  ]},
  { label: "Finance", items: [
    { href: "/admin/finance",           label: "Overview",  icon: DollarSign },
    { href: "/admin/finance/fees",      label: "Fees",      icon: Percent    },
    { href: "/admin/finance/payouts",   label: "Payouts",   icon: CreditCard },
    { href: "/admin/finance/contracts", label: "Contracts", icon: FileCode   },
  ]},
  { label: "System", items: [
    { href: "/admin/security",      label: "Security",      icon: Lock       },
    { href: "/admin/logs",          label: "Logs",          icon: ScrollText },
    { href: "/admin/notifications", label: "Notifications", icon: Bell       },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const crumbs = pathname.split("/").filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex" }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`admin-sidebar-inner${sidebarOpen ? " open" : ""}`}
        style={{
          position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 60,
          width: 220, display: "flex", flexDirection: "column",
          background: "var(--bg-card)", borderRight: "1px solid var(--border)",
          transition: "transform 0.25s ease",
        }}
      >
        {/* Sidebar logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0 14px", height: 60,
          borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, var(--brand), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={14} color="white" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 14, color: "var(--text)" }}>Readlearc</div>
            <div style={{ fontSize: 9, color: "var(--text-4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Admin Panel</div>
          </div>
          {/* Close btn — mobile only via CSS */}
          <button
            className="admin-close-btn"
            onClick={() => setSidebarOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-4)", padding: 4, borderRadius: 6, alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: 18 }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: "var(--text-4)",
                textTransform: "uppercase", letterSpacing: "0.09em",
                padding: "0 8px", marginBottom: 4,
              }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 10px", borderRadius: "var(--radius-sm)",
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      color: active ? "var(--brand)" : "var(--text-3)",
                      background: active ? "var(--brand-muted)" : "transparent",
                      border: `1px solid ${active ? "var(--border-brand)" : "transparent"}`,
                      textDecoration: "none", transition: "all 0.12s", marginBottom: 1,
                    }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-alt)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; } }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-3)"; } }}
                  >
                    <item.icon size={13} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {active && <ChevronRight size={11} style={{ opacity: 0.5 }} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 2 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--accent))", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Super Admin</div>
              <div style={{ fontSize: 10, color: "var(--text-4)" }}>owner wallet</div>
            </div>
          </div>
          <Link
            href="/"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 10px", borderRadius: "var(--radius-sm)",
              fontSize: 12, color: "var(--text-4)", textDecoration: "none",
              transition: "all 0.12s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-alt)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-4)"; }}
          >
            <LogOut size={13} /> Exit Admin
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, backdropFilter: "blur(2px)" }}
        />
      )}

      {/* ── Main column ─────────────────────────────────────── */}
      <div className="admin-main">

        {/* Top bar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30, height: 60,
          background: "var(--nav-bg)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", gap: 12, flexShrink: 0,
        }}>
          {/* Left: hamburger + breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {/* Hamburger — mobile only via CSS */}
            <button
              className="admin-menu-btn"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none", border: "1.5px solid var(--border)",
                borderRadius: "var(--radius-sm)", cursor: "pointer",
                color: "var(--text-3)", padding: 6, flexShrink: 0,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Menu size={17} />
            </button>

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, overflow: "hidden" }}>
              {crumbs.map((seg, i) => (
                <span key={`${seg}-${i}`} style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                  {i > 0 && <ChevronRight size={11} style={{ color: "var(--text-4)", flexShrink: 0 }} />}
                  <span style={{
                    color: i === crumbs.length - 1 ? "var(--text)" : "var(--text-4)",
                    fontWeight: i === crumbs.length - 1 ? 600 : 400,
                    textTransform: "capitalize",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {seg}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Right: status + controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 10, fontWeight: 700, color: "var(--accent)",
              background: "rgba(5,150,105,0.08)",
              border: "1px solid rgba(5,150,105,0.2)",
              padding: "4px 10px", borderRadius: "var(--radius-full)",
              whiteSpace: "nowrap",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "rl-pulse 2s infinite" }} />
              Live
            </span>
            <button onClick={toggle} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg-alt)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", flexShrink: 0 }}>
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button style={{ position: "relative", width: 32, height: 32, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--bg-alt)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", flexShrink: 0 }}>
              <Bell size={13} />
              <span style={{ position: "absolute", top: -2, right: -2, width: 13, height: 13, background: "#ef4444", borderRadius: "50%", fontSize: 7, color: "white", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg-card)" }}>2</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "20px 16px", overflowX: "hidden", maxWidth: "100%" }}>
          {children}
        </main>
      </div>

      <style>{`
        @keyframes rl-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>
    </div>
  );
}
