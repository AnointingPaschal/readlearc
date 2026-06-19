"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Sun, Moon, Menu, X, Wallet, LogOut, Copy, Check, User, History, Settings, PenLine, BookOpen } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useWallet } from "../../lib/web3Context";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/explore",  label: "Explore"  },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/creator",   label: "Create"   },
];

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6d28d9,#059669)",
  "linear-gradient(135deg,#0284c7,#7c3aed)",
  "linear-gradient(135deg,#d97706,#dc2626)",
  "linear-gradient(135deg,#059669,#0284c7)",
  "linear-gradient(135deg,#7c3aed,#ec4899)",
  "linear-gradient(135deg,#ea580c,#eab308)",
];

function getAvatarGrad(address: string) {
  if (!address) return AVATAR_GRADIENTS[0];
  try {
    const saved = localStorage.getItem(`rl-profile-${address.toLowerCase()}`);
    const p = saved ? JSON.parse(saved) : {};
    return AVATAR_GRADIENTS[p.avatarIdx ?? 0];
  } catch { return AVATAR_GRADIENTS[0]; }
}

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { address, shortAddress, isConnected, isConnecting, usdcBalance, connect, disconnect } = useWallet();
  const pathname = usePathname();
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [walletMenu,    setWalletMenu]    = useState(false);
  const [copied,        setCopied]        = useState(false);

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const avatarGrad = isConnected ? getAvatarGrad(address) : AVATAR_GRADIENTS[0];

  const userLinks = [
    { href: `/profile/${address}`, label: "My Profile",      icon: User    },
    { href: "/dashboard",          label: "Dashboard",       icon: BookOpen },
    { href: "/creator",            label: "Creator Studio",  icon: PenLine  },
    { href: "/reading-history",    label: "Reading History", icon: History  },
    { href: "/wallet",             label: "Wallet",          icon: Wallet   },
    { href: "/account",            label: "Settings",        icon: Settings },
  ];

  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>

        {/* Logo — icon only */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 0, textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(109,40,217,0.3)" }}>
            <Zap size={16} color="white" strokeWidth={2.5} />
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{ padding: "5px 13px", borderRadius: "var(--radius-full)", fontWeight: 500, fontSize: 13, textDecoration: "none", color: active ? "var(--brand)" : "var(--text-3)", background: active ? "var(--brand-muted)" : "transparent", transition: "all 0.15s" }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {/* Theme toggle */}
          <button onClick={toggle} title={theme === "dark" ? "Light" : "Dark"} style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid var(--border-strong)", background: "var(--bg-alt)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", flexShrink: 0 }}>
            {theme === "dark" ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
          </button>

          {/* Wallet / connect */}
          {isConnected ? (
            <div style={{ position: "relative" }}>
              <button onClick={() => setWalletMenu(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 5px", background: "var(--brand-muted)", border: "1.5px solid var(--border-brand)", borderRadius: "var(--radius-full)", cursor: "pointer", transition: "all 0.15s", maxWidth: 180 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: avatarGrad, flexShrink: 0 }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>{shortAddress}</span>
                  <span style={{ fontSize: 9, color: "var(--accent)", fontWeight: 600, lineHeight: 1, marginTop: 1 }}>${usdcBalance} USDC</span>
                </div>
              </button>

              {walletMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setWalletMenu(false)} />
                  <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50, minWidth: 220, padding: "6px", boxShadow: "var(--shadow-xl)" }}>
                    {/* Header */}
                    <div style={{ padding: "10px 12px 10px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: avatarGrad, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>My Account</div>
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--text-4)", overflow: "hidden", textOverflow: "ellipsis" }}>{address.slice(0,12)}…{address.slice(-4)}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ fontSize: 18, fontWeight: 900, fontFamily: "Outfit, sans-serif", color: "var(--accent)" }}>${usdcBalance}</span>
                          <span style={{ fontSize: 10, color: "var(--text-4)", marginLeft: 4 }}>USDC</span>
                        </div>
                        <button onClick={copyAddress} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 10, color: "var(--text-3)", fontWeight: 600 }}>
                          {copied ? <><Check size={10} style={{ color: "var(--accent)" }} />Copied</> : <><Copy size={10} />Copy</>}
                        </button>
                      </div>
                    </div>

                    {userLinks.map(({ href, label, icon: Icon }) => (
                      <Link key={href} href={href} onClick={() => setWalletMenu(false)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", textDecoration: "none", borderRadius: "var(--radius-sm)", color: "var(--text-2)", fontSize: 12, fontWeight: 500, transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-alt)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <Icon size={13} style={{ color: "var(--text-4)", flexShrink: 0 }} /> {label}
                      </Link>
                    ))}
                    <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                    <button onClick={() => { disconnect(); setWalletMenu(false); }} style={{ width: "100%", padding: "8px 12px", display: "flex", alignItems: "center", gap: 9, background: "transparent", border: "none", cursor: "pointer", borderRadius: "var(--radius-sm)", color: "#ef4444", fontSize: 12, fontWeight: 500, textAlign: "left", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.07)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={13} /> Disconnect
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-sm" style={{ fontWeight: 700, fontSize: 12, height: 34, padding: "0 12px" }}>
              {isConnecting
                ? <><div style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "rl-spin 0.7s linear infinite" }} /></>
                : <><Wallet size={12} strokeWidth={2.5} /> <span className="hidden sm:inline">Connect</span></>
              }
            </button>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setMobileOpen(v => !v)} style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--bg-alt)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "8px 16px 16px", background: "var(--nav-bg)", backdropFilter: "blur(20px)" }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{ display: "block", padding: "10px 0", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 14, color: "var(--text-2)", textDecoration: "none" }}>{label}</Link>
          ))}
          {isConnected ? (
            <>
              {["/wallet", "/reading-history", "/account"].map(href => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{ display: "block", padding: "10px 0", borderBottom: "1px solid var(--border)", fontWeight: 500, fontSize: 13, color: "var(--text-3)", textDecoration: "none" }}>{href.slice(1).replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</Link>
              ))}
              <button onClick={() => { disconnect(); setMobileOpen(false); }} style={{ marginTop: 12, width: "100%", padding: "10px", background: "rgba(239,68,68,0.07)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Disconnect
              </button>
            </>
          ) : (
            <button onClick={() => { connect(); setMobileOpen(false); }} style={{ marginTop: 12, width: "100%", padding: "11px", background: "var(--brand)", color: "white", border: "none", borderRadius: "var(--radius)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Connect Wallet
            </button>
          )}
        </div>
      )}
      <style>{`
        @keyframes rl-pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes rl-spin{to{transform:rotate(360deg)}}
      `}</style>
    </nav>
  );
}
