import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../../lib/supabase";

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

  // Record writer earnings (85% of payment, held in treasury until monthly payout)
  const gross      = parseFloat(amountPaid || a.price || "0");
  const writerAmt  = parseFloat((gross * 0.85).toFixed(6));
  const period     = new Date().toISOString().slice(0,7); // YYYY-MM
  await supabase.from("earnings").insert({
    writer_address: a.author_address,
    article_id:     parseInt(id),
    reader_address: readerAddress.toLowerCase(),
    gross_amount:   gross,
    writer_amount:  writerAmt,
    tx_hash:        txHash || null,
    period,
    status:         "pending",
  });
  // Non-blocking — ignore errors

  // Notify writer of new sale
  await supabase.from("notifications").insert({
    user_address: a.author_address,
    type:         "sale",
    title:        "New Reader!",
    body:         `Someone paid $${gross.toFixed(3)} to read "${a.title.slice(0,40)}"`,
    link:         `/article/${id}`,
  });

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
