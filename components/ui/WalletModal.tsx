"use client";
import { X, ExternalLink, Smartphone, Globe, Download } from "lucide-react";
import { useWallet, type WalletInfo } from "../../lib/wallet";

const COLORS: Record<string,string> = {
  "io.metamask":         "#F6851B",
  "com.coinbase.wallet": "#0052FF",
  "com.brave.wallet":    "#FF2050",
  "io.rabby":            "#7B3FE4",
  "me.rainbow":          "#FF6B6B",
  "legacy":              "#6d28d9",
};

const DESCS: Record<string,string> = {
  "io.metamask":         "The most popular Web3 wallet",
  "com.coinbase.wallet": "Trusted by millions worldwide",
  "com.brave.wallet":    "Built into Brave browser",
  "io.rabby":            "Multi-chain portfolio wallet",
  "me.rainbow":          "Beautiful Ethereum wallet",
  "legacy":              "Detected browser wallet",
};

function Avatar({ w }: { w: WalletInfo }) {
  const color = COLORS[w.rdns] || "#6d28d9";
  if (w.icon?.startsWith("data:")) {
    return <img src={w.icon} alt={w.name} style={{ width:46, height:46, borderRadius:14, flexShrink:0 }}/>;
  }
  return (
    <div style={{ width:46, height:46, borderRadius:14, background:color, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:22, fontFamily:"Outfit,sans-serif", flexShrink:0 }}>
      {w.name[0]}
    </div>
  );
}

export default function WalletModal() {
  const { modalOpen, setModalOpen, wallets, connectWith, busy, isMobile, hasWallet } = useWallet();

  if (!modalOpen) return null;

  // Get the current page URL for deep links
  const siteUrl = typeof window !== "undefined" ? window.location.hostname : "readlearc.vercel.app";
  const metamaskDeepLink = `https://metamask.app.link/dapp/${siteUrl}`;
  const coinbaseDeepLink = `https://go.cb-wallet.io/dapp?url=https://${siteUrl}`;

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
    >
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.6)", backdropFilter:"blur(6px)" }}/>

      <div style={{ position:"relative", width:"100%", maxWidth:420, background:"var(--bg-card)", borderRadius:"var(--r-xl)", border:"1.5px solid var(--border)", boxShadow:"var(--shadow-lg)", overflow:"hidden", maxHeight:"90vh", overflowY:"auto" }}>

        {/* Header */}
        <div style={{ padding:"20px 20px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <h2 style={{ fontFamily:"Outfit,sans-serif", fontSize:20, fontWeight:900, color:"var(--text)", letterSpacing:"-.02em" }}>Connect Wallet</h2>
            <p style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>Choose your wallet to continue</p>
          </div>
          <button onClick={() => setModalOpen(false)} style={{ width:34, height:34, borderRadius:"50%", border:"1.5px solid var(--border)", background:"var(--bg-alt)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-3)", flexShrink:0 }}>
            <X size={15}/>
          </button>
        </div>

        <div style={{ padding:"16px 16px 0" }}>

          {/* Detected wallets */}
          {wallets.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:10, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8, paddingLeft:4, fontFamily:"Outfit,sans-serif" }}>
                Detected Wallets
              </p>
              {wallets.map(w => (
                <button
                  key={w.uuid}
                  onClick={() => connectWith(w)}
                  disabled={busy}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"13px 12px", background:"transparent", border:"1.5px solid transparent", borderRadius:"var(--r-lg)", cursor:busy?"wait":"pointer", transition:"all .15s", textAlign:"left", marginBottom:6 }}
                  onMouseEnter={e => { if(!busy){(e.currentTarget as any).style.background="var(--bg-alt)";(e.currentTarget as any).style.borderColor="var(--border)";} }}
                  onMouseLeave={e => { (e.currentTarget as any).style.background="transparent";(e.currentTarget as any).style.borderColor="transparent"; }}
                >
                  <Avatar w={w}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:700, color:"var(--text)" }}>{w.name}</div>
                    <div style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>{DESCS[w.rdns] || "Browser wallet"}</div>
                  </div>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent)", flexShrink:0 }} title="Detected"/>
                </button>
              ))}
            </div>
          )}

          {/* Mobile: deep links to open in wallet browsers */}
          {isMobile && (
            <div style={{ marginBottom:16 }}>
              <p style={{ fontSize:10, fontWeight:700, color:"var(--text-4)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8, paddingLeft:4, fontFamily:"Outfit,sans-serif" }}>
                Open in Wallet App
              </p>

              {[
                { name:"MetaMask",        color:"#F6851B", letter:"M", url:metamaskDeepLink, desc:"Open site in MetaMask app" },
                { name:"Coinbase Wallet", color:"#0052FF", letter:"C", url:coinbaseDeepLink, desc:"Open site in Coinbase Wallet" },
              ].map(w => (
                <a key={w.name} href={w.url} target="_blank" rel="noopener noreferrer"
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"13px 12px", background:"transparent", border:"1.5px solid transparent", borderRadius:"var(--r-lg)", textDecoration:"none", transition:"all .15s", marginBottom:6 }}
                  onMouseEnter={e => { (e.currentTarget as any).style.background="var(--bg-alt)";(e.currentTarget as any).style.borderColor="var(--border)"; }}
                  onMouseLeave={e => { (e.currentTarget as any).style.background="transparent";(e.currentTarget as any).style.borderColor="transparent"; }}
                >
                  <div style={{ width:46, height:46, borderRadius:14, background:w.color, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:22, fontFamily:"Outfit,sans-serif", flexShrink:0 }}>
                    {w.letter}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"Outfit,sans-serif", fontSize:15, fontWeight:700, color:"var(--text)" }}>{w.name}</div>
                    <div style={{ fontSize:12, color:"var(--text-4)", marginTop:2 }}>{w.desc}</div>
                  </div>
                  <ExternalLink size={14} style={{ color:"var(--text-4)", flexShrink:0 }}/>
                </a>
              ))}
            </div>
          )}

          {/* No wallet at all */}
          {wallets.length === 0 && !isMobile && (
            <div style={{ padding:"24px 16px", textAlign:"center", marginBottom:8 }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"var(--bg-alt)", border:"1.5px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                <Globe size={24} style={{ color:"var(--text-4)" }}/>
              </div>
              <p style={{ fontSize:14, fontWeight:600, color:"var(--text-3)", marginBottom:6 }}>No wallet extension found</p>
              <p style={{ fontSize:12, color:"var(--text-4)", lineHeight:1.65, marginBottom:18 }}>
                Install a wallet browser extension to connect. MetaMask is the most popular choice for desktop browsers.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { name:"Install MetaMask",        url:"https://metamask.io/download/",    color:"#F6851B" },
                  { name:"Install Coinbase Wallet",  url:"https://www.coinbase.com/wallet",   color:"#0052FF" },
                  { name:"Install Brave Browser",    url:"https://brave.com/",               color:"#FF2050" },
                ].map(opt => (
                  <a key={opt.name} href={opt.url} target="_blank" rel="noopener noreferrer"
                    style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"10px 16px", border:`1.5px solid ${opt.color}30`, background:`${opt.color}09`, borderRadius:"var(--r-md)", color:opt.color, fontWeight:700, fontSize:13, textDecoration:"none" }}>
                    <Download size={13}/>{opt.name} <ExternalLink size={11}/>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Mobile: no wallet detected tip */}
          {wallets.length === 0 && isMobile && (
            <div style={{ padding:"12px 14px", background:"var(--bg-alt)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                <Smartphone size={13} style={{ color:"var(--brand)" }}/>
                <span style={{ fontSize:12, fontWeight:700, color:"var(--text-2)" }}>Using a mobile browser?</span>
              </div>
              <p style={{ fontSize:11, color:"var(--text-3)", lineHeight:1.65 }}>
                Tap "Open in MetaMask" or "Open in Coinbase Wallet" above. This opens Readlearc inside your wallet's built-in browser where you can connect and pay.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding:"12px 20px 18px", borderTop:"1px solid var(--border)", marginTop:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, color:"var(--text-4)" }}>
            Runs on{" "}
            <strong style={{ color:"var(--brand)" }}>Arc Testnet</strong>
            {" "}· USDC payments
          </span>
          <a href="https://ethereum.org/en/wallets/" target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:"var(--brand)", textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
            What's a wallet? <ExternalLink size={9}/>
          </a>
        </div>
      </div>
    </div>
  );
}
