/**
 * GET /api/earnings/video?address=0x...
 * Returns video earnings summary for a creator.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const address = new URL(req.url).searchParams.get("address");
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const { data: earnings } = await supabaseAdmin
    .from("video_earnings")
    .select("gross_usdc,creator_usdc,seconds_watched,video_slug,videos(title)")
    .eq("creator_address", address.toLowerCase());

  const totalGross   = (earnings || []).reduce((s, e) => s + parseFloat(e.gross_usdc || "0"), 0);
  const totalCreator = (earnings || []).reduce((s, e) => s + parseFloat(e.creator_usdc || "0"), 0);
  const totalSeconds = (earnings || []).reduce((s, e) => s + (e.seconds_watched || 0), 0);

  // Per-video breakdown
  const byVideo: Record<string, { title: string; grossUsdc: number; secondsWatched: number }> = {};
  for (const e of earnings || []) {
    const slug = e.video_slug || "unknown";
    if (!byVideo[slug]) byVideo[slug] = { title: (e as any).videos?.title || slug, grossUsdc: 0, secondsWatched: 0 };
    byVideo[slug].grossUsdc      += parseFloat(e.gross_usdc || "0");
    byVideo[slug].secondsWatched += (e.seconds_watched || 0);
  }

  return NextResponse.json({
    totalGross,
    totalCreator,
    totalSeconds,
    byVideo: Object.entries(byVideo).map(([slug, d]) => ({ slug, ...d })),
  });
}
