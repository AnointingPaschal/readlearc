import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const p = new URLSearchParams(req.url.split("?")[1]||"");
  let q = supabase.from("articles")
    .select("id,title,blurb,price,category,read_time,is_research,author_address,status,featured,reads,created_at");
  const s = p.get("status");
  if (s && s!=="all") q = q.eq("status",s);
  const search = p.get("q");
  if (search) q = q.or(`title.ilike.%${search}%,blurb.ilike.%${search}%`);
  const { data, error } = await q.order("created_at",{ascending:false}).limit(200);
  if (error) return NextResponse.json({ error:error.message }, { status:500 });

  const ids = (data||[]).map((a:any)=>a.id);
  const { data:rr } = await supabase.from("read_receipts").select("article_id").in("article_id",ids);
  const counts:Record<number,number>={};
  for (const r of rr||[]) counts[r.article_id]=(counts[r.article_id]||0)+1;

  return NextResponse.json((data||[]).map((a:any)=>({
    id:String(a.id),title:a.title,blurb:a.blurb,
    price:Number(a.price).toFixed(6),category:a.category,
    readTime:a.read_time,isResearch:a.is_research,
    authorAddress:a.author_address,
    authorShort:a.author_address.slice(0,6)+"…"+a.author_address.slice(-4),
    status:a.status,featured:a.featured,reads:a.reads,
    paidCount:counts[a.id]||0,
    timestamp:Math.floor(new Date(a.created_at).getTime()/1000),
  })));
}
