import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../lib/supabase";

function transform(row: any) {
  const addr = row.author_address || "";
  return {
    id:            String(row.id),
    title:         row.title         || "",
    blurb:         row.blurb         || "",
    content:       row.content       || null,
    price:         String(row.price  || "0.020"),
    category:      row.category      || "General",
    readTime:      row.read_time     || 5,
    isResearch:    row.is_research   || false,
    authorAddress: addr,
    authorShort:   addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : "Unknown",
    status:        row.status        || "pending",
    featured:      row.featured      || false,
    reads:         row.reads         || 0,
    timestamp:     row.created_at ? Math.floor(new Date(row.created_at).getTime()/1000) : 0,
  };
}

export async function GET(req: NextRequest) {
  const p      = new URLSearchParams(req.url.split("?")[1]||"");
  const admin  = p.get("admin")==="1";
  const limit  = Math.min(parseInt(p.get("limit")||"50"),200);
  const cat    = p.get("category");
  const author = p.get("author");
  const q      = p.get("q");
  const status = p.get("status");
  const reader = p.get("reader");

  let query = supabase.from("articles")
    .select("id,title,blurb,price,category,read_time,is_research,author_address,status,featured,reads,created_at");

  if (!admin) {
    if (status && ["approved","featured","pending"].includes(status)) {
      query = query.eq("status", status);
    } else {
      query = query.in("status", ["approved","featured"]);
    }
  }
  if (cat && cat !== "All") query = query.eq("category", cat);
  if (author)               query = query.ilike("author_address", author);
  if (q)                    query = query.or(`title.ilike.%${q}%,blurb.ilike.%${q}%`);

  const { data, error } = await query.order("created_at", { ascending:false }).limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json((data||[]).map(transform));
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.title || !b.content || !b.authorAddress)
    return NextResponse.json({ error:"title, content, authorAddress required" }, { status:400 });

  const words = (b.content as string).split(/\s+/).filter(Boolean).length;
  const { data, error } = await supabase.from("articles").insert({
    title:          b.title,
    blurb:          b.blurb||"",
    content:        b.content,
    price:          b.price||0.02,
    category:       b.category||"General",
    read_time:      b.readTime||Math.max(1,Math.ceil(words/200)),
    is_research:    b.isResearch||false,
    author_address: b.authorAddress,
    status:         b.status||"pending",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json(transform(data), { status:201 });
}
