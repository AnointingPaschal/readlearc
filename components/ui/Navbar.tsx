"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Zap, Sun, Moon, Menu, X, Wallet, LogOut, Copy, Check, ChevronDown, BookOpen, PenLine, LayoutDashboard, User } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useWallet } from "../../lib/wallet";

const LINKS = [
  { href:"/explore",   label:"Explore",  icon:BookOpen    },
  { href:"/write",     label:"Write",    icon:PenLine     },
  { href:"/creator",   label:"Earn",     icon:LayoutDashboard },
];

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { connected, short, address, balance, busy, connect, disconnect, wrongNetwork, addArc } = useWallet();
  const pathname = usePathname();
  const [open,   setOpen]   = useState(false);
  const [drop,   setDrop]   = useState(false);
  const [copied, setCopied] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (!dropRef.current?.contains(e.target as Node)) setDrop(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  function copy() { navigator.clipboard.writeText(address); setCopied(true); setTimeout(()=>setCopied(false), 2000); }

  const avatar = address ? `hsl(${parseInt(address.slice(2,4),16)*1.4},65%,55%)` : "#6d28d9";

  return (
    <>
      <nav style={{ position:"fixed",top:0,left:0,right:0,zIndex:50,height:"var(--header-h)",background:"var(--nav-bg)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)" }}>
        <div className="container" style={{ height:"100%",display:"flex",alignItems:"center",gap:12 }}>

          {/* Logo */}
          <Link href="/" style={{ display:"flex",alignItems:"center",gap:8,textDecoration:"none",flexShrink:0 }}>
            <div style={{ width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,var(--brand),var(--accent))",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Zap size={16} color="white" strokeWidth={2.5}/>
            </div>
            <span style={{ fontFamily:"Outfit,sans-serif",fontWeight:800,fontSize:16,color:"var(--text)",letterSpacing:"-.02em" }}>Readlearc</span>
          </Link>

          {/* Desktop nav */}
          <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4 }}>
            {LINKS.map(l => {
              const active = pathname===l.href||(l.href!=="/"&&pathname.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href} style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:"var(--r-f)",fontSize:13,fontWeight:500,textDecoration:"none",transition:"all .15s",color:active?"var(--brand)":"var(--text-3)",background:active?"var(--brand-muted)":"transparent" }}>
                  <l.icon size={13}/>{l.label}
                </Link>
              );
            })}
          </div>

          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            {/* Theme */}
            <button onClick={toggle} style={{ width:34,height:34,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)" }}>
              {theme==="dark"?<Sun size={14}/>:<Moon size={14}/>}
            </button>

            {/* Wallet */}
            {!connected ? (
              <button onClick={connect} disabled={busy} className="btn btn-primary" style={{ height:38,padding:"0 16px",gap:6 }}>
                <Wallet size={13}/>{busy?"Connecting…":"Connect Wallet"}
              </button>
            ) : (
              <div ref={dropRef} style={{ position:"relative" }}>
                <button onClick={()=>setDrop(v=>!v)} style={{ display:"flex",alignItems:"center",gap:8,padding:"5px 10px 5px 5px",background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r-f)",cursor:"pointer",transition:"all .15s" }}>
                  <div style={{ width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${avatar},var(--accent))`,flexShrink:0 }}/>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-start",lineHeight:1 }}>
                    <span style={{ fontSize:12,fontWeight:700,color:"var(--text)" }}>{short}</span>
                    <span style={{ fontSize:10,color:"var(--accent)",fontWeight:600,marginTop:2 }}>${balance} USDC</span>
                  </div>
                  <ChevronDown size={12} style={{ color:"var(--text-4)",transform:drop?"rotate(180deg)":"none",transition:"transform .2s" }}/>
                </button>

                {drop && (
                  <div style={{ position:"absolute",top:"calc(100% + 8px)",right:0,width:220,background:"var(--bg-card)",border:"1.5px solid var(--border)",borderRadius:"var(--r-lg)",boxShadow:"var(--shadow-lg)",overflow:"hidden",zIndex:100 }}>
                    {/* Address header */}
                    <div style={{ padding:"12px 14px",borderBottom:"1px solid var(--border)",background:"var(--bg-alt)" }}>
                      <div style={{ fontSize:10,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:4 }}>Connected Wallet</div>
                      <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:10,color:"var(--text)",wordBreak:"break-all" }}>{address}</div>
                      <div style={{ marginTop:6,fontFamily:"Outfit,sans-serif",fontSize:18,fontWeight:900,color:"var(--accent)" }}>${balance} <span style={{ fontSize:11,color:"var(--text-4)",fontWeight:500 }}>USDC</span></div>
                    </div>

                    {[
                      { href:`/profile/${address}`, icon:User,          label:"My Profile"      },
                      { href:"/creator",            icon:LayoutDashboard,label:"Creator Studio"  },
                      { href:"/reading-history",    icon:BookOpen,       label:"Reading History" },
                    ].map(item=>(
                      <Link key={item.href} href={item.href} onClick={()=>setDrop(false)} style={{ display:"flex",alignItems:"center",gap:9,padding:"10px 14px",fontSize:13,color:"var(--text-2)",textDecoration:"none",borderBottom:"1px solid var(--border)",transition:"background .12s" }}
                        onMouseEnter={e=>(e.currentTarget as any).style.background="var(--bg-alt)"}
                        onMouseLeave={e=>(e.currentTarget as any).style.background=""}>
                        <item.icon size={13} style={{ color:"var(--text-4)" }}/>{item.label}
                      </Link>
                    ))}

                    <button onClick={copy} style={{ width:"100%",display:"flex",alignItems:"center",gap:9,padding:"10px 14px",fontSize:13,color:"var(--text-3)",background:"none",border:"none",borderBottom:"1px solid var(--border)",cursor:"pointer",textAlign:"left",fontFamily:"inherit" }}
                      onMouseEnter={e=>(e.currentTarget as any).style.background="var(--bg-alt)"}
                      onMouseLeave={e=>(e.currentTarget as any).style.background=""}>
                      {copied?<Check size={13} style={{ color:"var(--accent)" }}/>:<Copy size={13}/>}
                      {copied?"Copied!":"Copy Address"}
                    </button>

                    <button onClick={()=>{disconnect();setDrop(false);}} style={{ width:"100%",display:"flex",alignItems:"center",gap:9,padding:"10px 14px",fontSize:13,color:"#dc2626",background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"inherit" }}
                      onMouseEnter={e=>(e.currentTarget as any).style.background="rgba(220,38,38,.06)"}
                      onMouseLeave={e=>(e.currentTarget as any).style.background=""}>
                      <LogOut size={13}/>Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu */}
            <button onClick={()=>setOpen(v=>!v)} style={{ display:"none",width:34,height:34,borderRadius:"var(--r)",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",alignItems:"center",justifyContent:"center",color:"var(--text-3)" }} className="mobile-menu-btn">
              {open?<X size={15}/>:<Menu size={15}/>}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      {open && (
        <div style={{ position:"fixed",top:"var(--header-h)",left:0,right:0,bottom:0,background:"var(--bg-card)",zIndex:49,padding:"16px",display:"flex",flexDirection:"column",gap:4 }}>
          {LINKS.map(l=>(
            <Link key={l.href} href={l.href} onClick={()=>setOpen(false)} style={{ display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderRadius:"var(--r)",fontSize:15,fontWeight:600,color:"var(--text-2)",textDecoration:"none",background:"var(--bg-alt)" }}>
              <l.icon size={16}/>{l.label}
            </Link>
          ))}
          {!connected && (
            <button onClick={()=>{connect();setOpen(false);}} className="btn btn-primary" style={{ marginTop:8,justifyContent:"center",height:48,fontSize:15 }}>
              <Wallet size={16}/>Connect Wallet
            </button>
          )}
        </div>
      )}
    </>
  );
}
