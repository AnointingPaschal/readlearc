"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Zap, Sun, Moon, ChevronDown, LogOut, Copy, Check, Wallet, BookOpen, PenLine, LayoutDashboard, User, Lock, Shield, History, X, Menu } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useAuth } from "../../lib/auth";

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { isAuth, short, address, balance, requireAuth, lock, disconnect, isAdmin } = useAuth();
  const [drop,   setDrop]   = useState(false);
  const [mob,    setMob]    = useState(false);
  const [copied, setCopied] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (!dropRef.current?.contains(e.target as Node)) setDrop(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const avatarColor = address
    ? `hsl(${parseInt(address.slice(2,4)||"6d",16)*1.4}deg,65%,55%)`
    : "var(--brand)";

  return (
    <>
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, height:"var(--header-h)", background:"var(--nav-bg)", backdropFilter:"blur(20px)", borderBottom:"1px solid var(--border)" }}>
        <div className="container" style={{ height:"100%", display:"flex", alignItems:"center", gap:10 }}>

          {/* Logo */}
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none", flexShrink:0 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,var(--brand),var(--accent))", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Zap size={16} color="white" strokeWidth={2.5}/>
            </div>
            <span style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:16, color:"var(--text)", letterSpacing:"-.02em" }}>Readlearc</span>
          </Link>

          <div style={{ flex:1 }}/>

          {/* Right controls */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={toggle} style={{ width:34, height:34, borderRadius:"50%", border:"1.5px solid var(--border)", background:"var(--bg-alt)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-3)" }}>
              {theme === "dark" ? <Sun size={14}/> : <Moon size={14}/>}
            </button>

            {!isAuth ? (
              <button onClick={() => requireAuth()} className="btn btn-primary" style={{ height:38, padding:"0 18px", gap:7, fontWeight:700 }}>
                <Wallet size={13}/>Sign In
              </button>
            ) : (
              <div ref={dropRef} style={{ position:"relative" }}>
                <button onClick={() => setDrop(v => !v)} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 10px 5px 5px", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r-f)", cursor:"pointer", transition:"all .15s" }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${avatarColor},var(--accent))`, flexShrink:0 }}/>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", lineHeight:1 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{short}</span>
                    <span style={{ fontSize:10, color:"var(--accent)", fontWeight:600, marginTop:2 }}>${balance} USDC</span>
                  </div>
                  <ChevronDown size={12} style={{ color:"var(--text-4)", transform:drop?"rotate(180deg)":"none", transition:"transform .2s" }}/>
                </button>

                {drop && (
                  <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:240, background:"var(--bg-card)", border:"1.5px solid var(--border)", borderRadius:"var(--r-lg)", boxShadow:"var(--shadow-lg)", overflow:"hidden", zIndex:100 }}>
                    {/* Wallet info */}
                    <div style={{ padding:"12px 14px", background:"var(--bg-alt)", borderBottom:"1px solid var(--border)" }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:3, fontFamily:"Outfit,sans-serif" }}>Platform Wallet</div>
                      <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, color:"var(--text)", wordBreak:"break-all", lineHeight:1.5 }}>{address}</div>
                      <div style={{ marginTop:5, fontFamily:"Outfit,sans-serif", fontSize:17, fontWeight:900, color:"var(--accent)" }}>${balance} <span style={{ fontSize:10, color:"var(--text-4)", fontWeight:500 }}>USDC</span></div>
                    </div>

                    {/* Navigation links */}
                    {[
                      { href:"/explore",            icon:BookOpen,       label:"Browse Articles"    },
                      { href:"/write",              icon:PenLine,        label:"Write Article"      },
                      { href:"/creator",            icon:LayoutDashboard,label:"Creator Studio"     },
                      { href:`/profile/${address}`, icon:User,           label:"My Profile"         },
                      { href:"/reading-history",    icon:History,        label:"Reading History"    },
                      { href:"/wallet-app",         icon:Wallet,         label:"Wallet & Send"      },
                    ].map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setDrop(false)}
                        style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 14px", fontSize:13, color:"var(--text-2)", textDecoration:"none", borderBottom:"1px solid var(--border)", transition:"background .12s" }}
                        onMouseEnter={e => (e.currentTarget as any).style.background = "var(--bg-alt)"}
                        onMouseLeave={e => (e.currentTarget as any).style.background = ""}>
                        <item.icon size={13} style={{ color:"var(--text-4)" }}/>{item.label}
                      </Link>
                    ))}

                    {/* Admin link — only if admin */}
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setDrop(false)}
                        style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 14px", fontSize:13, color:"var(--brand)", textDecoration:"none", borderBottom:"1px solid var(--border)", fontWeight:600, background:"var(--brand-muted)", transition:"background .12s" }}
                        onMouseEnter={e => (e.currentTarget as any).style.background = `${(e.currentTarget as any).style.background}cc`}
                        onMouseLeave={e => (e.currentTarget as any).style.background = "var(--brand-muted)"}>
                        <Shield size={13}/> Admin Panel
                      </Link>
                    )}

                    {/* Copy */}
                    <button onClick={copy}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"9px 14px", fontSize:12, color:"var(--text-3)", background:"none", border:"none", borderBottom:"1px solid var(--border)", cursor:"pointer", fontFamily:"inherit" }}
                      onMouseEnter={e => (e.currentTarget as any).style.background = "var(--bg-alt)"}
                      onMouseLeave={e => (e.currentTarget as any).style.background = ""}>
                      {copied ? <Check size={12} style={{ color:"var(--accent)" }}/> : <Copy size={12}/>}
                      {copied ? "Copied!" : "Copy Address"}
                    </button>

                    {/* Lock */}
                    <button onClick={() => { lock(); setDrop(false); }}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"9px 14px", fontSize:12, color:"#d97706", background:"none", border:"none", borderBottom:"1px solid var(--border)", cursor:"pointer", fontFamily:"inherit" }}
                      onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(217,119,6,.05)"}
                      onMouseLeave={e => (e.currentTarget as any).style.background = ""}>
                      <Lock size={12}/>Lock Wallet
                    </button>

                    {/* Sign out */}
                    <button onClick={() => { disconnect(); setDrop(false); }}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"9px 14px", fontSize:12, color:"#dc2626", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}
                      onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(220,38,38,.05)"}
                      onMouseLeave={e => (e.currentTarget as any).style.background = ""}>
                      <LogOut size={12}/>Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMob(v => !v)} style={{ display:"none" }} className="mobile-menu-btn">
              {mob ? <X size={15}/> : <Menu size={15}/>}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile sheet — hidden; AppNav bottom bar handles mobile navigation */}
      {false && mob && (
        <div style={{ position:"fixed", top:"var(--header-h)", left:0, right:0, bottom:0, background:"var(--bg-card)", zIndex:49, padding:16, overflowY:"auto" }}>
          {[
            { href:"/",          label:"Home",            icon:Zap         },
            { href:"/explore",   label:"Browse Articles", icon:BookOpen    },
            { href:"/write",     label:"Write Article",   icon:PenLine     },
            { href:"/creator",   label:"Creator Studio",  icon:LayoutDashboard },
            { href:"/wallet-app",label:"Wallet",          icon:Wallet      },
          ].map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMob(false)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 12px", borderRadius:"var(--r)", fontSize:15, fontWeight:600, color:"var(--text-2)", textDecoration:"none", marginBottom:4, background:"var(--bg-alt)" }}>
              <l.icon size={16} style={{ color:"var(--brand)" }}/>{l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMob(false)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 12px", borderRadius:"var(--r)", fontSize:15, fontWeight:600, color:"var(--brand)", textDecoration:"none", marginBottom:4, background:"var(--brand-muted)" }}>
              <Shield size={16}/>Admin Panel
            </Link>
          )}
          {!isAuth ? (
            <button onClick={() => { requireAuth(); setMob(false); }} className="btn btn-primary"
              style={{ marginTop:8, justifyContent:"center", height:48, fontSize:15, width:"100%" }}>
              <Wallet size={16}/>Sign In / Create Wallet
            </button>
          ) : (
            <button onClick={() => { disconnect(); setMob(false); }} className="btn btn-secondary"
              style={{ marginTop:8, justifyContent:"center", height:48, width:"100%" }}>
              <LogOut size={15}/>Sign Out
            </button>
          )}
        </div>
      )}
    </>
  );
}
