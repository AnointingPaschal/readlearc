
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const { readerAddress, txHash, amountPaid } = await req.json();
    if (!readerAddress) return NextResponse.json({ error:"readerAddress required" }, { status:400 });

    const { data: article } = await supabase.from("articles").select("*").eq("id", id).single();
    if (!article) return NextResponse.json({ error:"Article not found" }, { status:404 });

    const { error } = await supabase.from("read_receipts").upsert({
      article_id:    parseInt(id),
      reader_address:readerAddress.toLowerCase(),
      tx_hash:       txHash||null,
      amount_paid:   amountPaid||null,
    }, { onConflict:"article_id,reader_address" });
    if (error) throw new Error(error.message);

    await supabase.from("articles").update({ reads: (article.reads||0)+1 }).eq("id", id);

    return NextResponse.json({ ok:true, content: article.content, id: String(article.id) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const reader = new URL(req.url).searchParams.get("reader");
  if (!reader) return NextResponse.json({ paid:false });
  const { data } = await supabase.from("read_receipts")
    .select("id").eq("article_id", id).ilike("reader_address", reader).maybeSingle();
  return NextResponse.json({ paid: !!data });
}
