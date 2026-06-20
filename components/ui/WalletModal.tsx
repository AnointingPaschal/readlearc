"use client";
import { useEffect, useState } from "react";
import { X, Wallet, ExternalLink, AlertTriangle } from "lucide-react";
import { useWallet, type WalletInfo } from "../../lib/wallet";

const WALLET_COLORS: Record<string, string> = {
  "io.metamask":          "#F6851B",
  "com.coinbase.wallet":  "#0052FF",
  "com.brave.wallet":     "#FF2050",
  "io.rabby":             "#7B3FE4",
  "me.rainbow":           "#FF6B6B",
  "legacy":               "#6d28d9",
};

const WALLET_DESCRIPTIONS: Record<string, string> = {
  "io.metamask":         "The most popular Web3 wallet",
  "com.coinbase.wallet": "By Coinbase, trusted by millions",
  "com.brave.wallet":    "Built into Brave browser",
  "io.rabby":            "Multi-chain portfolio wallet",
  "me.rainbow":          "Beautiful Ethereum wallet",
  "legacy":              "Your browser wallet",
};

function WalletIcon({ wallet }: { wallet: WalletInfo }) {
  const color = WALLET_COLORS[wallet.rdns] || "#6d28d9";
  if (wallet.icon && wallet.icon.startsWith("data:")) {
    return <img src={wallet.icon} alt={wallet.name} style={{ width:44, height:44, borderRadius:12 }}/>;
  }
  return (
    <div style={{ width:44, height:44, borderRadius:12, background:color, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:20, fontFamily:"Outfit,sans-serif" }}>
      {wallet.name[0]}
    </div>
  );
}

export default function WalletModal() {
  const { modalOpen, setModalOpen, wallets, connectWith, busy } = useWallet();
  const [connecting, setConnecting] = useState<string|null>(null);

  async function handleConnect(wallet: WalletInfo) {
    setConnecting(wallet.uuid);
    try { await connectWith(wallet); }
    finally { setConnecting(null); }
  }

  if (!modalOpen) return null;

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
    >
      {/* Backdrop */}
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.55)", backdropFilter:"blur(4px)" }}/>

      {/* Modal */}
      <div style={{ position:"relative", width:"100%", maxWidth:400, background:"var(--bg-card)", borderRadius:"var(--r-xl)", border:"1px solid var(--border)", boxShadow:"var(--shadow-lg)", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"20px 20px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)" }}>
          <div>
            <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:18, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Connect Wallet</h2>
            <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>Choose your wallet to continue</p>
          </div>
          <button onClick={() => setModalOpen(false)} style={{ width:32, height:32, borderRadius:"50%", border:"1.5px solid var(--border)", background:"var(--bg-alt)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-3)" }}>
            <X size={14}/>
          </button>
        </div>

        {/* Wallet list */}
        <div style={{ padding:"12px 12px 8px" }}>
          {wallets.length === 0 ? (
            <div style={{ padding:"28px 16px", textAlign:"center" }}>
              <Wallet size={36} style={{ color:"var(--text-4)", marginBottom:12 }}/>
              <p style={{ fontSize:14, fontWeight:600, color:"var(--text-3)", marginBottom:6 }}>No wallet found</p>
              <p style={{ fontSize:12, color:"var(--text-4)", marginBottom:16, lineHeight:1.6 }}>
                Install a wallet browser extension to get started. MetaMask is the most popular choice.
              </p>
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"
                className="btn btn-primary btn-sm" style={{ display:"inline-flex" }}>
                Install MetaMask <ExternalLink size={12}/>
              </a>
            </div>
          ) : (
            wallets.map(wallet => {
              const isConnecting = connecting === wallet.uuid;
              const desc = WALLET_DESCRIPTIONS[wallet.rdns] || "Browser wallet";
              return (
                <button
                  key={wallet.uuid}
                  onClick={() => handleConnect(wallet)}
                  disabled={!!connecting}
                  style={{
                    width:"100%", display:"flex", alignItems:"center", gap:14, padding:"13px 10px",
                    background:"transparent", border:"1.5px solid transparent", borderRadius:"var(--r-lg)",
                    cursor: connecting ? "wait" : "pointer", transition:"all .15s", textAlign:"left",
                    marginBottom:4, opacity: connecting && !isConnecting ? .5 : 1,
                  }}
                  onMouseEnter={e => { if (!connecting) { (e.currentTarget as any).style.background="var(--bg-alt)"; (e.currentTarget as any).style.borderColor="var(--border)"; }}}
                  onMouseLeave={e => { (e.currentTarget as any).style.background="transparent"; (e.currentTarget as any).style.borderColor="transparent"; }}
                >
                  <WalletIcon wallet={wallet}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:700, color:"var(--text)" }}>{wallet.name}</div>
                    <div style={{ fontSize:12, color:"var(--text-4)", marginTop:1 }}>{desc}</div>
                  </div>
                  {isConnecting ? (
                    <div style={{ width:18, height:18, border:"2px solid var(--border)", borderTopColor:"var(--brand)", borderRadius:"50%" }} className="spin"/>
                  ) : (
                    <div style={{ width:7, height:7, borderRadius:"50%", background:"var(--accent)" }} title="Detected"/>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Arc info */}
        <div style={{ margin:"0 12px 12px", padding:"11px 14px", background:"var(--brand-muted)", border:"1px solid var(--brand-border)", borderRadius:"var(--r-md)", display:"flex", gap:9, alignItems:"flex-start" }}>
          <AlertTriangle size={13} style={{ color:"var(--brand)", flexShrink:0, marginTop:1 }}/>
          <p style={{ fontSize:11, color:"var(--text-3)", lineHeight:1.6 }}>
            Readlearc runs on <strong style={{ color:"var(--brand)" }}>Arc Testnet</strong>. We'll automatically prompt you to add it after connecting.
          </p>
        </div>

        {/* What is a wallet */}
        <div style={{ padding:"10px 20px 16px", textAlign:"center" }}>
          <a href="https://ethereum.org/en/wallets/" target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:"var(--brand)", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4 }}>
            What is a wallet? <ExternalLink size={10}/>
          </a>
        </div>
      </div>
    </div>
  );
}
