"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useWallet, ARC } from "../../lib/wallet";

type Phase = "hidden"|"showing"|"switching"|"done";

export default function NetworkGuard() {
  const { connected, wrongNetwork, chainId, addArc } = useWallet();
  const [phase, setPhase] = useState<Phase>("hidden");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!connected || !wrongNetwork) { setPhase("hidden"); return; }
    // Auto-prompt after short delay
    const t = setTimeout(() => { setPhase("showing"); trySwitch(); }, 900);
    return () => clearTimeout(t);
  }, [connected, wrongNetwork]);

  // Watch for successful switch
  useEffect(() => {
    if (phase === "switching" && chainId === ARC.chainId) {
      setPhase("done");
      setTimeout(() => setPhase("hidden"), 3000);
    }
  }, [chainId, phase]);

  async function trySwitch() {
    setPhase("switching"); setError("");
    try { await addArc(); }
    catch (e: any) {
      setError(e.code === 4001 ? "Rejected — click 'Add Arc' to try again." : (e.message||"Failed").slice(0,70));
      setPhase("showing");
    }
  }

  if (!connected) return null;

  if (phase === "done") return (
    <div style={{ position:"fixed",top:"var(--header-h)",left:0,right:0,zIndex:55,background:"var(--accent)",color:"white",textAlign:"center",padding:"9px",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:7 }}>
      <CheckCircle2 size={15}/>Connected to Arc Testnet
    </div>
  );

  if (phase === "hidden" || !wrongNetwork) return null;

  return (
    <div style={{ position:"fixed",top:"var(--header-h)",left:0,right:0,zIndex:55,background:"#92400e",color:"white",padding:"9px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",justifyContent:"center" }}>
      <AlertTriangle size={14}/>
      <span style={{ fontSize:13,fontWeight:600 }}>Wrong network (Chain ID: {chainId}) — Arc Testnet required</span>
      <button onClick={trySwitch} disabled={phase==="switching"} style={{ padding:"5px 14px",background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.4)",borderRadius:"var(--r-f)",fontSize:12,fontWeight:700,color:"white",cursor:"pointer" }}>
        {phase==="switching"
          ? <span style={{ display:"flex",alignItems:"center",gap:5 }}><span className="spin" style={{ width:10,height:10,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"white",borderRadius:"50%",display:"inline-block" }}/>Adding Arc…</span>
          : "Add Arc Testnet"}
      </button>
      {error && <span style={{ fontSize:11,opacity:.85 }}>{error}</span>}
      <button onClick={()=>setPhase("hidden")} style={{ marginLeft:"auto",background:"none",border:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",padding:4,display:"flex" }}><X size={14}/></button>
    </div>
  );
}
