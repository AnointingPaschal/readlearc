/**
 * GET  /api/videos      — list approved videos (paginated)
 * POST /api/videos      — create a new video entry (creator)
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit    = parseInt(searchParams.get("limit")   || "20");
  const offset   = parseInt(searchParams.get("offset")  || "0");
  const category = searchParams.get("category") || "";
  const creator  = searchParams.get("creator")  || "";
  const featured = searchParams.get("featured") === "true";

  let query = supabase
    .from("videos")
    .select("id,slug,title,blurb,creator_address,price_per_sec_usdc,free_preview_secs,duration_seconds,thumbnail_url,category,views,featured,total_seconds_sold,created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  if (creator)  query = query.eq("creator_address", creator.toLowerCase());
  if (featured) query = query.eq("featured", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ videos: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      creatorAddress,
      title,
      blurb,
      slug,
      pricePerSecUsdc,
      freePreviewSecs,
      durationSeconds,
      hlsMasterUrl,
      thumbnailUrl,
      category,
    } = body;

    if (!creatorAddress || !title || !slug) {
      return NextResponse.json({ error: "creatorAddress, title, slug required" }, { status: 400 });
    }

    const { data, error } = await supabase.from("videos").insert({
      creator_address:    creatorAddress.toLowerCase(),
      title,
      blurb:              blurb || "",
      slug:               slug.toLowerCase().replace(/\s+/g, "-"),
      price_per_sec_usdc: pricePerSecUsdc ?? 0.0001,
      free_preview_secs:  freePreviewSecs  ?? 30,
      duration_seconds:   durationSeconds  ?? 0,
      hls_master_url:     hlsMasterUrl     || "",
      thumbnail_url:      thumbnailUrl     || null,
      category:           category         || "General",
      status:             "pending",
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ video: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
