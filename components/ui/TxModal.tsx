"use client";
import { ArrowRight, X, Shield, ExternalLink } from "lucide-react";
import { useAuth, EXPLORER_URL } from "../../lib/auth";

export default function TxModal() {
  const { txModal, confirmTx, cancelTx } = useAuth();
  const p = txModal.preview;
  if (!txModal.open || !p) return null;

  const short = (addr: string) => addr ? `${addr.slice(0,10)}…${addr.slice(-6)}` : "—";

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:400, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e => { if (e.target === e.currentTarget) cancelTx(); }}
    >
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.6)", backdropFilter:"blur(5px)" }}/>

      <div style={{ position:"relative", width:"100%", maxWidth:460, background:"var(--bg-card)", borderRadius:"var(--r-xl) var(--r-xl) 0 0", border:"1.5px solid var(--border)", borderBottom:"none", boxShadow:"var(--shadow-lg)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"20px 20px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:"var(--brand-muted)", border:"1.5px solid var(--brand-border)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Shield size={18} style={{ color:"var(--brand)" }}/>
            </div>
            <div>
              <h3 style={{ fontFamily:"Outfit,sans-serif", fontSize:17, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Sign Transaction</h3>
              <p style={{ fontSize:11, color:"var(--text-4)", marginTop:1 }}>Arc Testnet · USDC</p>
            </div>
          </div>
          <button onClick={cancelTx} style={{ width:30, height:30, borderRadius:"50%", border:"1.5px solid var(--border)", background:"var(--bg-alt)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-4)" }}>
            <X size={13}/>
          </button>
        </div>

        {/* Tx type pill */}
        <div style={{ padding:"14px 20px 0" }}>
          <span style={{ display:"inline-block", padding:"4px 12px", background:"var(--brand-muted)", border:"1px solid var(--brand-border)", borderRadius:"var(--r-f)", fontSize:11, fontWeight:700, color:"var(--brand)", fontFamily:"Outfit,sans-serif" }}>
            {p.type}
          </span>
        </div>

        {/* Description */}
        <div style={{ padding:"10px 20px 0" }}>
          <p style={{ fontSize:13, color:"var(--text-2)", fontWeight:600, lineHeight:1.5 }}>{p.description}</p>
        </div>

        {/* Details card */}
        <div style={{ margin:"14px 20px 0", background:"var(--bg-alt)", border:"1.5px solid var(--border)", borderRadius:"var(--r-lg)", overflow:"hidden" }}>
          {/* Amount */}
          <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:"var(--text-4)", fontWeight:600 }}>Amount</span>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"Outfit,sans-serif", fontSize:22, fontWeight:900, color:"var(--accent)" }}>{p.amount}</div>
              <div style={{ fontSize:11, color:"var(--text-4)" }}>{p.token}</div>
            </div>
          </div>
          {/* To */}
          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:"var(--text-4)", fontWeight:600 }}>To</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:`linear-gradient(135deg,hsl(${parseInt(p.to.slice(2,4)||"0",16)*1.4}deg,65%,55%),hsl(${parseInt(p.to.slice(4,6)||"0",16)*1.4}deg,55%,45%))`, flexShrink:0 }}/>
              <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12, color:"var(--text)", fontWeight:600 }}>{short(p.to)}</span>
              <a href={`${EXPLORER_URL}/address/${p.to}`} target="_blank" rel="noopener noreferrer" style={{ color:"var(--text-4)", display:"flex" }}>
                <ExternalLink size={10}/>
              </a>
            </div>
          </div>
          {/* Network */}
          <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:"var(--text-4)", fontWeight:600 }}>Network</span>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--accent)" }}/>
              <span style={{ fontSize:12, fontWeight:700, color:"var(--text-2)" }}>Arc Testnet</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div style={{ margin:"12px 20px 0", padding:"10px 12px", background:"rgba(217,119,6,.06)", border:"1px solid rgba(217,119,6,.18)", borderRadius:"var(--r-md)", display:"flex", gap:7, alignItems:"flex-start" }}>
          <Shield size={12} style={{ color:"#d97706", flexShrink:0, marginTop:1 }}/>
          <p style={{ fontSize:11, color:"#d97706", lineHeight:1.55 }}>
            You are signing a transaction on the Arc Testnet blockchain. Transactions are irreversible.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ padding:"16px 20px 36px", display:"grid", gridTemplateColumns:"1fr 2fr", gap:10 }}>
          <button onClick={cancelTx} className="btn btn-secondary" style={{ justifyContent:"center", height:50, fontSize:14 }}>
            Cancel
          </button>
          <button onClick={confirmTx} className="btn btn-primary" style={{ justifyContent:"center", height:50, fontWeight:800, fontSize:15 }}>
            Confirm & Sign <ArrowRight size={15}/>
          </button>
        </div>
      </div>
    </div>
  );
}
