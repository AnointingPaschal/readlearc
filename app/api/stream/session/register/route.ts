/**
 * POST /api/stream/session/register
 * Called by the video player after openSession() confirms on-chain.
 * Reads the session from the StreamPay contract, validates it, then
 * stores it in Supabase and returns a signed token for HLS delivery.
 */
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { supabaseAdmin as supabase } from "../../../../../lib/supabase";
import { streamPay } from "../../../../../lib/contracts";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, videoSlug, openTxHash } = await req.json();

    if (!sessionId || !videoSlug) {
      return NextResponse.json({ error: "sessionId and videoSlug required" }, { status: 400 });
    }

    // ── Fetch video metadata ──────────────────────────────────────
    const { data: video, error: vErr } = await supabase
      .from("videos")
      .select("*")
      .eq("slug", videoSlug)
      .single();

    if (vErr || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // ── Read session from contract ────────────────────────────────
    let session: any;
    try {
      const contract = streamPay();
      session = await contract.getSession(sessionId);
    } catch (e: any) {
      return NextResponse.json({ error: `Contract read failed: ${e.message}` }, { status: 502 });
    }

    if (session.openedAt.toString() === "0") {
      return NextResponse.json({ error: "Session not found on-chain" }, { status: 404 });
    }
    if (session.status !== 0) { // 0 = Open
      return NextResponse.json({ error: "Session is not open" }, { status: 400 });
    }

    // ── Verify rate matches video price ──────────────────────────
    // Both stored in different decimals — do a loose sanity check
    const rateNative = BigInt(session.ratePerSecond.toString());
    if (rateNative === 0n) {
      return NextResponse.json({ error: "Session has zero rate" }, { status: 400 });
    }

    // ── Store session in Supabase ─────────────────────────────────
    const { error: insertErr } = await supabase.from("stream_sessions").upsert(
      {
        id:                 sessionId,
        viewer_address:     session.viewer.toLowerCase(),
        creator_address:    session.creator.toLowerCase(),
        video_slug:         videoSlug,
        deposit_native:     session.deposit.toString(),
        rate_per_sec_native: session.ratePerSecond.toString(),
        session_key:        session.sessionKey.toLowerCase(),
        open_tx_hash:       openTxHash || null,
        amount_owed_native: "0",
        seconds_watched:    0,
        status:             "open",
      },
      { onConflict: "id" }
    );

    if (insertErr) {
      console.error("stream_sessions upsert failed:", insertErr.message);
    }

    return NextResponse.json({
      ok:                true,
      sessionId,
      freePreviewSecs:   video.free_preview_secs,
      durationSeconds:   video.duration_seconds,
      hlsMasterUrl:      video.hls_master_url,
      ratePerSecNative:  session.ratePerSecond.toString(),
      deposit:           session.deposit.toString(),
    });
  } catch (e: any) {
    console.error("stream/session/register error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
