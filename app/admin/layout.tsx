"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "../../lib/theme";
import {
  Zap, LayoutDashboard, Settings, Palette, Search as SearchIcon,
  Bot, Server, Cpu, FileText, BookOpen, Flag, Users, PenTool,
  UserCheck, DollarSign, Percent, CreditCard, FileCode, Lock,
  ScrollText, Bell, ChevronRight, LogOut, Menu, X, Sun, Moon,
} from "lucide-react";

const NAV = [
  { label:"Overview",  items:[{ href:"/admin",                     icon:LayoutDashboard, label:"Dashboard"   }] },
  { label:"Content",   items:[
    { href:"/admin/content/moderation", icon:BookOpen,  label:"All Articles" },
    { href:"/admin/logs",               icon:Flag,       label:"Activity Logs" },
    { href:"/admin/notifications",      icon:Bell,       label:"Notifications" },
  ]},
  { label:"Users",     items:[
    { href:"/admin/users/writers", icon:PenTool,    label:"Writers"  },
    { href:"/admin/users/readers", icon:UserCheck,  label:"Readers"  },
  ]},
  { label:"Finance",   items:[
    { href:"/admin/finance/fees",      icon:Percent,    label:"Fee Splits" },
    { href:"/admin/finance/payouts",   icon:CreditCard, label:"Payouts"    },
    { href:"/admin/finance/contracts", icon:FileCode,   label:"Contracts"  },
  ]},
  { label:"System",    items:[
    { href:"/admin/security",    icon:Lock,        label:"Security"       },
  ]},
  { label:"AI",        items:[
    { href:"/admin/ai/providers", icon:Bot,    label:"OpenRouter AI" },
    { href:"/admin/ai/models",    icon:Cpu,    label:"Models"        },
    { href:"/admin/ai/prompts",   icon:FileText,label:"Prompts"      },
  ]},
  { label:"Site",      items:[
    { href:"/admin/settings",      icon:DollarSign,label:"Payment Settings" },
    { href:"/admin/site",          icon:Settings, label:"Site Settings" },
    { href:"/admin/site/branding", icon:Palette,  label:"Branding" },
    { href:"/admin/site/seo",      icon:SearchIcon,label:"SEO"     },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const crumbs = pathname.split("/").filter(Boolean);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex" }}>

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${open?" open":""}`}>
        {/* Logo */}
        <div style={{ padding:"0 16px", height:60, borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,var(--brand),var(--accent))", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"var(--shadow-brand)" }}>
            <Zap size={15} color="white" strokeWidth={2.5}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"Outfit,sans-serif", fontWeight:900, fontSize:14, color:"var(--text)", letterSpacing:"-0.02em" }}>Readlearc</div>
            <div style={{ fontSize:9, color:"var(--text-4)", fontWeight:700, textTransform:"uppercase", letterSpacing:".07em" }}>Admin Console</div>
          </div>
          <button className="admin-menu-btn" onClick={()=>setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", padding:4, display:"none", alignItems:"center" }}>
            <X size={15}/>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:"auto", padding:"14px 10px" }}>
          {NAV.map(g => (
            <div key={g.label} style={{ marginBottom:22 }}>
              <div style={{ fontFamily:"Outfit,sans-serif", fontSize:9, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".1em", padding:"0 10px", marginBottom:5 }}>{g.label}</div>
              {g.items.map(item => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={()=>setOpen(false)}
                    style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:"var(--r)", fontSize:13, fontWeight:active?600:400,
                      color:active?"var(--brand)":"var(--text-3)", background:active?"var(--brand-muted)":"transparent",
                      textDecoration:"none", marginBottom:2, transition:"all .12s",
                      border:`1px solid ${active?"var(--brand-border)":"transparent"}` }}
                    onMouseEnter={e=>{if(!active){(e.currentTarget as any).style.background="var(--bg-alt)";(e.currentTarget as any).style.color="var(--text)"}}}
                    onMouseLeave={e=>{if(!active){(e.currentTarget as any).style.background="transparent";(e.currentTarget as any).style.color="var(--text-3)"}}}
                  >
                    <item.icon size={13} style={{ flexShrink:0, opacity:active?1:.7 }}/>
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
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:"var(--r)", fontSize:12, color:"var(--text-4)", textDecoration:"none", transition:"all .12s" }}
            onMouseEnter={e=>{(e.currentTarget as any).style.background="var(--bg-alt)";(e.currentTarget as any).style.color="var(--text)"}}
            onMouseLeave={e=>{(e.currentTarget as any).style.background="transparent";(e.currentTarget as any).style.color="var(--text-4)"}}
          >
            <LogOut size={12}/> Exit Admin
          </Link>
        </div>
      </aside>

      {open && <div onClick={()=>setOpen(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:50,backdropFilter:"blur(2px)" }}/>}

      {/* ── Main ── */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <button className="admin-menu-btn" onClick={()=>setOpen(true)} style={{ width:34,height:34,borderRadius:"var(--r)",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"none",alignItems:"center",justifyContent:"center",color:"var(--text-3)",flexShrink:0 }}>
            <Menu size={16}/>
          </button>
          {/* Breadcrumb */}
          <div style={{ flex:1, display:"flex", alignItems:"center", gap:5, minWidth:0, overflow:"hidden" }}>
            {crumbs.map((seg,i)=>(
              <span key={seg+i} style={{ display:"flex", alignItems:"center", gap:5, minWidth:0, flexShrink:i===crumbs.length-1?0:1 }}>
                {i>0&&<ChevronRight size={11} style={{ color:"var(--text-4)", flexShrink:0 }}/>}
                <span style={{ fontSize:13, color:i===crumbs.length-1?"var(--text)":"var(--text-4)", fontWeight:i===crumbs.length-1?600:400, textTransform:"capitalize", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{seg}</span>
              </span>
            ))}
          </div>
          {/* Controls */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, fontWeight:700, color:"var(--accent)", background:"rgba(5,150,105,.08)", border:"1px solid rgba(5,150,105,.18)", padding:"4px 10px", borderRadius:"var(--r-f)", whiteSpace:"nowrap" }}>
              <span style={{ width:5,height:5,borderRadius:"50%",background:"var(--accent)",display:"inline-block",animation:"pulse-dot 2s infinite" }}/> Live
            </span>
            <button onClick={toggle} style={{ width:32,height:32,borderRadius:"50%",border:"1.5px solid var(--border)",background:"var(--bg-alt)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-3)" }}>
              {theme==="dark"?<Sun size={13}/>:<Moon size={13}/>}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
