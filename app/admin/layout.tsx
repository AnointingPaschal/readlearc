"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../lib/theme";
import {
  Zap, LayoutDashboard, Settings, Palette, BookOpen, Flag, Bell,
  Users, PenTool, UserCheck, Percent, CreditCard, FileCode,
  Lock, Bot, Cpu, FileText, Globe, Search as SearchIcon,
  DollarSign, Shield, Menu, X, Sun, Moon, ChevronRight, LogOut, MessageSquare,
} from "lucide-react";

const NAV = [
  { label:"Overview", items:[
    { href:"/admin",                    icon:LayoutDashboard, label:"Dashboard"        },
  ]},
  { label:"Content",  items:[
    { href:"/admin/content/moderation", icon:BookOpen,        label:"All Articles"     },
    { href:"/admin/logs",               icon:Flag,            label:"Activity Logs"    },
    { href:"/admin/notifications",      icon:Bell,            label:"Notifications"    },
  ]},
  { label:"Community", items:[
    { href:"/admin/community",          icon:Users,           label:"All Spaces"        },
    { href:"/admin/community/posts",    icon:MessageSquare,   label:"All Posts"         },
    { href:"/admin/community/members",  icon:UserCheck,       label:"Members"           },
  ]},
  { label:"Users",    items:[
    { href:"/admin/users/writers",      icon:PenTool,         label:"Writers"          },
    { href:"/admin/users/readers",      icon:UserCheck,       label:"Readers"          },
    { href:"/admin/users/roles",        icon:Shield,          label:"Admin Roles"      },
  ]},
  { label:"Finance",  items:[
    { href:"/admin/finance/fees",       icon:Percent,         label:"Fee Splits"       },
    { href:"/admin/finance/payouts",    icon:CreditCard,      label:"Payouts"          },
    { href:"/admin/finance/contracts",  icon:FileCode,        label:"Contracts"        },
    { href:"/admin/earnings",           icon:DollarSign,      label:"Earnings & Payout"},
  ]},
  { label:"AI",       items:[
    { href:"/admin/ai/providers",       icon:Bot,             label:"OpenRouter AI"    },
    { href:"/admin/ai/models",          icon:Cpu,             label:"Models"           },
    { href:"/admin/ai/prompts",         icon:FileText,        label:"Prompts"          },
  ]},
  { label:"Site",     items:[
    { href:"/admin/settings",           icon:Settings,        label:"Payment Settings" },
    { href:"/admin/settings/branding",  icon:Palette,         label:"Brand & Colors"  },
    { href:"/admin/site",               icon:Globe,           label:"Site Settings"    },
    { href:"/admin/site/branding",      icon:Palette,         label:"Branding"         },
    { href:"/admin/site/seo",           icon:SearchIcon,      label:"SEO"              },
  ]},
  { label:"System",   items:[
    { href:"/admin/security",           icon:Lock,            label:"Security"         },
    { href:"/admin/seed",               icon:FileText,        label:"Seed Data"        },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const crumbs = pathname.split("/").filter(Boolean);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (open && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>

      {/* ── Sidebar ── */}
      <aside ref={sidebarRef} className={`admin-sidebar${open ? " open" : ""}`}>
        {/* Logo */}
        <div style={{ height:60, padding:"0 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div style={{ width:30, height:30, borderRadius:9, background:"linear-gradient(135deg,var(--brand),var(--accent))", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Zap size={14} color="white" strokeWidth={2.5}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"Outfit,sans-serif", fontWeight:900, fontSize:14, color:"var(--text)", letterSpacing:"-.02em" }}>Readlearc</div>
            <div style={{ fontSize:9, color:"var(--text-4)", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em" }}>Admin Console</div>
          </div>
          <button onClick={() => setOpen(false)} className="admin-menu-btn" style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", display:"flex", padding:4, flexShrink:0 }}>
            <X size={15}/>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:"auto", padding:"12px 10px" }}>
          {NAV.map(group => (
            <div key={group.label} style={{ marginBottom:20 }}>
              <div style={{ fontFamily:"Outfit,sans-serif", fontSize:9, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".1em", padding:"0 8px", marginBottom:4 }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:"var(--r)", marginBottom:2, fontSize:13, fontWeight:active?600:400, color:active?"var(--brand)":"var(--text-3)", background:active?"var(--brand-muted)":"transparent", textDecoration:"none", border:`1px solid ${active?"var(--brand-border)":"transparent"}`, transition:"all .12s" }}
                    onMouseEnter={e=>{ if(!active){ (e.currentTarget as HTMLElement).style.background="var(--bg-alt)"; (e.currentTarget as HTMLElement).style.color="var(--text)"; }}}
                    onMouseLeave={e=>{ if(!active){ (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.color="var(--text-3)"; }}}
                  >
                    <item.icon size={13} style={{ flexShrink:0, opacity:active?1:.65 }}/>
                    <span style={{ flex:1 }}>{item.label}</span>
                    {active && <ChevronRight size={10} style={{ opacity:.4 }}/>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:"10px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 10px", borderRadius:"var(--r)", fontSize:12, color:"var(--text-4)", textDecoration:"none", transition:"all .12s" }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background="var(--bg-alt)"; (e.currentTarget as HTMLElement).style.color="var(--text)"; }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.color="var(--text-4)"; }}>
            <LogOut size={13}/> Exit Admin
          </Link>
        </div>
      </aside>

      {/* Backdrop */}
      {open && <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:59, backdropFilter:"blur(2px)" }}/>}

      {/* ── Main ── */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <button onClick={() => setOpen(true)} className="admin-menu-btn" aria-label="Open menu">
            <Menu size={16}/>
          </button>
          <div style={{ flex:1, display:"flex", alignItems:"center", gap:5, overflow:"hidden" }}>
            {crumbs.map((seg,i) => (
              <span key={seg+i} style={{ display:"flex", alignItems:"center", gap:5, flexShrink:i===crumbs.length-1?0:1, minWidth:0 }}>
                {i>0 && <ChevronRight size={11} style={{ color:"var(--text-4)", flexShrink:0 }}/>}
                <span style={{ fontSize:13, color:i===crumbs.length-1?"var(--text)":"var(--text-4)", fontWeight:i===crumbs.length-1?600:400, textTransform:"capitalize", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {seg.replace(/-/g," ")}
                </span>
              </span>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, fontWeight:700, color:"var(--accent)", background:"rgba(5,150,105,.08)", border:"1px solid rgba(5,150,105,.2)", padding:"3px 9px", borderRadius:"var(--r-f)", whiteSpace:"nowrap" }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:"var(--accent)", display:"inline-block" }}/>Live
            </span>
            <button onClick={toggle} style={{ width:32, height:32, borderRadius:"50%", border:"1.5px solid var(--border)", background:"var(--bg-alt)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-3)" }}>
              {theme==="dark"?<Sun size={13}/>:<Moon size={13}/>}
            </button>
            <Link href="/" style={{ width:32, height:32, borderRadius:"50%", border:"1.5px solid var(--border)", background:"var(--bg-alt)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-4)", textDecoration:"none" }} title="View site">
              <Zap size={13}/>
            </Link>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
