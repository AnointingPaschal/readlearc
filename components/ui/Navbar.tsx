"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Zap, Sun, Moon, Menu, X, BookOpen, PenLine, LayoutDashboard, Wallet, Copy, Check, LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useWallet } from "../../lib/wallet";
import { useState } from "react";

const NAV = [
  { href:"/explore",   label:"Explore"        },
  { href:"/dashboard", label:"Dashboard"      },
  { href:"/creator",   label:"Creator Studio" },
];

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { address, shortAddress, isConnected, usdcBalance, disconnect } = useWallet();
  const pathname = usePathname();
  const [mob,    setMob]    = useState(false);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50">
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 16px", height:"var(--header-h)", display:"flex", alignItems:"center", gap:10 }}>

        {/* Logo */}
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none", flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,var(--brand),var(--accent))", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"var(--shadow-brand)" }}>
            <Zap size={15} color="white" strokeWidth={2.5}/>
          </div>
          <span className="hide-sm" style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:16, color:"var(--text)", letterSpacing:"-0.02em" }}>Readlearc</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:2 }} className="hide-sm">
          {NAV.map(({ href, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{
                padding:"5px 13px", borderRadius:"var(--r-f)", fontSize:13, fontWeight:500, textDecoration:"none",
                color: active ? "var(--brand)" : "var(--text-3)",
                background: active ? "var(--brand-muted)" : "transparent",
                transition: "all .15s",
              }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
          {/* Theme */}
          <button onClick={toggle} style={{ width:34, height:34, borderRadius:"50%", border:"1.5px solid var(--border)", background:"var(--bg-alt)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-3)", flexShrink:0 }}>
            {theme === "dark" ? <Sun size={14}/> : <Moon size={14}/>}
          </button>

          {/* RainbowKit Connect Button */}
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
              const ready = mounted && authenticationStatus !== "loading";
              if (!ready) return <div style={{ width:110, height:40, borderRadius:"var(--r-f)", background:"var(--bg-alt)" }} className="skeleton"/>;

              if (!account) {
                return (
                  <button onClick={openConnectModal} className="btn btn-primary btn-sm" style={{ fontWeight:700, height:38 }}>
                    <Wallet size={13}/><span className="hide-sm">Connect Wallet</span>
                  </button>
                );
              }

              if (chain?.unsupported) {
                return (
                  <button onClick={openChainModal} className="btn btn-danger btn-sm" style={{ fontWeight:700, height:38 }}>
                    Wrong network <ChevronDown size={12}/>
                  </button>
                );
              }

              return (
                <button onClick={openAccountModal} style={{
                  display:"flex", alignItems:"center", gap:7, padding:"4px 10px 4px 5px",
                  background:"var(--brand-muted)", border:"1.5px solid var(--brand-border)",
                  borderRadius:"var(--r-f)", cursor:"pointer",
                }}>
                  {account.ensAvatar
                    ? <img src={account.ensAvatar} alt="" style={{ width:26, height:26, borderRadius:"50%", flexShrink:0 }}/>
                    : <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,var(--brand),var(--accent))`, flexShrink:0 }}/>
                  }
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"var(--brand)", lineHeight:1 }}>
                      {account.ensName || account.displayName}
                    </span>
                    <span style={{ fontSize:9, fontWeight:600, color:"var(--accent)", lineHeight:1.4 }}>
                      ${usdcBalance} USDC
                    </span>
                  </div>
                </button>
              );
            }}
          </ConnectButton.Custom>

          {/* Mobile hamburger */}
          <button onClick={() => setMob(v => !v)} style={{ width:34, height:34, borderRadius:"var(--r)", border:"1.5px solid var(--border)", background:"var(--bg-alt)", cursor:"pointer", display:"none", alignItems:"center", justifyContent:"center", color:"var(--text-3) ", flexShrink:0 }} className="hide-sm">
            {mob ? <X size={15}/> : <Menu size={15}/>}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mob && (
        <div style={{ borderTop:"1px solid var(--border)", padding:"10px 16px 18px", background:"var(--nav-bg)", backdropFilter:"blur(24px)" }}>
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMob(false)} style={{ display:"block", padding:"11px 4px", borderBottom:"1px solid var(--border)", fontSize:14, fontWeight:600, color:"var(--text-2)", textDecoration:"none" }}>
              {label}
            </Link>
          ))}
          <div style={{ marginTop:14 }}>
            <ConnectButton showBalance={false}/>
          </div>
        </div>
      )}
    </nav>
  );
}
