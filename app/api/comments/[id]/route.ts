import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

const fmt = (r:any) => ({
  id:String(r.id), articleId:String(r.article_id),
  authorAddress:r.author_address, authorName:r.author_name,
  text:r.content, parentId:r.parent_id?String(r.parent_id):null,
  edited:r.edited,
  timestamp:Math.floor(new Date(r.created_at).getTime()/1000),
});

export async function GET(_: NextRequest, { params }: C) {
  const { id } = await params;
  const { data, error } = await supabase.from("comments").select("*")
    .eq("article_id",id).order("created_at",{ascending:true});
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json((data||[]).map(fmt));
}

export async function POST(req: NextRequest, { params }: C) {
  const { id } = await params;
  const b = await req.json();
  const { data, error } = await supabase.from("comments").insert({
    article_id:parseInt(id), author_address:b.authorAddress||"0x0",
    author_name:b.authorName||null, content:b.text||b.content||"",
    parent_id:b.parentId?parseInt(b.parentId):null,
  }).select().single();
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json(fmt(data));
}

export async function DELETE(req: NextRequest, { params }: C) {
  const { id } = await params;
  const commentId = new URL(req.url).searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error:"commentId required" }, { status:400 });
  const { error } = await supabase.from("comments").delete().eq("id",commentId).eq("article_id",id);
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}
