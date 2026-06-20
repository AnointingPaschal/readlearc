import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const writer = searchParams.get("writer");
  const period = searchParams.get("period"); // YYYY-MM

  let q = supabaseAdmin.from("earnings")
    .select("*, articles(title,category), profiles(username,display_name)", { count:"exact" });

  if (writer) q = q.ilike("writer_address", writer);
  if (period) q = q.eq("period", period);

  const { data, error, count } = await q.order("created_at", { ascending:false }).limit(200);
  if (error) return NextResponse.json({ error:error.message }, { status:500 });

  // Aggregate by writer
  const byWriter: Record<string, { address:string; pending:number; paid:number; total:number; username?:string }> = {};
  for (const e of data||[]) {
    const addr = e.writer_address;
    if (!byWriter[addr]) byWriter[addr] = {
      address: addr,
      pending: 0, paid: 0, total: 0,
      username: (e as any).profiles?.username,
    };
    if (e.status === "pending") byWriter[addr].pending += parseFloat(e.writer_amount);
    else                        byWriter[addr].paid    += parseFloat(e.writer_amount);
    byWriter[addr].total += parseFloat(e.writer_amount);
  }

  return NextResponse.json({
    rows: data,
    byWriter: Object.values(byWriter).sort((a,b) => b.pending - a.pending),
    totalPending: Object.values(byWriter).reduce((s,w) => s+w.pending, 0),
    totalPaid:    Object.values(byWriter).reduce((s,w) => s+w.paid,    0),
    count,
  });
}
