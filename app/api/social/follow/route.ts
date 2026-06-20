
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.toLowerCase()||"";
  const action  = searchParams.get("action")||"following";

  if (action==="followers") {
    const { data } = await supabase.from("follows").select("follower_address").eq("following_address", address);
    return NextResponse.json((data||[]).map(r => r.follower_address));
  }
  const { data } = await supabase.from("follows").select("following_address").eq("follower_address", address);
  return NextResponse.json((data||[]).map(r => r.following_address));
}

export async function POST(req: NextRequest) {
  const { follower, target } = await req.json();
  const f = follower.toLowerCase(); const t = target.toLowerCase();
  const { data: existing } = await supabase.from("follows")
    .select("id").eq("follower_address", f).eq("following_address", t).maybeSingle();
  if (existing) {
    await supabase.from("follows").delete().eq("follower_address", f).eq("following_address", t);
    const { data } = await supabase.from("follows").select("id").eq("following_address", t);
    return NextResponse.json({ following:false, followers:(data||[]).length });
  }
  await supabase.from("follows").insert({ follower_address:f, following_address:t });
  const { data } = await supabase.from("follows").select("id").eq("following_address", t);
  return NextResponse.json({ following:true, followers:(data||[]).length });
}
