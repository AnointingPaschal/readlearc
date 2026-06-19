
"use client";
import { IS_CONFIGURED } from "../../lib/chain";
import { AlertTriangle } from "lucide-react";

export default function SetupBanner() {
  if (IS_CONFIGURED) return null;
  return (
    <div style={{ background:"#dc2626", color:"white", padding:"10px 20px", textAlign:"center", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
      <AlertTriangle size={15} />
      Contract not configured — set NEXT_PUBLIC_CONTRACT_ADDRESS, NEXT_PUBLIC_USDC_ADDRESS and NEXT_PUBLIC_RPC_URL in Vercel → Settings → Environment Variables, then redeploy.
    </div>
  );
}
