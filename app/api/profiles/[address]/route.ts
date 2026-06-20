import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

type C = { params: Promise<{address:string}> };

export async function GET(_: NextRequest, { params }: C) {
  const { address } = await params;
  const { data } = await supabaseAdmin.from("profiles").select("*").ilike("wallet_address", address).maybeSingle();
  if (!data) return NextResponse.json({ wallet_address: address, username: null });

  // Get stats
  const [arts, followers, following] = await Promise.all([
    supabaseAdmin.from("articles").select("id", { count:"exact", head:true }).ilike("author_address", address).in("status",["approved","featured"]),
    supabaseAdmin.from("follows").select("id", { count:"exact", head:true }).ilike("following_address", address),
    supabaseAdmin.from("follows").select("id", { count:"exact", head:true }).ilike("follower_address", address),
  ]);

  return NextResponse.json({ ...data, articleCount: arts.count||0, followerCount: followers.count||0, followingCount: following.count||0 });
}
