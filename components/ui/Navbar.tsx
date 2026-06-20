"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Zap, Sun, Moon, Wallet, LogOut, Copy, Check, ChevronDown, Menu, X } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useWallet } from "../../lib/wallet";

const NAV = [
  { href:"/explore",   label:"Explore"        },
  { href:"/dashboard", label:"Dashboard"      },
  { href:"/creator",   label:"Creator Studio" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { address, shortAddress, isConnected, isWrongNetwork, usdcBalance, connecting, hasWallet, connect, disconnect, switchToArc } = useWallet();

  const [mob,    setMob]    = useState(false);
  const [drop,   setDrop]   = useState(false);
  const [copied, setCopied] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDrop(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <nav className="navbar" style={{ position:"fixed", top:0, left:0, right:0, zIndex:50 }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 16px", height:"var(--header-h)", display:"flex", alignItems:"center", gap:10 }}>

        {/* Logo */}
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none", flexShrink:0 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,var(--brand),var(--accent))",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"var(--shadow-brand)" }}>
            <Zap size={15} color="white" strokeWidth={2.5}/>
          </div>
          <span style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:16, color:"var(--text)", letterSpacing:"-0.02em" }} className="hide-sm">Readlearc</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:2 }} className="hide-sm">
          {NAV.map(({ href, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{ padding:"5px 13px", borderRadius:"var(--r-f)", fontSize:13, fontWeight:500, textDecoration:"none", transition:"all .15s",
                color:active?"var(--brand)":"var(--text-3)", background:active?"var(--brand-muted)":"transparent" }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>

          {/* Theme toggle */}
          <button onClick={toggle} style={{ width:34,height:34,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)",flexShrink:0 }}>
            {theme==="dark"?<Sun size={14}/>:<Moon size={14}/>}
          </button>

          {/* Wrong network banner */}
          {isWrongNetwork && (
            <button onClick={switchToArc} style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 11px",background:"rgba(220,38,38,.08)",border:"1px solid rgba(220,38,38,.3)",borderRadius:"var(--r-f)",cursor:"pointer",fontSize:11,fontWeight:700,color:"#dc2626",flexShrink:0 }}>
              Wrong Network — Switch to Arc
            </button>
          )}

          {/* Wallet button */}
          {!isConnected ? (
            <button onClick={connect} disabled={connecting} className="btn btn-primary btn-sm" style={{ fontWeight:700, height:38, flexShrink:0 }}>
              <Wallet size={13}/>
              {connecting ? "Connecting…" : hasWallet ? <span className="hide-sm">Connect Wallet</span> : <span className="hide-sm">Connect Wallet</span>}
            </button>
          ) : (
            <div ref={dropRef} style={{ position:"relative" }}>
              <button onClick={()=>setDrop(v=>!v)} style={{ display:"flex",alignItems:"center",gap:7,padding:"4px 10px 4px 5px",background:"var(--brand-muted)",border:"1.5px solid var(--brand-border)",borderRadius:"var(--r-f)",cursor:"pointer",transition:"all .15s" }}>
                {/* Avatar */}
                <div style={{ width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,hsl(${parseInt(address.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(address.slice(4,6)||"0",16)*1.4}deg,55%,45%))`,flexShrink:0 }}/>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-start" }}>
                  <span style={{ fontSize:11,fontWeight:700,color:"var(--brand)",lineHeight:1 }}>{shortAddress}</span>
                  <span style={{ fontSize:9,fontWeight:600,color:"var(--accent)",lineHeight:1.4 }}>${usdcBalance} USDC</span>
                </div>
                <ChevronDown size={11} style={{ color:"var(--brand)",opacity:.7,transition:"transform .15s",transform:drop?"rotate(180deg)":"none" }}/>
              </button>

              {/* Dropdown */}
              {drop && (
                <div style={{ position:"absolute",top:"calc(100% + 8px)",right:0,minWidth:220,background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",boxShadow:"var(--shadow-lg)",padding:8,zIndex:100 }}>
                  {/* Wallet info */}
                  <div style={{ padding:"10px 12px",marginBottom:6,background:"var(--bg-alt)",borderRadius:"var(--r)",border:"1px solid var(--border)" }}>
                    <div style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",marginBottom:4,fontFamily:"Outfit,sans-serif",textTransform:"uppercase",letterSpacing:".06em" }}>Connected</div>
                    <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11,color:"var(--text)",wordBreak:"break-all",lineHeight:1.5 }}>{address}</div>
                    <div style={{ marginTop:8,fontFamily:"Outfit,sans-serif",fontSize:16,fontWeight:900,color:"var(--accent)" }}>${usdcBalance} <span style={{ fontSize:11,fontWeight:600,color:"var(--text-4)" }}>USDC</span></div>
                  </div>

                  {/* Actions */}
                  {[
                    { href:"/creator",         label:"Creator Studio"     },
                    { href:"/reading-history", label:"Reading History"    },
                    { href:`/profile/${address}`,label:"My Profile"       },
                    { href:"/wallet",          label:"Wallet & Send"      },
                  ].map(({href,label})=>(
                    <Link key={href} href={href} onClick={()=>setDrop(false)} style={{ display:"block",padding:"8px 12px",borderRadius:"var(--r)",fontSize:13,color:"var(--text-2)",textDecoration:"none",fontWeight:500,transition:"all .12s" }}
                      onMouseEnter={e=>(e.currentTarget as any).style.background="var(--bg-alt)"}
                      onMouseLeave={e=>(e.currentTarget as any).style.background="transparent"}>
                      {label}
                    </Link>
                  ))}

                  <div style={{ height:1,background:"var(--border)",margin:"6px 0" }}/>

                  <button onClick={copy} style={{ width:"100%",display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:"var(--r)",fontSize:13,color:"var(--text-3)",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .12s" }}
                    onMouseEnter={e=>(e.currentTarget as any).style.background="var(--bg-alt)"}
                    onMouseLeave={e=>(e.currentTarget as any).style.background="none"}>
                    {copied?<Check size={13} style={{ color:"var(--accent)" }}/>:<Copy size={13}/>}
                    {copied?"Copied!":"Copy Address"}
                  </button>

                  <button onClick={()=>{disconnect();setDrop(false);}} style={{ width:"100%",display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:"var(--r)",fontSize:13,color:"#dc2626",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .12s" }}
                    onMouseEnter={e=>(e.currentTarget as any).style.background="rgba(220,38,38,.06)"}
                    onMouseLeave={e=>(e.currentTarget as any).style.background="none"}>
                    <LogOut size={13}/>Disconnect
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button onClick={()=>setMob(v=>!v)} className="hide-desktop" style={{ width:34,height:34,borderRadius:"var(--r)",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)",flexShrink:0 }}>
            {mob?<X size={15}/>:<Menu size={15}/>}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mob && (
        <div style={{ borderTop:"1px solid var(--border)",padding:"10px 16px 16px",background:"var(--nav-bg)",backdropFilter:"blur(24px)" }}>
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} onClick={()=>setMob(false)} style={{ display:"block",padding:"11px 4px",borderBottom:"1px solid var(--border)",fontSize:14,fontWeight:600,color:"var(--text-2)",textDecoration:"none" }}>
              {label}
            </Link>
          ))}
          {!isConnected && (
            <button onClick={()=>{connect();setMob(false);}} className="btn btn-primary" style={{ marginTop:12,width:"100%",justifyContent:"center" }}>
              <Wallet size={14}/>Connect Wallet
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
