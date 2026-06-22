import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

function transform(row: any) {
  const addr = row.author_address || "";
  return {
    id:            String(row.id),
    title:         row.title       || "",
    blurb:         row.blurb       || "",
    price:         String(row.price|| "0.020"),
    category:      row.category    || "General",
    readTime:      row.read_time   || 5,
    isResearch:    row.is_research || false,
    authorAddress: addr,
    authorShort:   addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : "Unknown",
    status:        row.status      || "pending",
    featured:      row.featured    || false,
    reads:         row.reads       || 0,
    paidCount:     row.paid_count  || 0,
    timestamp:     row.created_at ? Math.floor(new Date(row.created_at).getTime()/1000) : 0,
  };
}

export async function GET(req: NextRequest) {
  const p      = new URLSearchParams(req.url.split("?")[1]||"");
  const status = p.get("status");
  const q      = p.get("q");
  const limit  = Math.min(parseInt(p.get("limit")||"200"),500);

  let query = supabaseAdmin.from("articles")
    .select("id,title,blurb,price,category,read_time,is_research,author_address,status,featured,reads,created_at");

  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`title.ilike.%${q}%,author_address.ilike.%${q}%`);

  const { data, error } = await query.order("created_at", { ascending:false }).limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json((data||[]).map(transform));
}
