
import { NextRequest, NextResponse } from "next/server";
import { supabase, check } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit    = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const category = searchParams.get("category");
  const author   = searchParams.get("author");
  const search   = searchParams.get("q");
  const featured = searchParams.get("featured") === "1";
  const admin    = searchParams.get("admin") === "1";

  try {
    let q = supabase.from("articles").select(
      "id,title,blurb,price,category,read_time,is_research,author_address,status,featured,reads,created_at"
    );

    if (!admin) {
      q = q.in("status", ["approved","featured"]);
    }
    if (featured)  q = q.eq("featured", true);
    if (category && category !== "All") q = q.eq("category", category);
    if (author)    q = q.ilike("author_address", author);
    if (search)    q = q.or(`title.ilike.%${search}%,blurb.ilike.%${search}%`);

    const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
    if (error) throw new Error(error.message);

    return NextResponse.json((data || []).map(fmt));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, blurb, content, price, category, readTime, isResearch, authorAddress } = body;
    if (!title || !content || !authorAddress)
      return NextResponse.json({ error: "title, content, authorAddress required" }, { status: 400 });

    const words = content.split(/\s+/).filter(Boolean).length;
    const { data, error } = await supabase.from("articles").insert({
      title, blurb: blurb||"", content, price: price||0.02,
      category: category||"General", read_time: readTime || Math.max(1, Math.ceil(words/200)),
      is_research: isResearch||false, author_address: authorAddress, status: "pending",
    }).select().single();
    if (error) throw new Error(error.message);
    return NextResponse.json(fmt(data), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function fmt(r: any) {
  return {
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
    timestamp:     r.created_at ? Math.floor(new Date(r.created_at).getTime()/1000) : 0,
  };
}
