"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Wifi, X } from "lucide-react";
import { useWallet } from "../../lib/wallet";

export default function NetworkGuard() {
  const { isConnected, isWrongNetwork, chainId, switchToArc } = useWallet();
  const [switching,    setSwitching]    = useState(false);
  const [error,        setError]        = useState("");
  const [done,         setDone]         = useState(false);
  const [dismissed,    setDismissed]    = useState(false);
  const [autoTriggered,setAutoTriggered]= useState(false);

  // Auto-prompt once when wrong network detected
  useEffect(() => {
    if (!isWrongNetwork || autoTriggered || dismissed) return;
    const t = setTimeout(() => { setAutoTriggered(true); doSwitch(); }, 1000);
    return () => clearTimeout(t);
  }, [isWrongNetwork]);

  // Success flash when chain changes to Arc
  useEffect(() => {
    if (isConnected && !isWrongNetwork && switching) {
      setDone(true); setSwitching(false);
      setTimeout(() => setDone(false), 3500);
    }
  }, [isConnected, isWrongNetwork, switching]);

  async function doSwitch() {
    setSwitching(true); setError("");
    try { await switchToArc(); }
    catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("rejected") || msg.includes("denied")) setError("Rejected — click 'Add Arc' to try again.");
      else setError(msg.slice(0, 80) || "Failed to switch");
    }
    finally { setSwitching(false); }
  }

  if (!isConnected) return null;

  if (done) return (
    <div style={{ position:"fixed",top:"var(--header-h)",left:0,right:0,zIndex:55,background:"var(--accent)",color:"white",padding:"9px 20px",textAlign:"center",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 2px 12px rgba(5,150,105,.35)" }}>
      <CheckCircle2 size={14}/> Connected to Arc Testnet
    </div>
  );

  if (!isWrongNetwork || dismissed) return null;

  return (
    <div style={{ position:"fixed",top:"var(--header-h)",left:0,right:0,zIndex:55,background:"#d97706",color:"white",padding:"9px 16px",display:"flex",alignItems:"center",justifyContent:"center",gap:10,flexWrap:"wrap",boxShadow:"0 2px 12px rgba(217,119,6,.4)" }}>
      <AlertTriangle size={14} style={{ flexShrink:0 }}/>
      <span style={{ fontSize:13,fontWeight:600 }}>Wrong network (Chain {chainId}) — Arc Testnet required</span>
      <button onClick={doSwitch} disabled={switching} style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 14px",background:"rgba(255,255,255,.22)",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:"var(--r-f)",fontSize:12,fontWeight:700,color:"white",cursor:"pointer",flexShrink:0 }}>
        {switching
          ? <><div style={{ width:11,height:11,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"white",borderRadius:"50%"}} className="spin"/>Adding Arc…</>
          : <><Wifi size={12}/>Add Arc Testnet</>}
      </button>
      {error && <span style={{ fontSize:11,opacity:.85 }}>{error}</span>}
      <button onClick={()=>setDismissed(true)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.7)",padding:4,display:"flex",marginLeft:"auto",flexShrink:0 }}>
        <X size={14}/>
      </button>
    </div>
  );
}
