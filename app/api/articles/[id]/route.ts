import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

export async function GET(req: NextRequest, { params }: C) {
  const { id } = await params;
  const reader  = new URL(req.url).searchParams.get("reader")||"";
  const admin   = new URL(req.url).searchParams.get("admin")==="1";

  const { data: a, error } = await supabase.from("articles").select("*").eq("id",id).single();
  if (error||!a) return NextResponse.json({ error:"Not found" }, { status:404 });

  let paid = false;
  if (reader) {
    const { data } = await supabase.from("read_receipts")
      .select("id").eq("article_id",id).ilike("reader_address",reader).maybeSingle();
    paid = !!data;
  }
  const isAuthor = reader && reader.toLowerCase()===a.author_address.toLowerCase();
  const unlock   = paid||isAuthor||admin;

  return NextResponse.json({
    id:            String(a.id),
    title:         a.title,
    blurb:         a.blurb,
    content:       unlock ? a.content : null,
    price:         Number(a.price).toFixed(6),
    category:      a.category,
    readTime:      a.read_time,
    isResearch:    a.is_research,
    authorAddress: a.author_address,
    authorShort:   a.author_address.slice(0,6)+"…"+a.author_address.slice(-4),
    status:        a.status,
    featured:      a.featured,
    reads:         a.reads,
    hasPaid:       paid,
    timestamp:     Math.floor(new Date(a.created_at).getTime()/1000),
  });
}

export async function PUT(req: NextRequest, { params }: C) {
  const { id } = await params;
  const b = await req.json();
  const { data: a } = await supabase.from("articles").select("author_address").eq("id",id).single();
  if (!a) return NextResponse.json({ error:"Not found" }, { status:404 });
  if (a.author_address.toLowerCase()!==b.authorAddress?.toLowerCase())
    return NextResponse.json({ error:"Forbidden" }, { status:403 });
  const { error } = await supabase.from("articles").update({
    title:b.title,blurb:b.blurb,content:b.content,price:b.price,category:b.category,read_time:b.readTime
  }).eq("id",id);
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}

export async function DELETE(req: NextRequest, { params }: C) {
  const { id } = await params;
  const b = await req.json().catch(()=>({}));
  if (b.authorAddress) {
    const { data:a } = await supabase.from("articles").select("author_address").eq("id",id).single();
    if (a && a.author_address.toLowerCase()!==b.authorAddress.toLowerCase())
      return NextResponse.json({ error:"Forbidden" }, { status:403 });
  }
  const { error } = await supabase.from("articles").delete().eq("id",id);
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}
