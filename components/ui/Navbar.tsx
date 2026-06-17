"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Sun, Moon, Menu, X, Wallet, LogOut, Copy, Check } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useWallet } from "../../lib/web3Context";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/write", label: "Write" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { address, shortAddress, isConnected, isConnecting, usdcBalance, connect, disconnect } = useWallet();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50">
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 20px",
        height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(109,40,217,0.3)", flexShrink: 0,
          }}>
            <Zap size={17} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 19, color: "var(--text)", letterSpacing: "-0.02em" }}>
            Readlearc
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 2 }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{
                padding: "6px 14px", borderRadius: "var(--radius-full)",
                fontWeight: 500, fontSize: 14, textDecoration: "none",
                color: active ? "var(--brand)" : "var(--text-3)",
                background: active ? "var(--brand-muted)" : "transparent",
                transition: "all 0.15s ease",
              }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Network badge */}
          <div className="hidden sm:flex badge badge-brand" style={{ fontSize: 10, padding: "3px 10px" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "rl-pulse 2s infinite" }} />
            Arc Testnet
          </div>

          {/* Theme toggle */}
          <button onClick={toggle} title={theme === "dark" ? "Light mode" : "Dark mode"} style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "1.5px solid var(--border-strong)", background: "var(--bg-alt)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-3)", transition: "all 0.15s ease",
          }}>
            {theme === "dark" ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
          </button>

          {/* Wallet button */}
          {isConnected ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setWalletMenuOpen(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 12px 6px 8px",
                  background: "var(--brand-muted)",
                  border: "1.5px solid var(--border-brand)",
                  borderRadius: "var(--radius-full)",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--brand), var(--accent))",
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)" }}>{shortAddress}</span>
              </button>

              {walletMenuOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setWalletMenuOpen(false)} />
                  <div className="card" style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50,
                    minWidth: 220, padding: "8px", borderRadius: "var(--radius)",
                    boxShadow: "var(--shadow-xl)",
                  }}>
                    <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                      <div style={{ fontSize: 11, color: "var(--text-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Connected</div>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>
                        {address.slice(0,10)}…{address.slice(-6)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "Outfit, sans-serif", color: "var(--accent)" }}>${usdcBalance}</span>
                        <span style={{ fontSize: 11, color: "var(--text-4)", fontWeight: 600 }}>USDC</span>
                      </div>
                    </div>
                    <button onClick={copyAddress} style={{
                      width: "100%", padding: "9px 14px", display: "flex", alignItems: "center", gap: 8,
                      background: "transparent", border: "none", cursor: "pointer",
                      borderRadius: "var(--radius-sm)", color: "var(--text-2)",
                      fontSize: 13, fontWeight: 500, textAlign: "left",
                      transition: "background 0.1s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-alt)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {copied ? <Check size={14} style={{ color: "var(--accent)" }} /> : <Copy size={14} style={{ color: "var(--text-4)" }} />}
                      {copied ? "Copied!" : "Copy address"}
                    </button>
                    <Link href="/wallet" onClick={() => setWalletMenuOpen(false)} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 14px", textDecoration: "none",
                      borderRadius: "var(--radius-sm)", color: "var(--text-2)",
                      fontSize: 13, fontWeight: 500,
                      transition: "background 0.1s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-alt)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <Wallet size={14} style={{ color: "var(--text-4)" }} /> My Wallet
                    </Link>
                    <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                    <button onClick={() => { disconnect(); setWalletMenuOpen(false); }} style={{
                      width: "100%", padding: "9px 14px", display: "flex", alignItems: "center", gap: 8,
                      background: "transparent", border: "none", cursor: "pointer",
                      borderRadius: "var(--radius-sm)", color: "#ef4444",
                      fontSize: 13, fontWeight: 500, textAlign: "left",
                      transition: "background 0.1s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.07)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={14} /> Disconnect
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
              {isConnecting ? (
                <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "rl-spin 0.7s linear infinite" }} /> Connecting…</>
              ) : (
                <><Wallet size={13} strokeWidth={2.5} /> Connect Wallet</>
              )}
            </button>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setMobileOpen(v => !v)} style={{
            width: 36, height: 36, borderRadius: "var(--radius-sm)",
            border: "1.5px solid var(--border)", background: "var(--bg-alt)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-3)",
          }}>
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "8px 20px 16px", background: "var(--nav-bg)", backdropFilter: "blur(20px)" }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{
              display: "block", padding: "11px 0",
              borderBottom: "1px solid var(--border)",
              fontWeight: 600, fontSize: 15, color: "var(--text-2)", textDecoration: "none",
            }}>
              {label}
            </Link>
          ))}
          {!isConnected && (
            <button onClick={() => { connect(); setMobileOpen(false); }} style={{
              marginTop: 12, width: "100%", padding: "12px",
              background: "var(--brand)", color: "white", border: "none",
              borderRadius: "var(--radius)", fontWeight: 700, fontSize: 15,
              cursor: "pointer",
            }}>
              Connect Wallet
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes rl-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes rl-spin  { to{transform:rotate(360deg)} }
      `}</style>
    </nav>
  );
}
