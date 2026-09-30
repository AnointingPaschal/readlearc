/**
 * GET /api/agent
 * AI agent discovery + x402 purchase endpoint.
 *
 * Without payment: returns 402 with the content catalogue and pricing.
 * With X-Payment-Response or X-Payment-Tx header: verifies and returns content.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../lib/supabase";
import { build402, hasPaymentProof, extractTxHash } from "../../../lib/x402";
import { TREASURY_ADDRESS, ARC_CHAIN_ID } from "../../../lib/arc";

const AGENT_ACCESS_PRICE = "0.01"; // 1 cent per agent API call

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contentId   = searchParams.get("contentId") || "";
  const contentType = searchParams.get("type")      || "article";

  // ── With payment proof: return content ───────────────────────
  if (hasPaymentProof(req)) {
    const txHash = extractTxHash(req);

    if (contentType === "article" && contentId) {
      const { data: article } = await supabase
        .from("articles")
        .select("id,title,blurb,content,price,category,author_address,reads")
        .eq("id", contentId)
        .eq("status", "approved")
        .single();

      if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
      return NextResponse.json({ ok: true, txHash, article });
    }

    if (contentType === "video" && contentId) {
      const { data: video } = await supabase
        .from("videos")
        .select("id,slug,title,blurb,price_per_sec_usdc,free_preview_secs,duration_seconds,hls_master_url,creator_address")
        .eq("slug", contentId)
        .eq("status", "approved")
        .single();

      if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });
      return NextResponse.json({ ok: true, txHash, video });
    }

    // No specific content — return catalogue
    const { data: articles } = await supabase
      .from("articles")
      .select("id,title,blurb,price,category,author_address")
      .eq("status", "approved")
      .order("reads", { ascending: false })
      .limit(20);

    const { data: videos } = await supabase
      .from("videos")
      .select("slug,title,blurb,price_per_sec_usdc,duration_seconds,creator_address")
      .eq("status", "approved")
      .order("views", { ascending: false })
      .limit(20);

    return NextResponse.json({ ok: true, txHash, articles: articles || [], videos: videos || [] });
  }

  // ── Without payment: return 402 ──────────────────────────────
  return build402({
    network:   `arc-mainnet:${ARC_CHAIN_ID}`,
    token:     "0x3600000000000000000000000000000000000000",
    amount:    AGENT_ACCESS_PRICE,
    seller:    TREASURY_ADDRESS,
    timeout:   Math.floor(Date.now() / 1000) + 300,
    contentId: contentId || "catalogue",
    memo:      "Readlearc agent API access",
  });
}
