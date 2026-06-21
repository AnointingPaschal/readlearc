"use client";
import { useState } from "react";
import { Copy, Check, ExternalLink, FileCode, AlertTriangle, CheckCircle2 } from "lucide-react";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const USDC_ADDRESS     = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
const EXPLORER_URL     = "https://testnet.arcscan.app";

export default function ContractsPage() {
  const [copiedField, setCopied] = useState<string|null>(null);

  function copy(text:string, field:string) {
    navigator.clipboard.writeText(text);
    setCopied(field); setTimeout(()=>setCopied(null),2000);
  }

  const configured = !!CONTRACT_ADDRESS;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:640 }}>
      <div>
        <h1 style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Smart Contracts</h1>
        <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>Arc Testnet contract addresses and deployment info</p>
      </div>

      {!configured && (
        <div style={{ padding:"13px 16px",background:"rgba(217,119,6,.07)",border:"1px solid rgba(217,119,6,.2)",borderRadius:"var(--r-md)",display:"flex",gap:10 }}>
          <AlertTriangle size={14} style={{ color:"#d97706",flexShrink:0,marginTop:1 }}/>
          <div>
            <p style={{ fontSize:13,fontWeight:600,color:"#d97706",marginBottom:4 }}>Contract not deployed yet</p>
            <p style={{ fontSize:12,color:"var(--text-3)",lineHeight:1.65 }}>
              Deploy <code style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11 }}>contracts/Readlearc.sol</code> on Remix IDE at Arc Testnet (Chain 5042002),
              then add <code style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11 }}>NEXT_PUBLIC_CONTRACT_ADDRESS</code> to Vercel and redeploy.
            </p>
          </div>
        </div>
      )}

      {/* Contract cards */}
      {[
        { label:"Readlearc Contract",  addr:CONTRACT_ADDRESS||"Not deployed", configured, desc:"Handles article payments, fee splits, and writer verification" },
        { label:"USDC Token Contract", addr:USDC_ADDRESS, configured:true, desc:"Circle's USDC stablecoin on Arc Testnet (6 decimals)" },
      ].map(c=>(
        <div key={c.label} className="card" style={{ padding:"18px" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
            <FileCode size={14} style={{ color:c.configured?"var(--accent)":"var(--text-4)" }}/>
            <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>{c.label}</h3>
            {c.configured?<span style={{ display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:"var(--accent)",background:"rgba(5,150,105,.08)",padding:"2px 7px",borderRadius:"var(--r-f)" }}><CheckCircle2 size={9}/>Configured</span>:<span style={{ fontSize:10,fontWeight:700,color:"#d97706",background:"rgba(217,119,6,.08)",padding:"2px 7px",borderRadius:"var(--r-f)" }}>Not Set</span>}
          </div>
          <p style={{ fontSize:12,color:"var(--text-4)",marginBottom:10 }}>{c.desc}</p>
          {c.configured && c.addr!=="Not deployed" && (
            <>
              <div style={{ display:"flex",alignItems:"center",gap:8,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"10px 14px",marginBottom:10 }}>
                <code style={{ flex:1,fontFamily:"JetBrains Mono,monospace",fontSize:12,color:"var(--text)",wordBreak:"break-all" }}>{c.addr}</code>
                <button onClick={()=>copy(c.addr,c.label)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--brand)",display:"flex",flexShrink:0 }}>
                  {copiedField===c.label?<Check size={14} style={{ color:"var(--accent)" }}/>:<Copy size={14}/>}
                </button>
              </div>
              <a href={`${EXPLORER_URL}/address/${c.addr}`} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:12,color:"var(--brand)",textDecoration:"none",fontWeight:600 }}>
                View on Arc Explorer <ExternalLink size={11}/>
              </a>
            </>
          )}
        </div>
      ))}

      {/* Deployment guide */}
      <div className="card" style={{ padding:"18px" }}>
        <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14 }}>Deployment Guide</h3>
        {[
          { n:1, text:"Open remix.ethereum.org in your browser" },
          { n:2, text:"Create contracts/Readlearc.sol and paste from your GitHub repo" },
          { n:3, text:"Compile with Solidity 0.8.24, optimizer 200 runs" },
          { n:4, text:"Set MetaMask to Arc Testnet (Chain 5042002, RPC: https://rpc.testnet.arc.network)" },
          { n:5, text:'Deploy with: _usdc = 0x3600000000000000000000000000000000000000, _treasury = your wallet' },
          { n:6, text:"Copy the deployed address from Remix" },
          { n:7, text:"Add NEXT_PUBLIC_CONTRACT_ADDRESS to Vercel env vars → Redeploy" },
        ].map(s=>(
          <div key={s.n} style={{ display:"flex",gap:12,marginBottom:10 }}>
            <div style={{ width:24,height:24,borderRadius:"50%",background:"var(--brand-muted)",border:"1px solid var(--brand-border)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Outfit,sans-serif",fontSize:11,fontWeight:700,color:"var(--brand)",flexShrink:0 }}>{s.n}</div>
            <p style={{ fontSize:13,color:"var(--text-2)",lineHeight:1.6,paddingTop:2 }}>{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
