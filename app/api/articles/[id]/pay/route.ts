import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

export async function POST(req: NextRequest, { params }: C) {
  const { id } = await params;
  const { readerAddress, txHash, amountPaid } = await req.json();
  if (!readerAddress) return NextResponse.json({ error:"readerAddress required" }, { status:400 });

  const { data:a } = await supabase.from("articles").select("*").eq("id",id).single();
  if (!a) return NextResponse.json({ error:"Not found" }, { status:404 });

  await supabase.from("read_receipts").upsert({
    article_id:     parseInt(id),
    reader_address: readerAddress.toLowerCase(),
    tx_hash:        txHash||null,
    amount_paid:    amountPaid||null,
  }, { onConflict:"article_id,reader_address" });

  await supabase.from("articles").update({ reads:(a.reads||0)+1 }).eq("id",id);
  return NextResponse.json({ ok:true, content:a.content });
}

export async function GET(req: NextRequest, { params }: C) {
  const { id } = await params;
  const reader = new URL(req.url).searchParams.get("reader")||"";
  if (!reader) return NextResponse.json({ paid:false });
  const { data } = await supabase.from("read_receipts")
    .select("id").eq("article_id",id).ilike("reader_address",reader).maybeSingle();
  return NextResponse.json({ paid:!!data });
}
