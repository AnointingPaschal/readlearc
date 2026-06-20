import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const addr = searchParams.get("address");
  if (!addr) return NextResponse.json({ error:"address required" }, { status:400 });
  const { data } = await supabaseAdmin.from("profiles").select("*").ilike("wallet_address", addr).maybeSingle();
  return NextResponse.json(data || null);
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  const { walletAddress, username, displayName, bio, website, twitter, avatarColor } = b;
  if (!walletAddress) return NextResponse.json({ error:"walletAddress required" }, { status:400 });

  const { data, error } = await supabaseAdmin.from("profiles").upsert({
    wallet_address: walletAddress.toLowerCase(),
    username:       username?.toLowerCase(),
    display_name:   displayName || null,
    bio:            bio || null,
    website:        website || null,
    twitter:        twitter || null,
    avatar_color:   avatarColor || "#6d28d9",
  }, { onConflict:"wallet_address" }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json(data);
}
