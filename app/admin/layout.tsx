"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "../../lib/theme";
import { Zap, LayoutDashboard, Settings, Palette, Search as SearchIcon, Bot, Server, Cpu, FileText, BookOpen, Flag, Users, PenTool, UserCheck, DollarSign, Percent, CreditCard, FileCode, Lock, ScrollText, Bell, ChevronRight, LogOut, Menu, X, Sun, Moon } from "lucide-react";

const GROUPS = [
  { label:"Overview",  items:[{ href:"/admin",                  label:"Dashboard",    icon:LayoutDashboard }]},
  { label:"Content",   items:[{ href:"/admin/content",          label:"Articles",     icon:BookOpen  },
                               { href:"/admin/content/moderation",label:"Moderation",  icon:Flag      }]},
  { label:"Users",     items:[{ href:"/admin/users/writers",    label:"Writers",      icon:PenTool   },
                               { href:"/admin/users/readers",   label:"Readers",      icon:UserCheck }]},
  { label:"Finance",   items:[{ href:"/admin/finance/fees",     label:"Fees",         icon:Percent   },
                               { href:"/admin/finance/payouts", label:"Payouts",      icon:CreditCard},
                               { href:"/admin/finance/contracts",label:"Contracts",   icon:FileCode  }]},
  { label:"System",    items:[{ href:"/admin/security",         label:"Security",     icon:Lock      },
                               { href:"/admin/logs",            label:"Logs",         icon:ScrollText},
                               { href:"/admin/notifications",   label:"Notifications",icon:Bell      }]},
  { label:"Site",      items:[{ href:"/admin/site",             label:"Settings",     icon:Settings  },
                               { href:"/admin/site/branding",   label:"Branding",     icon:Palette   },
                               { href:"/admin/site/seo",        label:"SEO",          icon:SearchIcon}]},
  { label:"AI",        items:[{ href:"/admin/ai/providers",     label:"Providers",    icon:Server    },
                               { href:"/admin/ai/models",       label:"Models",       icon:Cpu       },
                               { href:"/admin/ai/prompts",      label:"Prompts",      icon:FileText  }]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const crumbs = pathname.split("/").filter(Boolean);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex" }}>
      {/* Sidebar */}
      <aside className={`admin-sidebar${open?" open":""}`}>
        <div style={{ display:"flex", alignItems:"center", gap:9, padding:"0 14px", height:60, borderBottom:"1px solid var(--border)", flexShrink:0 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,var(--brand),var(--accent))", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Zap size={14} color="white" strokeWidth={2.5}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"Outfit,sans-serif", fontWeight:800, fontSize:13, color:"var(--text)" }}>Readlearc</div>
            <div style={{ fontSize:9, color:"var(--text-4)", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>Admin</div>
          </div>
          <button className="admin-menu-btn" onClick={() => setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", display:"none", padding:4 }}><X size={15}/></button>
        </div>

        <nav style={{ flex:1, overflowY:"auto", padding:"10px 8px" }}>
          {GROUPS.map(g => (
            <div key={g.label} style={{ marginBottom:18 }}>
              <div style={{ fontSize:9, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".09em", padding:"0 8px", marginBottom:4 }}>{g.label}</div>
              {g.items.map(item => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:"var(--r2)", fontSize:13, fontWeight:active?600:400, color:active?"var(--brand)":"var(--text-3)", background:active?"var(--brand-muted)":"transparent", border:`1px solid ${active?"var(--border-brand)":"transparent"}`, textDecoration:"none", transition:"all .12s", marginBottom:1 }}
                    onMouseEnter={e => { if(!active){ (e.currentTarget as any).style.background="var(--bg-alt)"; (e.currentTarget as any).style.color="var(--text)"; } }}
                    onMouseLeave={e => { if(!active){ (e.currentTarget as any).style.background="transparent"; (e.currentTarget as any).style.color="var(--text-3)"; } }}
                  >
                    <item.icon size={13} style={{ flexShrink:0 }}/><span style={{ flex:1 }}>{item.label}</span>
                    {active && <ChevronRight size={10} style={{ opacity:.5 }}/>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding:"10px 8px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:"var(--r2)", fontSize:12, color:"var(--text-4)", textDecoration:"none" }}
            onMouseEnter={e => { (e.currentTarget as any).style.background="var(--bg-alt)"; (e.currentTarget as any).style.color="var(--text)"; }}
            onMouseLeave={e => { (e.currentTarget as any).style.background="transparent"; (e.currentTarget as any).style.color="var(--text-4)"; }}
          ><LogOut size={12}/>Exit Admin</Link>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:50, backdropFilter:"blur(2px)" }}/>}

      {/* Main */}
      <div className="admin-main">
        <header style={{ position:"sticky", top:0, zIndex:30, height:60, background:"var(--nav-bg)", backdropFilter:"blur(20px)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", gap:12, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
            <button className="admin-menu-btn" onClick={() => setOpen(true)} style={{ background:"none", border:"1.5px solid var(--border)", borderRadius:"var(--r2)", cursor:"pointer", color:"var(--text-3)", padding:6, display:"none", alignItems:"center", justifyContent:"center" }}><Menu size={16}/></button>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, overflow:"hidden" }}>
              {crumbs.map((seg,i) => <span key={seg+i} style={{ display:"flex", alignItems:"center", gap:5, minWidth:0 }}>
                {i>0 && <ChevronRight size={10} style={{ color:"var(--text-4)", flexShrink:0 }}/>}
                <span style={{ color:i===crumbs.length-1?"var(--text)":"var(--text-4)", fontWeight:i===crumbs.length-1?600:400, textTransform:"capitalize", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{seg}</span>
              </span>)}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, fontWeight:700, color:"var(--accent)", background:"rgba(5,150,105,.08)", border:"1px solid rgba(5,150,105,.2)", padding:"4px 10px", borderRadius:"var(--rfull)", whiteSpace:"nowrap" }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:"var(--accent)", display:"inline-block", animation:"pulse-dot 2s infinite" }}/>Arc Live
            </span>
            <button onClick={toggle} style={{ width:32, height:32, borderRadius:"50%", border:"1.5px solid var(--border)", background:"var(--bg-alt)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-3)" }}>
              {theme==="dark"?<Sun size={13}/>:<Moon size={13}/>}
            </button>
          </div>
        </header>
        <main style={{ flex:1, padding:"20px 16px", overflowX:"hidden", maxWidth:"100%" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
