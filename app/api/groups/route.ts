import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as sb } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const p = new URLSearchParams(req.url.split("?")[1] || "");
  const member = p.get("member");
  const type   = p.get("type"); // public | private | all
  const q      = p.get("q");

  let query = sb.from("groups").select("*").order("created_at", { ascending: false });
  if (type && type !== "all") query = query.eq("type", type);
  else if (!member) query = query.eq("type", "public");
  if (q) query = query.ilike("name", `%${q}%`);
  if (member) query = query.contains("member_addresses", [member.toLowerCase()]);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.name || !b.ownerAddress)
    return NextResponse.json({ error: "name and ownerAddress required" }, { status: 400 });

  const { data, error } = await sb.from("groups").insert({
    name:             b.name.trim(),
    description:      b.description || "",
    type:             b.type === "private" ? "private" : "public",
    category:         b.category || "General",
    owner_address:    b.ownerAddress.toLowerCase(),
    banner_image:     b.bannerImage || null,
    member_addresses: [b.ownerAddress.toLowerCase()],
    member_count:     1,
    post_count:       0,
    rules:            b.rules || "",
    tags:             b.tags || [],
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
