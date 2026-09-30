import { useEffect } from "react";
import { useRouter } from "@/lib/nav";
export default function PayoutsRedirect() {
  const router = useRouter();
  useEffect(()=>{ router.replace("/admin/earnings"); },[router]);
  return <div style={{ padding:40,textAlign:"center",color:"var(--text-4)" }}>Redirecting to Earnings & Payouts…</div>;
}
