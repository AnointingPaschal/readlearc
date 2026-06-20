
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit  = Math.min(parseInt(searchParams.get("limit")||"200"), 500);
  const search = searchParams.get("q");

  try {
    let q = supabase.from("articles").select(
      "id,title,blurb,price,category,read_time,is_research,author_address,status,featured,reads,created_at"
    );
    if (status && status !== "all") q = q.eq("status", status);
    if (search) q = q.or(`title.ilike.%${search}%,blurb.ilike.%${search}%`);

    const { data, error } = await q.order("created_at", { ascending:false }).limit(limit);
    if (error) throw new Error(error.message);

    // Get paid counts separately
    const ids = (data||[]).map(a => a.id);
    const { data: receipts } = await supabase.from("read_receipts").select("article_id").in("article_id", ids);
    const paidMap: Record<number,number> = {};
    for (const r of receipts||[]) paidMap[r.article_id] = (paidMap[r.article_id]||0)+1;

    return NextResponse.json((data||[]).map(r => ({
      id:            String(r.id),
      title:         r.title,
      blurb:         r.blurb,
      price:         Number(r.price).toFixed(6),
      category:      r.category,
      readTime:      r.read_time,
      isResearch:    r.is_research,
      authorAddress: r.author_address,
      authorShort:   r.author_address.slice(0,6)+"…"+r.author_address.slice(-4),
      status:        r.status,
      featured:      r.featured,
      reads:         r.reads,
      paidCount:     paidMap[r.id]||0,
      timestamp:     Math.floor(new Date(r.created_at).getTime()/1000),
    })));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}
