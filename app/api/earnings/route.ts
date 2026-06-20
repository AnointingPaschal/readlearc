import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const address = new URL(req.url).searchParams.get("address");
  if (!address) return NextResponse.json({ error:"address required" }, { status:400 });

  const { data: pending } = await supabaseAdmin.from("earnings")
    .select("writer_amount,article_id,articles(title)").eq("writer_address", address.toLowerCase()).eq("status","pending");
  const { data: paid }    = await supabaseAdmin.from("earnings")
    .select("writer_amount").eq("writer_address", address.toLowerCase()).eq("status","paid");
  const { data: payouts } = await supabaseAdmin.from("payouts")
    .select("*").eq("writer_address", address.toLowerCase()).order("processed_at",{ascending:false}).limit(10);

  const pendingTotal = (pending||[]).reduce((s,e)=>s+parseFloat(e.writer_amount),0);
  const paidTotal    = (paid||[]).reduce((s,e)=>s+parseFloat(e.writer_amount),0);

  return NextResponse.json({ pendingTotal, paidTotal, pending:pending||[], payouts:payouts||[] });
}
