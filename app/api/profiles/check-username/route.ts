import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const username = new URL(req.url).searchParams.get("username")?.toLowerCase();
  if (!username || username.length < 3) return NextResponse.json({ available: false });
  const { data } = await supabaseAdmin.from("profiles").select("username").eq("username", username).maybeSingle();
  return NextResponse.json({ available: !data });
}
