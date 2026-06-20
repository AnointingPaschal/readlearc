import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

export async function GET(_: NextRequest, { params }: C) {
  const { id } = await params;
  const { data } = await supabase.from("reactions").select("address,reaction_key").eq("article_id",id);
  const counts:Record<string,number>={}, voters:Record<string,string>={};
  for (const r of data||[]) { counts[r.reaction_key]=(counts[r.reaction_key]||0)+1; voters[r.address]=r.reaction_key; }
  return NextResponse.json({ counts, voters });
}

export async function POST(req: NextRequest, { params }: C) {
  const { id } = await params;
  const { address, key } = await req.json();
  if (!address) return NextResponse.json({ error:"address required" }, { status:400 });
  const addr = address.toLowerCase();
  await supabase.from("reactions").delete().eq("article_id",id).eq("address",addr);
  if (key) await supabase.from("reactions").insert({ article_id:parseInt(id), address:addr, reaction_key:key });
  const { data } = await supabase.from("reactions").select("address,reaction_key").eq("article_id",id);
  const counts:Record<string,number>={}, voters:Record<string,string>={};
  for (const r of data||[]) { counts[r.reaction_key]=(counts[r.reaction_key]||0)+1; voters[r.address]=r.reaction_key; }
  return NextResponse.json({ counts, voters });
}
