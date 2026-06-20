import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const address = new URL(req.url).searchParams.get("address");
  if (!address) return NextResponse.json({ role:0 });
  const { data } = await supabaseAdmin.from("admin_roles").select("role").ilike("wallet_address", address).maybeSingle();
  return NextResponse.json({ role: data?.role || 0 });
}
