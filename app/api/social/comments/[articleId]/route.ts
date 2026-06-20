
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

type Ctx = { params: Promise<{ articleId: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const { articleId } = await params;
  const { data, error } = await supabase.from("comments").select("*")
    .eq("article_id", articleId).order("created_at", { ascending:true });
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json(data||[]);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { articleId } = await params;
  const body = await req.json();
  const { data, error } = await supabase.from("comments").insert({
    article_id:    parseInt(articleId),
    author_address:body.authorAddress||"0x0",
    author_name:   body.authorName||null,
    content:       body.text||body.content,
    parent_id:     body.parentId||null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { articleId } = await params;
  const { commentId, text } = await req.json();
  const { error } = await supabase.from("comments")
    .update({ content:text, edited:true }).eq("id", commentId).eq("article_id", articleId);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { articleId } = await params;
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error:"commentId required" }, { status:400 });
  const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("article_id", articleId);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}
