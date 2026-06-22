import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

export async function GET(req: NextRequest, { params }: C) {
  const { id } = await params;
  const reader  = new URL(req.url).searchParams.get("reader");

  const { data: a, error } = await supabase.from("articles")
    .select("id,title,blurb,content,price,category,read_time,is_research,author_address,status,featured,reads,created_at")
    .eq("id", id).single();

  if (error || !a) return NextResponse.json({ error:"Not found" }, { status:404 });

  let hasPaid = false;
  if (reader) {
    const { data: rr } = await supabase.from("read_receipts")
      .select("id").eq("article_id", id).ilike("reader_address", reader).maybeSingle();
    hasPaid = !!rr;
  }

  const addr = a.author_address || "";
  return NextResponse.json({
    id:            String(a.id),
    title:         a.title       || "",
    blurb:         a.blurb       || "",
    content:       hasPaid || new URL(req.url).searchParams.get("admin")==="1" ? a.content : null,
    price:         String(a.price|| "0.020"),
    category:      a.category    || "General",
    readTime:      a.read_time   || 5,
    isResearch:    a.is_research || false,
    authorAddress: addr,
    authorShort:   addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : "Unknown",
    status:        a.status      || "pending",
    featured:      a.featured    || false,
    reads:         a.reads       || 0,
    hasPaid,
    timestamp:     a.created_at ? Math.floor(new Date(a.created_at).getTime()/1000) : 0,
  });
}

export async function PUT(req: NextRequest, { params }: C) {
  const { id } = await params;
  const b = await req.json();
  const { data, error } = await supabase.from("articles")
    .update({ title:b.title, blurb:b.blurb, content:b.content, price:b.price, category:b.category })
    .eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: C) {
  const { id } = await params;
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ ok: true });
}
