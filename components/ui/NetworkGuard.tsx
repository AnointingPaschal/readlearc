"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Wifi, X, Loader2 } from "lucide-react";
import { useWallet, ARC_CHAIN_ID } from "../../lib/wallet";

export default function NetworkGuard() {
  const { isConnected, isWrongNetwork, chainId, switchToArc } = useWallet();

  const [state,      setState]     = useState<"idle"|"switching"|"success"|"error">("idle");
  const [errorMsg,   setErrorMsg]  = useState("");
  const [dismissed,  setDismissed] = useState(false);
  const [didAuto,    setDidAuto]   = useState(false);

  // Auto-prompt when wrong network is detected, once per session
  useEffect(() => {
    if (!isWrongNetwork || didAuto || dismissed) return;
    setDidAuto(true);
    const t = setTimeout(() => handleSwitch(), 800);
    return () => clearTimeout(t);
  }, [isWrongNetwork]);

  // Watch for successful network switch
  useEffect(() => {
    if (state === "switching" && chainId === ARC_CHAIN_ID) {
      setState("success");
      setTimeout(() => setState("idle"), 3000);
    }
  }, [chainId, state]);

  async function handleSwitch() {
    if (state === "switching") return;
    setState("switching"); setErrorMsg("");
    try {
      await switchToArc();
      // chainChanged event will update chainId → triggers success state above
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("rejected") || msg.includes("denied") || e.code === 4001) {
        setErrorMsg("Rejected. Click 'Add Arc' to try again.");
      } else if (msg.includes("No wallet")) {
        setErrorMsg("No wallet detected.");
      } else {
        setErrorMsg(msg.slice(0, 80));
      }
      setState("error");
    }
  }

  if (!isConnected) return null;

  // Success flash
  if (state === "success") {
    return (
      <div style={{
        position:"fixed", top:"var(--header-h)", left:0, right:0, zIndex:55,
        background:"var(--accent)", color:"white",
        padding:"10px 20px", display:"flex", alignItems:"center",
        justifyContent:"center", gap:8, fontSize:13, fontWeight:600,
        boxShadow:"0 2px 16px rgba(5,150,105,.4)",
        animation:"fade-in .2s ease",
      }}>
        <CheckCircle2 size={15}/>
        Connected to Arc Testnet
      </div>
    );
  }

  // Wrong network banner
  if (isWrongNetwork && !dismissed) {
    return (
      <div style={{
        position:"fixed", top:"var(--header-h)", left:0, right:0, zIndex:55,
        background:"#b45309", color:"white",
        padding:"10px 16px", display:"flex", alignItems:"center",
        justifyContent:"center", gap:10, flexWrap:"wrap",
        boxShadow:"0 2px 16px rgba(180,83,9,.45)",
      }}>
        <AlertTriangle size={14} style={{ flexShrink:0 }}/>

        <span style={{ fontSize:13, fontWeight:600 }}>
          Wrong network{chainId ? ` (ID: ${chainId})` : ""} — Readlearc needs Arc Testnet
        </span>

        <button
          onClick={handleSwitch}
          disabled={state === "switching"}
          style={{
            display:"flex", alignItems:"center", gap:5,
            padding:"5px 14px",
            background:"rgba(255,255,255,.2)",
            border:"1.5px solid rgba(255,255,255,.45)",
            borderRadius:"var(--r-f)",
            fontSize:12, fontWeight:700, color:"white",
            cursor: state === "switching" ? "wait" : "pointer",
            flexShrink:0, transition:"background .15s",
          }}
          onMouseEnter={e => (e.currentTarget as any).style.background="rgba(255,255,255,.3)"}
          onMouseLeave={e => (e.currentTarget as any).style.background="rgba(255,255,255,.2)"}
        >
          {state === "switching"
            ? <><Loader2 size={12} className="spin"/>Adding Arc…</>
            : <><Wifi size={12}/>Add Arc Testnet</>
          }
        </button>

        {state === "error" && errorMsg && (
          <span style={{ fontSize:11, opacity:.85, fontStyle:"italic" }}>
            {errorMsg}
          </span>
        )}

        <button
          onClick={() => setDismissed(true)}
          style={{
            background:"none", border:"none", cursor:"pointer",
            color:"rgba(255,255,255,.65)", padding:4, display:"flex",
            marginLeft:"auto", flexShrink:0,
          }}
        >
          <X size={14}/>
        </button>
      </div>
    );
  }

  return null;
}
