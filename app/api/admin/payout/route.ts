import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

// GET: list pending payout amounts per writer
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("earnings")
    .select("writer_address, writer_amount, profiles(username,display_name,avatar_color)")
    .eq("status", "pending")
    .order("writer_address");

  if (error) return NextResponse.json({ error:error.message }, { status:500 });

  const byWriter: Record<string, { address:string; amount:number; username?:string; displayName?:string }> = {};
  for (const e of data||[]) {
    const addr = e.writer_address;
    if (!byWriter[addr]) byWriter[addr] = {
      address: addr, amount: 0,
      username: (e as any).profiles?.username,
      displayName: (e as any).profiles?.display_name,
    };
    byWriter[addr].amount += parseFloat(e.writer_amount);
  }

  return NextResponse.json(Object.values(byWriter).sort((a,b)=>b.amount-a.amount));
}

// POST: mark earnings as paid (call after actual USDC transfer)
export async function POST(req: NextRequest) {
  const { writerAddress, txHash, period, adminAddress } = await req.json();
  if (!writerAddress || !txHash) return NextResponse.json({ error:"writerAddress + txHash required" }, { status:400 });

  const amount_q = await supabaseAdmin.from("earnings")
    .select("writer_amount").eq("writer_address", writerAddress.toLowerCase()).eq("status","pending");
  const totalAmount = (amount_q.data||[]).reduce((s,e)=>s+parseFloat(e.writer_amount),0);

  // Mark all pending earnings for this writer as paid
  const { error } = await supabaseAdmin.from("earnings")
    .update({ status:"paid" })
    .eq("writer_address", writerAddress.toLowerCase())
    .eq("status", "pending");

  if (error) return NextResponse.json({ error:error.message }, { status:500 });

  // Record payout
  await supabaseAdmin.from("payouts").insert({
    writer_address: writerAddress.toLowerCase(),
    amount:         totalAmount,
    tx_hash:        txHash,
    period:         period || new Date().toISOString().slice(0,7),
    processed_by:   adminAddress?.toLowerCase(),
  });

  // Notify writer
  await supabaseAdmin.from("notifications").insert({
    user_address: writerAddress.toLowerCase(),
    type:         "payout",
    title:        "Payout Processed!",
    body:         `$${totalAmount.toFixed(4)} USDC has been sent to your wallet.`,
    link:         "/creator",
  });

  return NextResponse.json({ ok:true, amount:totalAmount });
}
