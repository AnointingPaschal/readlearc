import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("read_receipts")
    .select("reader_address, amount_paid, article_id")
    .order("created_at", { ascending:false })
    .limit(1000);

  if (error) return NextResponse.json({ error: error.message }, { status:500 });

  const map: Record<string, { address:string; articles:number; spent:number }> = {};
  for (const r of data||[]) {
    const addr = r.reader_address;
    if (!addr) continue;
    if (!map[addr]) map[addr] = { address:addr, articles:0, spent:0 };
    map[addr].articles++;
    map[addr].spent += parseFloat(r.amount_paid||"0");
  }

  return NextResponse.json(Object.values(map).sort((a,b)=>b.articles-a.articles));
}
