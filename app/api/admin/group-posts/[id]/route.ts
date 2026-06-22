import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as sb } from "../../../../../lib/supabase";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await sb.from("group_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Decrement post_count
  const { data: post } = await sb.from("group_posts").select("group_id").eq("id", id).maybeSingle();
  if (post) {
    const { data: g } = await sb.from("groups").select("post_count").eq("id", post.group_id).single();
    if (g) await sb.from("groups").update({ post_count: Math.max(0,(g.post_count||1)-1) }).eq("id", post.group_id);
  }
  return NextResponse.json({ ok: true });
}
