import { IS_CONFIGURED } from "@/lib/chain";
import { Link } from "@/lib/nav";
import { AlertTriangle } from "lucide-react";

export default function SetupBanner() {
  if (IS_CONFIGURED) return null;
  return (
    <div style={{ background:"#dc2626", color:"white", padding:"10px 20px", textAlign:"center", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
      <AlertTriangle size={15}/>
      Contracts not configured — an admin must add the deployed addresses in
      <Link href="/admin/finance/contracts" style={{ color:"white", textDecoration:"underline" }}>Admin → Contracts</Link>.
    </div>
  );
}
