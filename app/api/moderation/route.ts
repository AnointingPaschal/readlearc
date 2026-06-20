
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id     = searchParams.get("id");
  const action = searchParams.get("action");

  if (id) {
    const { data } = await supabase.from("articles").select("status,featured").eq("id", id).single();
    return NextResponse.json({ status: data?.featured ? "featured" : data?.status || "live" });
  }
  if (action === "featured") {
    const { data } = await supabase.from("articles").select("id").eq("featured", true);
    return NextResponse.json((data||[]).map(r=>String(r.id)));
  }
  return NextResponse.json({});
}

export async function POST(req: NextRequest) {
  const { articleId, status } = await req.json();
  const featured = status === "featured";
  const dbStatus = featured ? "approved" : status;
  await supabase.from("articles").update({ status:dbStatus, featured }).eq("id", articleId);
  return NextResponse.json({ ok:true });
}
