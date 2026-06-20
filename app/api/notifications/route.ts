import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const address = new URL(req.url).searchParams.get("address");
  if (!address) return NextResponse.json([]);
  const { data } = await supabaseAdmin.from("notifications")
    .select("*").ilike("user_address", address).order("created_at",{ascending:false}).limit(30);
  return NextResponse.json(data||[]);
}

export async function PATCH(req: NextRequest) {
  const { id, address } = await req.json();
  await supabaseAdmin.from("notifications").update({ read:true })
    .eq("id", id).ilike("user_address", address);
  return NextResponse.json({ ok:true });
}
