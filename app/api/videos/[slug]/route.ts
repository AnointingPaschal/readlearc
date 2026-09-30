/**
 * GET    /api/videos/[slug]   — single video
 * PATCH  /api/videos/[slug]   — update video (creator only)
 * DELETE /api/videos/[slug]   — delete video (creator only)
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../lib/supabase";

type C = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: C) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ video: data });
}

export async function PATCH(req: NextRequest, { params }: C) {
  const { slug } = await params;
  const body = await req.json();
  const { callerAddress, ...updates } = body;

  const { data: video } = await supabase.from("videos").select("creator_address").eq("slug", slug).single();
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (callerAddress?.toLowerCase() !== video.creator_address?.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Only allow safe fields to be updated
  const allowed: Record<string, unknown> = {};
  const safe = ["title","blurb","price_per_sec_usdc","free_preview_secs","thumbnail_url","category","hls_master_url","duration_seconds"];
  for (const k of safe) { if (k in updates) allowed[k] = updates[k]; }

  const { data, error } = await supabase.from("videos").update(allowed).eq("slug", slug).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ video: data });
}

export async function DELETE(req: NextRequest, { params }: C) {
  const { slug } = await params;
  const { callerAddress } = await req.json();

  const { data: video } = await supabase.from("videos").select("creator_address").eq("slug", slug).single();
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (callerAddress?.toLowerCase() !== video.creator_address?.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await supabase.from("videos").delete().eq("slug", slug);
  return NextResponse.json({ ok: true });
}
