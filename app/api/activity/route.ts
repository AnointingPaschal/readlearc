import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const feed    = searchParams.get("feed") === "1"; // following feed
  const limit   = Math.min(parseInt(searchParams.get("limit")||"30"), 100);

  if (feed && address) {
    // Get following addresses
    const { data: followingData } = await supabaseAdmin.from("follows")
      .select("following_address").ilike("follower_address", address);
    const addrs = (followingData||[]).map((f:any) => f.following_address).concat([address.toLowerCase()]);

    const { data, error } = await supabaseAdmin.from("activity")
      .select("*, articles(id,title,category,price)")
      .in("actor_address", addrs)
      .order("created_at", { ascending:false }).limit(limit);
    if (error) return NextResponse.json({ error:error.message }, { status:500 });
    return NextResponse.json(data||[]);
  }

  let q = supabaseAdmin.from("activity").select("*, articles(id,title,category,price)");
  if (address) q = q.or(`actor_address.ilike.${address},target_address.ilike.${address}`);
  const { data, error } = await q.order("created_at", { ascending:false }).limit(limit);
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json(data||[]);
}

export async function POST(req: NextRequest) {
  const { actorAddress, actionType, targetAddress, articleId, metadata } = await req.json();
  if (!actorAddress || !actionType) return NextResponse.json({ error:"actorAddress + actionType required" }, { status:400 });

  await supabaseAdmin.from("activity").insert({
    actor_address:  actorAddress.toLowerCase(),
    action_type:    actionType,
    target_address: targetAddress?.toLowerCase() || null,
    article_id:     articleId || null,
    metadata:       metadata || null,
  });
  return NextResponse.json({ ok:true });
}
