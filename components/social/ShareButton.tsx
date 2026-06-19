
"use client";
import { useState } from "react";
import { Share2, Copy, Check, ExternalLink, Link } from "lucide-react";

interface Props { title: string; url?: string; }

export default function ShareButton({ title, url }: Props) {
  const [copied, setCopied]   = useState(false);
  const [menuOpen,setMenuOpen]= useState(false);
  const shareUrl = url || (typeof window!=="undefined" ? window.location.href : "");

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true); setMenuOpen(false); setTimeout(()=>setCopied(false),2500);
  }

  function shareNative() {
    if (navigator.share) { navigator.share({ title, url: shareUrl }); return; }
    setMenuOpen(v=>!v);
  }

  return (
    <div style={{ position:"relative" }}>
      <button onClick={shareNative} title="Share" style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:"var(--rfull)", border:"1.5px solid var(--border)", background:"var(--bg-alt)", cursor:"pointer", fontSize:12, fontWeight:600, color:"var(--text-3)", transition:"all .15s" }}
        onMouseEnter={e=>{(e.currentTarget as any).style.borderColor="var(--brand)";(e.currentTarget as any).style.color="var(--brand)"}}
        onMouseLeave={e=>{(e.currentTarget as any).style.borderColor="var(--border)";(e.currentTarget as any).style.color="var(--text-3)"}}
      >
        {copied ? <><Check size={13} style={{ color:"var(--accent)" }}/>Copied!</> : <><Share2 size={13}/>Share</>}
      </button>
      {menuOpen && <>
        <div style={{ position:"fixed", inset:0, zIndex:100 }} onClick={()=>setMenuOpen(false)}/>
        <div className="card" style={{ position:"absolute", right:0, top:"calc(100%+8px)", zIndex:110, minWidth:180, padding:6, boxShadow:"var(--shadow-lg)" }}>
          <button onClick={copyLink} style={{ width:"100%", padding:"9px 12px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:9, fontSize:13, color:"var(--text-2)", borderRadius:"var(--r2)", fontWeight:500 }}
            onMouseEnter={e=>(e.currentTarget as any).style.background="var(--bg-alt)"}
            onMouseLeave={e=>(e.currentTarget as any).style.background="none"}
          ><Link size={13} style={{ color:"var(--text-4)" }}/>Copy link</button>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
            style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 12px", textDecoration:"none", fontSize:13, color:"var(--text-2)", borderRadius:"var(--r2)", fontWeight:500 }}
            onMouseEnter={e=>(e.currentTarget as any).style.background="var(--bg-alt)"}
            onMouseLeave={e=>(e.currentTarget as any).style.background="none"}
          ><ExternalLink size={13} style={{ color:"#1d9bf0" }}/>Share on X</a>
        </div>
      </>}
    </div>
  );
}
