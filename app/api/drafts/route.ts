import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const addr = new URL(req.url).searchParams.get("address");
  if (!addr) return NextResponse.json({ error:"address required" }, { status:400 });
  const { data, error } = await supabaseAdmin.from("drafts").select("id,title,status,last_saved,created_at").ilike("author_address", addr).order("last_saved",{ascending:false});
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json(data||[]);
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  const { data, error } = await supabaseAdmin.from("drafts").insert({
    author_address: b.authorAddress.toLowerCase(),
    title:    b.title || "Untitled Draft",
    sections: b.sections || [],
    refs: b.references || [],
    keywords: b.keywords || [],
    status:   b.status || "draft",
    last_saved: new Date().toISOString(),
  }).select().single();
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json(data);
}
