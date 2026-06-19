
"use client";
import { useState } from "react";
import { Copy, Check, ExternalLink, FileCode } from "lucide-react";
import { CONTRACT_ADDRESS, USDC_ADDRESS, EXPLORER_URL, IS_CONFIGURED } from "../../../../lib/chain";

export default function ContractsPage() {
  const [copied, setCopied] = useState("");
  function copy(val: string, key: string) { navigator.clipboard.writeText(val); setCopied(key); setTimeout(()=>setCopied(""),2000); }
  const contracts = [
    { label:"Readlearc Contract", address:CONTRACT_ADDRESS, desc:"Main pay-per-read contract — articles, payments, fee splits", color:"var(--brand)" },
    { label:"USDC (ERC-20)",      address:USDC_ADDRESS,     desc:"Circle USDC ERC-20 interface on Arc Testnet",               color:"#059669"      },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:640 }}>
      <div><h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-0.02em" }}>Contracts</h1><p style={{ color:"var(--text-4)", fontSize:12, marginTop:2 }}>Deployed addresses on Arc Testnet</p></div>
      {!IS_CONFIGURED && <div style={{ padding:"12px 14px", background:"rgba(220,38,38,.06)", border:"1px solid rgba(220,38,38,.18)", borderRadius:"var(--r)", fontSize:12, color:"#dc2626", fontWeight:600 }}>⚠ Set NEXT_PUBLIC_CONTRACT_ADDRESS and NEXT_PUBLIC_USDC_ADDRESS in Vercel → Settings → Environment Variables, then redeploy.</div>}
      {contracts.map(c => (
        <div key={c.label} className="card" style={{ padding:"20px", borderLeft:`3px solid ${c.color}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}><FileCode size={14} style={{ color:c.color }}/><h2 style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{c.label}</h2></div>
          <p style={{ fontSize:12, color:"var(--text-3)", lineHeight:1.6, marginBottom:12 }}>{c.desc}</p>
          {c.address ? (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 13px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--r)" }}>
              <code style={{ fontFamily:"JetBrains Mono,monospace", fontSize:11, color:"var(--text-2)", flex:1, overflow:"hidden", textOverflow:"ellipsis" }}>{c.address}</code>
              <button onClick={() => copy(c.address, c.label)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-4)", display:"flex", flexShrink:0 }}>
                {copied===c.label ? <Check size={14} style={{ color:"#059669" }}/> : <Copy size={14}/>}
              </button>
              <a href={`${EXPLORER_URL}/address/${c.address}`} target="_blank" rel="noopener noreferrer" style={{ color:"var(--brand)", display:"flex", flexShrink:0 }}><ExternalLink size={14}/></a>
            </div>
          ) : <div style={{ padding:"10px 13px", background:"rgba(220,38,38,.04)", border:"1px solid rgba(220,38,38,.14)", borderRadius:"var(--r)", fontSize:12, color:"#dc2626" }}>Not configured — add env var in Vercel</div>}
        </div>
      ))}
    </div>
  );
}
