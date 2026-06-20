
"use client";
import { IS_CONFIGURED } from "../../lib/chain";
import NetworkGuard from "./NetworkGuard";
import { AlertTriangle } from "lucide-react";

export default function SetupBanner() {
  return (
    <>
      <NetworkGuard />
      {!IS_CONFIGURED && (
        <div style={{ background:"#dc2626", color:"white", padding:"10px 20px", textAlign:"center", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <AlertTriangle size={15}/>
          Contract not configured — set NEXT_PUBLIC_CONTRACT_ADDRESS + NEXT_PUBLIC_USDC_ADDRESS in Vercel then redeploy.
        </div>
      )}
    </>
  );
}
