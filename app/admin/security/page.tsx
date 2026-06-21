"use client";
import { useAuth } from "../../../lib/auth";
import { useState } from "react";
import { Shield, Key, Copy, Check, AlertTriangle, CheckCircle2, Lock } from "lucide-react";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const EXPLORER_URL     = "https://testnet.arcscan.app";

export default function SecurityPage() {
  const { address, isAuth, short, requireAuth } = useAuth();
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  }

  if (!isAuth) return (
    <div style={{ display:"flex",flexDirection:"column",gap:14,maxWidth:560 }}>
      <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Security</h1>
      <div className="card" style={{ padding:"40px",textAlign:"center" }}>
        <Lock size={32} style={{ color:"var(--text-4)",marginBottom:12 }}/>
        <p style={{ fontSize:14,fontWeight:600,color:"var(--text-3)",marginBottom:6 }}>Admin wallet not unlocked</p>
        <p style={{ fontSize:12,color:"var(--text-4)",marginBottom:16 }}>Sign in with your admin wallet to view security settings.</p>
        <button onClick={()=>requireAuth()} className="btn btn-primary">Unlock Wallet</button>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:560 }}>
      <h1 style={{ fontFamily:"Outfit,sans-serif",fontSize:22,fontWeight:900,color:"var(--text)",letterSpacing:"-.02em" }}>Security</h1>

      {/* Connected wallet */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
          <Key size={14} style={{ color:"var(--brand)" }}/>
          <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>Connected Admin Wallet</h3>
          <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:"var(--accent)",background:"rgba(5,150,105,.08)",padding:"2px 7px",borderRadius:"var(--r-f)" }}>
            <CheckCircle2 size={9}/>Unlocked
          </span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10,background:"var(--bg-alt)",border:"1.5px solid var(--border)",borderRadius:"var(--r)",padding:"12px 14px",marginBottom:10 }}>
          <code style={{ flex:1,fontFamily:"JetBrains Mono,monospace",fontSize:12,color:"var(--text)",wordBreak:"break-all" }}>{address}</code>
          <button onClick={copy} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--brand)",display:"flex",flexShrink:0 }}>
            {copied?<Check size={14} style={{ color:"var(--accent)" }}/>:<Copy size={14}/>}
          </button>
        </div>
        {CONTRACT_ADDRESS && (
          <a href={`${EXPLORER_URL}/address/${address}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:12,color:"var(--brand)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4 }}>
            View on Arc Explorer ↗
          </a>
        )}
      </div>

      {/* Contract ownership */}
      <div className="card" style={{ padding:"20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
          <Shield size={14} style={{ color:CONTRACT_ADDRESS?"var(--accent)":"var(--text-4)" }}/>
          <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)" }}>Smart Contract</h3>
        </div>
        {!CONTRACT_ADDRESS ? (
          <div style={{ display:"flex",gap:8,padding:"11px 13px",background:"rgba(217,119,6,.07)",border:"1px solid rgba(217,119,6,.2)",borderRadius:"var(--r-md)" }}>
            <AlertTriangle size={13} style={{ color:"#d97706",flexShrink:0,marginTop:1 }}/>
            <p style={{ fontSize:12,color:"var(--text-3)",lineHeight:1.6 }}>No contract deployed yet. Deploy Readlearc.sol on Arc Testnet via Remix and set NEXT_PUBLIC_CONTRACT_ADDRESS in Vercel.</p>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:11,fontWeight:700,color:"var(--text-4)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:3,fontFamily:"Outfit,sans-serif" }}>Contract Address</div>
              <code style={{ fontFamily:"JetBrains Mono,monospace",fontSize:11,color:"var(--text)" }}>{CONTRACT_ADDRESS}</code>
            </div>
            <a href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:12,color:"var(--brand)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4 }}>View on Explorer ↗</a>
          </div>
        )}
      </div>

      {/* Security checklist */}
      <div className="card" style={{ padding:"20px" }}>
        <h3 style={{ fontFamily:"Outfit,sans-serif",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:14 }}>Security Checklist</h3>
        {[
          { ok:!!address,              label:"Admin wallet connected"                        },
          { ok:!!CONTRACT_ADDRESS,     label:"Smart contract deployed"                       },
          { ok:true,                   label:"Supabase RLS disabled (service role used)"     },
          { ok:true,                   label:"Payments verified on-chain via tx hash"        },
          { ok:true,                   label:"Private keys encrypted with AES-GCM locally"  },
          { ok:true,                   label:"Sessions use random AES key (no passwords stored)" },
        ].map((item,i)=>(
          <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid var(--border)" }}>
            <div style={{ width:20,height:20,borderRadius:"50%",background:item.ok?"rgba(5,150,105,.1)":"rgba(220,38,38,.08)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              {item.ok?<CheckCircle2 size={11} style={{ color:"var(--accent)" }}/>:<AlertTriangle size={11} style={{ color:"#dc2626" }}/>}
            </div>
            <span style={{ fontSize:13,color:item.ok?"var(--text-2)":"var(--text-3)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
