
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

type Ctx = { params: Promise<{ articleId: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const { articleId } = await params;
  const { data } = await supabase.from("reactions").select("address,reaction_key").eq("article_id", articleId);
  const counts: Record<string,number> = {};
  const voters: Record<string,string> = {};
  for (const r of data||[]) {
    counts[r.reaction_key] = (counts[r.reaction_key]||0)+1;
    voters[r.address] = r.reaction_key;
  }
  return NextResponse.json({ counts, voters });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { articleId } = await params;
  const { address, emoji } = await req.json(); // emoji = reaction key or null
  if (!address) return NextResponse.json({ error:"address required" }, { status:400 });
  const addr = address.toLowerCase();

  // Remove existing reaction
  await supabase.from("reactions").delete().eq("article_id", articleId).eq("address", addr);

  // Add new reaction if not null
  if (emoji) {
    await supabase.from("reactions").insert({ article_id: parseInt(articleId), address: addr, reaction_key: emoji });
  }

  // Return updated counts
  const { data } = await supabase.from("reactions").select("address,reaction_key").eq("article_id", articleId);
  const counts: Record<string,number> = {};
  const voters: Record<string,string> = {};
  for (const r of data||[]) {
    counts[r.reaction_key] = (counts[r.reaction_key]||0)+1;
    voters[r.address] = r.reaction_key;
  }
  return NextResponse.json({ counts, voters });
}
