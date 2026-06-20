"use client";
import { Wallet } from "lucide-react";
import { useConnectModal } from "@rainbow-me/rainbowkit";

interface Props {
  title?: string;
  body?:  string;
  icon?:  React.ElementType;
}

export default function ConnectGate({
  title = "Connect your wallet",
  body  = "Connect your wallet to continue.",
  icon: Icon = Wallet,
}: Props) {
  const { openConnectModal } = useConnectModal();

  return (
    <div style={{ minHeight:"calc(100vh - var(--header-h))", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px 16px" }}>
      <div className="card" style={{ maxWidth:440, width:"100%", padding:"clamp(28px,5vw,52px) clamp(20px,4vw,36px)", textAlign:"center" }}>
        <div style={{ width:60, height:60, borderRadius:"50%", background:"var(--brand-muted)", border:"1.5px solid var(--brand-border)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px" }}>
          <Icon size={26} style={{ color:"var(--brand)" }}/>
        </div>
        <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:"clamp(18px,4vw,24px)", fontWeight:900, color:"var(--text)", marginBottom:10, letterSpacing:"-0.02em" }}>{title}</h2>
        <p style={{ color:"var(--text-3)", fontSize:14, lineHeight:1.68, marginBottom:26 }}>{body}</p>
        <button
          onClick={openConnectModal}
          className="btn btn-primary btn-lg"
          style={{ width:"100%", justifyContent:"center" }}
        >
          <Wallet size={16}/> Connect Wallet
        </button>
      </div>
    </div>
  );
}
