import { NextResponse } from "next/server";
import { supabaseAdmin, IS_SUPABASE_CONFIGURED } from "../../../lib/supabase";

export async function GET() {
  const env = {
    SUPABASE_URL:       process.env.NEXT_PUBLIC_SUPABASE_URL      ? "✓" : "✗ MISSING",
    SUPABASE_KEY:       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  ? "✓" : "✗ MISSING",
    SERVICE_ROLE_KEY:   process.env.SUPABASE_SERVICE_ROLE_KEY      ? "✓" : "✗ MISSING",
    USDC_ADDRESS:       process.env.NEXT_PUBLIC_USDC_ADDRESS       || "0x3600000000000000000000000000000000000000 (default)",
    CONTRACT_ADDRESS:   process.env.NEXT_PUBLIC_CONTRACT_ADDRESS   || "NOT SET — using direct transfer",
  };

  const tables: Record<string,string> = {};
  if (IS_SUPABASE_CONFIGURED) {
    for (const t of ["articles","profiles","platform_settings","admin_roles","read_receipts","comments","reactions","follows","activity","drafts"]) {
      const { count, error } = await supabaseAdmin.from(t).select("*",{count:"exact",head:true});
      tables[t] = error ? `✗ ${error.message}` : `✓ ${count} rows`;
    }
  }

  return NextResponse.json({ env, tables, payment_mode: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ? "smart_contract" : "direct_transfer" });
}
