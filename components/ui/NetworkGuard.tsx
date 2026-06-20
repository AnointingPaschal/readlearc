"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Wifi, X } from "lucide-react";
import { useAccount } from "wagmi";
import { arcTestnet } from "../../lib/wagmi";

const ARC_CHAIN_HEX = `0x${(5042002).toString(16)}`; // 0x4CE912

async function addArcToWallet() {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found");

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_HEX }],
    });
  } catch (err: any) {
    // 4902 = chain not yet added
    if (err.code === 4902 || err.code === -32603) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId:            ARC_CHAIN_HEX,
          chainName:          "Arc Testnet",
          nativeCurrency:     { name:"USDC", symbol:"USDC", decimals:6 },
          rpcUrls:            ["https://rpc.testnet.arc.network"],
          blockExplorerUrls:  ["https://testnet.arcscan.app"],
        }],
      });
    } else {
      throw err;
    }
  }
}

export default function NetworkGuard() {
  const { isConnected, chainId } = useAccount();
  const [switching,    setSwitching]    = useState(false);
  const [done,         setDone]         = useState(false);
  const [error,        setError]        = useState("");
  const [dismissed,    setDismissed]    = useState(false);
  const [autoPrompted, setAutoPrompted] = useState(false);

  const isWrong = isConnected && chainId !== undefined && chainId !== arcTestnet.id;

  // Auto-prompt once per session
  useEffect(() => {
    if (!isWrong || autoPrompted || dismissed) return;
    const t = setTimeout(() => {
      setAutoPrompted(true);
      doSwitch();
    }, 1000);
    return () => clearTimeout(t);
  }, [isWrong, autoPrompted, dismissed]);

  // Reset when chain changes
  useEffect(() => {
    if (chainId === arcTestnet.id) { setDone(true); setSwitching(false); setTimeout(()=>setDone(false),4000); }
  }, [chainId]);

  async function doSwitch() {
    if (switching) return;
    setSwitching(true); setError("");
    try {
      await addArcToWallet();
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("rejected") || msg.includes("denied") || msg.includes("User rejected")) {
        setError("Rejected — click 'Add Arc' to try again.");
      } else if (msg.includes("No wallet")) {
        setError("No wallet extension found.");
      } else {
        setError(msg.slice(0, 80));
      }
    } finally {
      setSwitching(false);
    }
  }

  if (!isConnected) return null;

  // Success flash
  if (done) return (
    <div style={{ position:"fixed", top:"var(--header-h)", left:0, right:0, zIndex:55, background:"var(--accent)", color:"white", padding:"9px 20px", textAlign:"center", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 2px 12px rgba(5,150,105,.4)" }}>
      <CheckCircle2 size={14}/> Connected to Arc Testnet
    </div>
  );

  if (!isWrong || dismissed) return null;

  return (
    <div style={{ position:"fixed", top:"var(--header-h)", left:0, right:0, zIndex:55, background:"#d97706", color:"white", padding:"9px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:10, flexWrap:"wrap", boxShadow:"0 2px 12px rgba(217,119,6,.4)" }}>
      <AlertTriangle size={14} style={{ flexShrink:0 }}/>
      <span style={{ fontSize:13, fontWeight:600 }}>
        Wrong network (Chain ID: {chainId}) — Readlearc requires Arc Testnet
      </span>

      <button
        onClick={doSwitch}
        disabled={switching}
        style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 14px", background:"rgba(255,255,255,.22)", border:"1.5px solid rgba(255,255,255,.4)", borderRadius:"var(--r-f)", fontSize:12, fontWeight:700, color:"white", cursor:"pointer", flexShrink:0 }}
      >
        {switching
          ? <><div style={{ width:11,height:11,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"white",borderRadius:"50%" }} className="spin"/>Adding Arc…</>
          : <><Wifi size={12}/>Add Arc Testnet</>
        }
      </button>

      {error && <span style={{ fontSize:11, opacity:.85, fontStyle:"italic" }}>{error}</span>}

      <button onClick={() => setDismissed(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,.7)", padding:4, display:"flex", marginLeft:"auto", flexShrink:0 }}>
        <X size={14}/>
      </button>
    </div>
  );
}
