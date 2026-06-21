"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function PayoutsRedirect() {
  const router = useRouter();
  useEffect(()=>{ router.replace("/admin/earnings"); },[router]);
  return <div style={{ padding:40,textAlign:"center",color:"var(--text-4)" }}>Redirecting to Earnings & Payouts…</div>;
}
