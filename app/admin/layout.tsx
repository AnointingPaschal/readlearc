"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "../../lib/theme";
import {
  Zap, LayoutDashboard, Settings, Palette, BookOpen, Users, PenTool,
  UserCheck, DollarSign, Brain, Shield, Menu, X, Sun, Moon,
  ChevronRight, LogOut, Bell,
} from "lucide-react";

const NAV = [
  { label:"Overview", items:[
    { href:"/admin",                    icon:LayoutDashboard, label:"Dashboard"         },
  ]},
  { label:"Content",  items:[
    { href:"/admin/content/moderation", icon:BookOpen,        label:"Articles & Moderation" },
  ]},
  { label:"Users",    items:[
    { href:"/admin/users/writers",      icon:PenTool,         label:"Writers"           },
    { href:"/admin/users/readers",      icon:UserCheck,       label:"Readers"           },
    { href:"/admin/users/roles",        icon:Shield,          label:"Admin Roles"       },
  ]},
  { label:"Finance",  items:[
    { href:"/admin/earnings",           icon:DollarSign,      label:"Earnings & Payouts"},
  ]},
  { label:"Settings", items:[
    { href:"/admin/settings",           icon:Settings,        label:"AI, Prices & Treasury"},
    { href:"/admin/settings/branding",  icon:Palette,         label:"Brand & Colors"    },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const crumbs = pathname.split("/").filter(Boolean);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex" }}>

      {/* Sidebar */}
      <aside style={{
        width:230, flexShrink:0, background:"var(--bg-card)", borderRight:"1px solid var(--border)",
        display:"flex", flexDirection:"column", position:"fixed", top:0, left:open?0:-230, bottom:0,
        zIndex:60, transition:"left .25s", overflow:"hidden",
      }} className="admin-sidebar">

        {/* Logo */}
        <div style={{ padding:"0 16px", height:60, borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div style={{ width:30, height:30, borderRadius:9, background:"linear-gradient(135deg,var(--brand),var(--accent))", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Zap size={14} color="white" strokeWidth={2.5}/>
          </div>
          <div>
            <div style={{ fontFamily:"Outfit,sans-serif", fontWeight:900, fontSize:14, color:"var(--text)" }}>Readlearc</div>
            <div style={{ fontSize:9, color:"var(--text-4)", fontWeight:700, textTransform:"uppercase", letterSpacing:".07em" }}>Admin</div>
          </div>
          <button onClick={()=>setOpen(false)} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", display:"flex" }}>
            <X size={14}/>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:"auto", padding:"12px 10px" }}>
          {NAV.map(g => (
            <div key={g.label} style={{ marginBottom:20 }}>
              <div style={{ fontFamily:"Outfit,sans-serif", fontSize:9, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".1em", padding:"0 8px", marginBottom:4 }}>
                {g.label}
              </div>
              {g.items.map(item => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={()=>setOpen(false)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:"var(--r)", fontSize:13, fontWeight:active?600:400,
                      color:active?"var(--brand)":"var(--text-3)", background:active?"var(--brand-muted)":"transparent",
                      textDecoration:"none", marginBottom:2, transition:"all .12s",
                      border:`1px solid ${active?"var(--brand-border)":"transparent"}` }}
                    onMouseEnter={e=>{if(!active){(e.currentTarget as any).style.background="var(--bg-alt)";(e.currentTarget as any).style.color="var(--text)"}}}
                    onMouseLeave={e=>{if(!active){(e.currentTarget as any).style.background="transparent";(e.currentTarget as any).style.color="var(--text-3)"}}}
                  >
                    <item.icon size={13} style={{ flexShrink:0, opacity:active?1:.65 }}/>
                    <span style={{ flex:1 }}>{item.label}</span>
                    {active && <ChevronRight size={10} style={{ opacity:.5 }}/>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:"10px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:"var(--r)", fontSize:12, color:"var(--text-4)", textDecoration:"none" }}
            onMouseEnter={e=>{(e.currentTarget as any).style.background="var(--bg-alt)";(e.currentTarget as any).style.color="var(--text)"}}
            onMouseLeave={e=>{(e.currentTarget as any).style.background="transparent";(e.currentTarget as any).style.color="var(--text-4)"}}>
            <LogOut size={12}/> Exit Admin
          </Link>
        </div>
      </aside>

      {/* Backdrop (mobile) */}
      {open && <div onClick={()=>setOpen(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:59 }}/>}

      {/* Main content */}
      <div style={{ flex:1, marginLeft:230, display:"flex", flexDirection:"column", minHeight:"100vh" }} className="admin-main-wrap">

        {/* Top bar */}
        <header style={{ height:60, background:"var(--bg-card)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12, padding:"0 20px", position:"sticky", top:0, zIndex:40, flexShrink:0 }}>
          <button onClick={()=>setOpen(true)} className="mobile-menu-btn" style={{ width:34,height:34,borderRadius:"var(--r)",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"none",alignItems:"center",justifyContent:"center",color:"var(--text-3)",flexShrink:0 }}>
            <Menu size={15}/>
          </button>

          {/* Breadcrumb */}
          <div style={{ flex:1, display:"flex", alignItems:"center", gap:5, overflow:"hidden" }}>
            {crumbs.map((seg,i) => (
              <span key={seg+i} style={{ display:"flex", alignItems:"center", gap:5, flexShrink:i===crumbs.length-1?0:1 }}>
                {i>0 && <ChevronRight size={11} style={{ color:"var(--text-4)", flexShrink:0 }}/>}
                <span style={{ fontSize:13, color:i===crumbs.length-1?"var(--text)":"var(--text-4)", fontWeight:i===crumbs.length-1?600:400, textTransform:"capitalize", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {seg}
                </span>
              </span>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ display:"flex",alignItems:"center",gap:5,fontSize:10,fontWeight:700,color:"var(--accent)",background:"rgba(5,150,105,.08)",border:"1px solid rgba(5,150,105,.18)",padding:"3px 9px",borderRadius:"var(--r-f)",whiteSpace:"nowrap" }}>
              <span style={{ width:5,height:5,borderRadius:"50%",background:"var(--accent)",display:"inline-block" }}/>Live
            </span>
            <button onClick={toggle} style={{ width:32,height:32,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)" }}>
              {theme==="dark"?<Sun size={13}/>:<Moon size={13}/>}
            </button>
            <Link href="/" style={{ width:32,height:32,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-4)",textDecoration:"none" }} title="View site">
              <Zap size={13}/>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, padding:"clamp(16px,3vw,28px)" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width:768px) {
          .admin-sidebar { left: -230px !important; }
          .admin-sidebar.open-mobile { left: 0 !important; }
          .admin-main-wrap { margin-left: 0 !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
