import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as sb } from "../../../../../lib/supabase";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await sb.from("group_posts").select("*").eq("group_id", id).order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json();
  if (!b.authorAddress || !b.content) return NextResponse.json({ error: "authorAddress and content required" }, { status: 400 });
  const { data: g } = await sb.from("groups").select("member_addresses,post_count").eq("id", id).single();
  if (!g?.member_addresses?.includes(b.authorAddress.toLowerCase())) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  const { data, error } = await sb.from("group_posts").insert({
    group_id: id, author_address: b.authorAddress.toLowerCase(),
    content: b.content, article_id: b.articleId||null, type: b.type||"discussion", likes: 0,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await sb.from("groups").update({ post_count: (g.post_count||0)+1 }).eq("id", id);
  return NextResponse.json(data, { status: 201 });
}
