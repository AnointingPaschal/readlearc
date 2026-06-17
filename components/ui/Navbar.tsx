"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/write", label: "Write" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(109,40,217,0.35)"
          }}>
            <Zap size={18} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 20, color: "var(--text)", letterSpacing: "-0.02em" }}>
            Readlearc
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 4 }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "7px 16px",
                  borderRadius: "var(--radius-full)",
                  fontWeight: 500,
                  fontSize: 14,
                  textDecoration: "none",
                  color: active ? "var(--brand)" : "var(--text-3)",
                  background: active ? "var(--brand-muted)" : "transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-3)"; }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Network badge */}
          <div className="hidden sm:flex badge badge-brand" style={{ fontSize: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse 2s infinite" }} />
            Arc Testnet
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 38, height: 38, borderRadius: "50%",
              border: "1.5px solid var(--border-strong)",
              background: "var(--bg-alt)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-3)",
              transition: "all 0.2s ease",
            }}
          >
            {theme === "dark"
              ? <Sun size={16} strokeWidth={2} />
              : <Moon size={16} strokeWidth={2} />
            }
          </button>

          {/* Connect wallet */}
          <Link href="/wallet" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
            Connect
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(v => !v)}
            style={{
              width: 38, height: 38, borderRadius: "var(--radius-sm)",
              border: "1.5px solid var(--border)",
              background: "var(--bg-alt)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-3)",
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          borderTop: "1px solid var(--border)",
          padding: "12px 24px 20px",
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px)",
        }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--text-2)",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </nav>
  );
}
