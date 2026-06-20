"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, CheckCircle2, Wifi } from "lucide-react";
import { useWallet } from "../../lib/wallet";
import { arcTestnet } from "../../lib/wagmi";

/**
 * Renders a banner when the user is connected to the wrong network.
 * Auto-prompts to add/switch to Arc Testnet.
 */
export default function NetworkGuard() {
  const { isConnected, isWrongNetwork, switchToArc, chainId } = useWallet();
  const [switching, setSwitching] = useState(false);
  const [error,     setError]     = useState("");
  const [justSwitched, setJustSwitched] = useState(false);

  // Auto-prompt once when wrong network detected
  useEffect(() => {
    if (!isConnected || !isWrongNetwork) return;
    // Small delay so wallet is fully initialized
    const t = setTimeout(() => {
      handleSwitch();
    }, 1200);
    return () => clearTimeout(t);
  }, [isConnected, isWrongNetwork]);

  // Success flash
  useEffect(() => {
    if (isConnected && !isWrongNetwork && switching) {
      setJustSwitched(true);
      setSwitching(false);
      setTimeout(() => setJustSwitched(false), 3000);
    }
  }, [isConnected, isWrongNetwork, switching]);

  async function handleSwitch() {
    setSwitching(true); setError("");
    try {
      await switchToArc();
    } catch (e: any) {
      setError(e.message?.slice(0, 100) || "Failed to switch network");
      setSwitching(false);
    }
  }

  if (!isConnected) return null;

  if (justSwitched) return (
    <div style={{ background:"var(--accent)", color:"white", padding:"10px 20px", textAlign:"center", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
      <CheckCircle2 size={15}/> Connected to Arc Testnet
    </div>
  );

  if (!isWrongNetwork) return null;

  return (
    <div style={{ background:"#d97706", color:"white", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"center", gap:10, flexWrap:"wrap" }}>
      <AlertTriangle size={15} style={{ flexShrink:0 }}/>
      <span style={{ fontSize:13, fontWeight:600 }}>
        Wrong network {chainId ? `(Chain ${chainId})` : ""} — Arc Testnet required
      </span>
      <button
        onClick={handleSwitch}
        disabled={switching}
        style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 14px", background:"rgba(255,255,255,.22)", border:"1.5px solid rgba(255,255,255,.4)", borderRadius:"var(--r-f)", fontSize:12, fontWeight:700, color:"white", cursor:"pointer", transition:"all .15s" }}
        onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(255,255,255,.32)"}
        onMouseLeave={e => (e.currentTarget as any).style.background = "rgba(255,255,255,.22)"}
      >
        {switching
          ? <><Loader2 size={12} className="spin"/>Adding Arc Testnet…</>
          : <><Wifi size={12}/>Switch to Arc</>
        }
      </button>
      {error && <span style={{ fontSize:11, opacity:.8 }}>{error}</span>}
    </div>
  );
}
