"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Sun, Moon, Menu, X, Wallet, LogOut, Copy, Check, User, History, Settings, PenLine, BookOpen } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useWallet } from "../../lib/wallet";
import { useState } from "react";

const NAV = [
  { href: "/explore",   label: "Explore"   },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/creator",   label: "Create"    },
];

export default function Navbar() {
  const { theme, toggle }  = useTheme();
  const { address, shortAddress, isConnected, isConnecting, usdcBalance, connect, disconnect } = useWallet();
  const pathname           = usePathname();
  const [mob, setMob]      = useState(false);
  const [menu, setMenu]    = useState(false);
  const [copied, setCopied]= useState(false);

  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const userLinks = [
    { href:`/profile/${address}`, label:"My Profile",      icon:User     },
    { href:"/dashboard",          label:"Dashboard",       icon:BookOpen },
    { href:"/creator",            label:"Creator Studio",  icon:PenLine  },
    { href:"/reading-history",    label:"Reading History", icon:History  },
    { href:"/wallet",             label:"Wallet",          icon:Wallet   },
    { href:"/account",            label:"Settings",        icon:Settings },
  ];

  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50" style={{ height: 60 }}>
      <div style={{ maxWidth: 1200, margin:"0 auto", padding:"0 16px", height:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>

        {/* Logo */}
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none", flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,var(--brand),var(--accent))", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"var(--shadow-brand)" }}>
            <Zap size={16} color="white" strokeWidth={2.5} />
          </div>
          <span className="hide-mobile" style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:17, color:"var(--text)", letterSpacing:"-0.02em" }}>Readlearc</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex" style={{ alignItems:"center", gap:2, flex:1, justifyContent:"center" }}>
          {NAV.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href+"/");
            return (
              <Link key={href} href={href} style={{ padding:"5px 13px", borderRadius:"var(--rfull)", fontWeight:500, fontSize:13, textDecoration:"none", color:active?"var(--brand)":"var(--text-3)", background:active?"var(--brand-muted)":"transparent", transition:"all .15s" }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>

          {/* Theme */}
          <button onClick={toggle} style={{ width:34, height:34, borderRadius:"50%", border:"1.5px solid var(--border-mid)", background:"var(--bg-alt)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-3)" }}>
            {theme === "dark" ? <Sun size={14}/> : <Moon size={14}/>}
          </button>

          {/* Wallet */}
          {isConnected ? (
            <div style={{ position:"relative" }}>
              <button onClick={() => setMenu(v => !v)} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px 4px 6px", background:"var(--brand-muted)", border:"1.5px solid var(--border-brand)", borderRadius:"var(--rfull)", cursor:"pointer" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:"linear-gradient(135deg,var(--brand),var(--accent))", flexShrink:0 }} />
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--brand)", lineHeight:1 }}>{shortAddress}</span>
                  <span style={{ fontSize:9, color:"var(--accent)", fontWeight:600, lineHeight:1.2 }}>${usdcBalance}</span>
                </div>
              </button>

              {menu && <>
                <div style={{ position:"fixed", inset:0, zIndex:40 }} onClick={() => setMenu(false)} />
                <div className="card" style={{ position:"absolute", right:0, top:"calc(100% + 8px)", zIndex:50, minWidth:220, padding:6, boxShadow:"var(--shadow-lg)" }}>
                  <div style={{ padding:"10px 12px 10px", borderBottom:"1px solid var(--border)", marginBottom:4 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>My Account</div>
                        <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:9, color:"var(--text-4)" }}>{address.slice(0,14)}…{address.slice(-4)}</div>
                      </div>
                      <button onClick={copy} style={{ display:"flex", alignItems:"center", gap:3, padding:"3px 7px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:6, cursor:"pointer", fontSize:10, color:"var(--text-3)" }}>
                        {copied ? <><Check size={10} style={{ color:"var(--accent)" }} />Copied</> : <><Copy size={10}/>Copy</>}
                      </button>
                    </div>
                    <div>
                      <span style={{ fontSize:19, fontWeight:900, fontFamily:"Outfit,sans-serif", color:"var(--accent)" }}>${usdcBalance}</span>
                      <span style={{ fontSize:10, color:"var(--text-4)", marginLeft:4 }}>USDC</span>
                    </div>
                  </div>
                  {userLinks.map(({ href, label, icon:Icon }) => (
                    <Link key={href} href={href} onClick={() => setMenu(false)} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 12px", textDecoration:"none", borderRadius:"var(--r2)", color:"var(--text-2)", fontSize:12, fontWeight:500, transition:"background .1s" }}
                      onMouseEnter={e => (e.currentTarget as any).style.background="var(--bg-alt)"}
                      onMouseLeave={e => (e.currentTarget as any).style.background="transparent"}
                    >
                      <Icon size={13} style={{ color:"var(--text-4)", flexShrink:0 }} /> {label}
                    </Link>
                  ))}
                  <div style={{ height:1, background:"var(--border)", margin:"4px 0" }} />
                  <button onClick={() => { disconnect(); setMenu(false); }} style={{ width:"100%", padding:"8px 12px", display:"flex", alignItems:"center", gap:9, background:"transparent", border:"none", cursor:"pointer", borderRadius:"var(--r2)", color:"#ef4444", fontSize:12, fontWeight:500 }}
                    onMouseEnter={e => (e.currentTarget as any).style.background="rgba(239,68,68,.07)"}
                    onMouseLeave={e => (e.currentTarget as any).style.background="transparent"}
                  >
                    <LogOut size={13} /> Disconnect
                  </button>
                </div>
              </>}
            </div>
          ) : (
            <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-sm">
              {isConnecting
                ? <div style={{ width:12, height:12, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%", flexShrink:0 }} className="spin" />
                : <><Wallet size={12}/><span className="hide-mobile">Connect</span></>
              }
            </button>
          )}

          {/* Mobile toggle */}
          <button className="md:hidden" onClick={() => setMob(v => !v)} style={{ width:34, height:34, borderRadius:"var(--r2)", border:"1.5px solid var(--border)", background:"var(--bg-alt)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-3)" }}>
            {mob ? <X size={16}/> : <Menu size={16}/>}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mob && (
        <div style={{ borderTop:"1px solid var(--border)", padding:"8px 16px 16px", background:"var(--nav-bg)", backdropFilter:"blur(20px)" }}>
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMob(false)} style={{ display:"block", padding:"10px 0", borderBottom:"1px solid var(--border)", fontWeight:600, fontSize:14, color:"var(--text-2)", textDecoration:"none" }}>{label}</Link>
          ))}
          {isConnected
            ? <button onClick={() => { disconnect(); setMob(false); }} style={{ marginTop:12, width:"100%", padding:10, background:"rgba(239,68,68,.08)", color:"#ef4444", border:"1px solid rgba(239,68,68,.2)", borderRadius:"var(--r)", fontWeight:700, fontSize:13, cursor:"pointer" }}>Disconnect</button>
            : <button onClick={() => { connect(); setMob(false); }} style={{ marginTop:12, width:"100%", padding:10, background:"var(--brand)", color:"white", border:"none", borderRadius:"var(--r)", fontWeight:700, fontSize:14, cursor:"pointer" }}>Connect Wallet</button>
          }
        </div>
      )}
    </nav>
  );
}
