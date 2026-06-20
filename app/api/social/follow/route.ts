import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.toLowerCase() || "";
  const action  = searchParams.get("action") || "following";

  if (action === "followers") {
    const { data } = await supabaseAdmin.from("follows").select("follower_address, profiles(username,display_name,avatar_color)").ilike("following_address", address);
    return NextResponse.json(data||[]);
  }
  if (action === "following") {
    const { data } = await supabaseAdmin.from("follows").select("following_address, profiles!follows_following_address_fkey(username,display_name,avatar_color)").ilike("follower_address", address);
    return NextResponse.json(data||[]);
  }
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const { follower, target } = await req.json();
  const f = follower.toLowerCase(); const t = target.toLowerCase();

  const { data: existing } = await supabaseAdmin.from("follows")
    .select("id").eq("follower_address",f).eq("following_address",t).maybeSingle();

  if (existing) {
    await supabaseAdmin.from("follows").delete().eq("follower_address",f).eq("following_address",t);
    const { count } = await supabaseAdmin.from("follows").select("id",{count:"exact",head:true}).eq("following_address",t);
    return NextResponse.json({ following:false, followers:count||0 });
  }

  await supabaseAdmin.from("follows").insert({ follower_address:f, following_address:t });
  // Log activity
  await supabaseAdmin.from("activity").insert({ actor_address:f, action_type:"follow", target_address:t });
  const { count } = await supabaseAdmin.from("follows").select("id",{count:"exact",head:true}).eq("following_address",t);
  return NextResponse.json({ following:true, followers:count||0 });
}
