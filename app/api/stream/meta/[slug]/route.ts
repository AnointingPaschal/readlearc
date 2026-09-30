/**
 * GET /api/stream/meta/[slug]
 * Returns video metadata — rate, duration, free preview seconds, HLS URL.
 * Public endpoint (no auth).
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../../lib/supabase";

type C = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: C) {
  const { slug } = await params;

  const { data: video, error } = await supabase
    .from("videos")
    .select("slug,title,blurb,creator_address,price_per_sec_usdc,free_preview_secs,duration_seconds,hls_master_url,thumbnail_url,category,views")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (error || !video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json({ video });
}
