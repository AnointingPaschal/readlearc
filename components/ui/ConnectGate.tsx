
"use client";
import { Wallet } from "lucide-react";
import { useWallet } from "../../lib/wallet";

interface Props { title?: string; body?: string; icon?: any; }
export default function ConnectGate({ title="Connect your wallet", body="Connect your MetaMask or EIP-1193 wallet to continue.", icon: Icon = Wallet }: Props) {
  const { connect, isConnecting } = useWallet();
  return (
    <div style={{ minHeight:"calc(100vh - 60px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px 16px" }}>
      <div className="card" style={{ maxWidth:420, width:"100%", padding:"clamp(28px,5vw,48px) clamp(20px,4vw,32px)", textAlign:"center" }}>
        <div style={{ width:60, height:60, borderRadius:"50%", background:"var(--brand-muted)", border:"2px solid var(--border-brand)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
          <Icon size={26} style={{ color:"var(--brand)" }} />
        </div>
        <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(18px,4vw,22px)", fontWeight:900, color:"var(--text)", marginBottom:10, letterSpacing:"-0.02em" }}>{title}</h2>
        <p style={{ color:"var(--text-3)", fontSize:14, lineHeight:1.65, marginBottom:24 }}>{body}</p>
        <button onClick={connect} disabled={isConnecting} className="btn btn-primary btn-lg" style={{ width:"100%", justifyContent:"center" }}>
          {isConnecting ? <><div style={{ width:15, height:15, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%" }} className="spin" /> Connecting…</> : <><Wallet size={16}/> Connect Wallet</>}
        </button>
      </div>
    </div>
  );
}
