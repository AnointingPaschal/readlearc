
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const reader = searchParams.get("reader");
  const admin  = searchParams.get("admin") === "1";

  try {
    const { data: a, error } = await supabase.from("articles").select("*").eq("id", id).single();
    if (error || !a) return NextResponse.json({ error:"Not found" }, { status:404 });

    let hasPaid = false;
    if (reader) {
      const { data } = await supabase.from("read_receipts")
        .select("id").eq("article_id", id).ilike("reader_address", reader).maybeSingle();
      hasPaid = !!data;
    }

    const isAuthor = reader && reader.toLowerCase() === a.author_address.toLowerCase();
    const unlocked = hasPaid || isAuthor || admin;

    return NextResponse.json({
      id:            String(a.id),
      title:         a.title,
      blurb:         a.blurb,
      content:       unlocked ? a.content : undefined,
      price:         Number(a.price).toFixed(6),
      category:      a.category,
      readTime:      a.read_time,
      isResearch:    a.is_research,
      authorAddress: a.author_address,
      authorShort:   a.author_address.slice(0,6)+"…"+a.author_address.slice(-4),
      status:        a.status,
      featured:      a.featured,
      reads:         a.reads,
      hasPaid,
      timestamp:     Math.floor(new Date(a.created_at).getTime()/1000),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const { title, blurb, content, price, category, readTime, isResearch, authorAddress } = await req.json();
    const { data: existing } = await supabase.from("articles").select("author_address").eq("id", id).single();
    if (!existing) return NextResponse.json({ error:"Not found" }, { status:404 });
    if (existing.author_address.toLowerCase() !== authorAddress?.toLowerCase())
      return NextResponse.json({ error:"Forbidden" }, { status:403 });

    const { error } = await supabase.from("articles").update({
      title, blurb, content, price, category, read_time:readTime, is_research:isResearch
    }).eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok:true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await req.json().catch(()=>({}));
    const { data: existing } = await supabase.from("articles").select("author_address").eq("id", id).single();
    if (!existing) return NextResponse.json({ error:"Not found" }, { status:404 });
    if (body.authorAddress && existing.author_address.toLowerCase() !== body.authorAddress.toLowerCase())
      return NextResponse.json({ error:"Forbidden" }, { status:403 });
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok:true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}
