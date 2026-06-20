import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const p      = new URLSearchParams(req.url.split("?")[1]||"");
  const admin  = p.get("admin")==="1";
  const limit  = Math.min(parseInt(p.get("limit")||"50"),200);
  const cat    = p.get("category");
  const author = p.get("author");
  const q      = p.get("q");

  let query = supabase.from("articles")
    .select("id,title,blurb,price,category,read_time,is_research,author_address,status,featured,reads,created_at");

  if (!admin) query = query.in("status", ["approved","featured"]);
  if (cat && cat !== "All") query = query.eq("category", cat);
  if (author) query = query.ilike("author_address", author);
  if (q) query = query.or(`title.ilike.%${q}%,blurb.ilike.%${q}%`);

  const { data, error } = await query.order("created_at", { ascending:false }).limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json(data||[]);
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.title || !b.content || !b.authorAddress)
    return NextResponse.json({ error:"title, content, authorAddress required" }, { status:400 });

  const words = (b.content as string).split(/\s+/).filter(Boolean).length;
  const { data, error } = await supabase.from("articles").insert({
    title: b.title, blurb: b.blurb||"", content: b.content,
    price: b.price||0.02, category: b.category||"General",
    read_time: b.readTime||Math.max(1,Math.ceil(words/200)),
    is_research: b.isResearch||false,
    author_address: b.authorAddress, status:"pending",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json(data, { status:201 });
}
