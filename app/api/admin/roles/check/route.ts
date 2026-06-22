import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const address = new URL(req.url).searchParams.get("address");
  if (!address) return NextResponse.json({ role:0, roleName:"User" });
  const lower = address.toLowerCase();
  const { data } = await supabaseAdmin.from("admin_roles")
    .select("role").eq("wallet_address", lower).maybeSingle();
  const role = data?.role ?? 0;
  const names: Record<number,string> = { 0:"User",1:"Moderator",2:"Admin",3:"Super Admin" };
  return NextResponse.json({ role, roleName: names[role]||"User" });
}
