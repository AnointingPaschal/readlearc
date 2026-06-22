import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as sb } from "../../../../../lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { memberAddress } = await req.json();
  if (!memberAddress) return NextResponse.json({ error: "memberAddress required" }, { status: 400 });
  const addr = memberAddress.toLowerCase();
  const { data: g } = await sb.from("groups").select("member_addresses,member_count").eq("id", id).single();
  if (!g) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  const members: string[] = g.member_addresses || [];
  if (members.includes(addr)) return NextResponse.json({ ok: true, already: true });
  await sb.from("groups").update({ member_addresses: [...members, addr], member_count: (g.member_count||0)+1 }).eq("id", id);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { memberAddress, action } = await req.json();
  if (action !== "leave") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  const addr = memberAddress?.toLowerCase();
  const { data: g } = await sb.from("groups").select("member_addresses,member_count,owner_address").eq("id", id).single();
  if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (g.owner_address === addr) return NextResponse.json({ error: "Owner cannot leave" }, { status: 400 });
  const members = (g.member_addresses||[]).filter((m: string) => m !== addr);
  await sb.from("groups").update({ member_addresses: members, member_count: members.length }).eq("id", id);
  return NextResponse.json({ ok: true });
}
