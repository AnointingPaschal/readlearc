/**
 * POST /api/stream/session/[id]/close
 * Called when the viewer stops watching.
 * Updates the session status in Supabase and records video earnings.
 * The actual closeSession() on-chain call is made by the client;
 * this route records the settlement.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../../../lib/supabase";
import { nativeToUsdc } from "../../../../../../lib/arc";

type C = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: C) {
  const { id: sessionId } = await params;

  try {
    const { closeTxHash, amountOwedNative, secondsWatched } = await req.json();

    // ── Load session ──────────────────────────────────────────────
    const { data: session, error: sErr } = await supabase
      .from("stream_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sErr || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // ── Mark session closed ───────────────────────────────────────
    await supabase.from("stream_sessions").update({
      status:             "closed",
      close_tx_hash:      closeTxHash || null,
      amount_owed_native: amountOwedNative || session.amount_owed_native,
      seconds_watched:    secondsWatched   || session.seconds_watched,
      closed_at:          new Date().toISOString(),
    }).eq("id", sessionId);

    // ── Record video earnings ─────────────────────────────────────
    const finalAmountNative = BigInt(amountOwedNative || session.amount_owed_native || "0");
    const grossUsdc  = parseFloat(nativeToUsdc(finalAmountNative));
    // Approximate creator share (platform fee ~2%). Exact on-chain; this is for display.
    const platformFeeBps = 200;
    const creatorUsdc = grossUsdc * (1 - platformFeeBps / 10000);

    if (grossUsdc > 0) {
      await supabase.from("video_earnings").insert({
        creator_address: session.creator_address,
        video_slug:      session.video_slug,
        session_id:      sessionId,
        viewer_address:  session.viewer_address,
        seconds_watched: secondsWatched || session.seconds_watched,
        gross_usdc:      grossUsdc.toFixed(8),
        creator_usdc:    creatorUsdc.toFixed(8),
        tx_hash:         closeTxHash || null,
        period:          new Date().toISOString().slice(0, 7),
        status:          "settled",
      });

      // Update total seconds sold on video
      await supabase.rpc("increment_video_seconds", {
        p_slug:    session.video_slug,
        p_seconds: secondsWatched || session.seconds_watched || 0,
      }).catch(() => {}); // non-critical

      // Notify creator
      await supabase.from("notifications").insert({
        user_address: session.creator_address,
        type:         "video_sale",
        title:        "Video Watched!",
        body:         `${(session.viewer_address || "").slice(0, 6)}… watched ${secondsWatched || 0}s — earned $${creatorUsdc.toFixed(4)} USDC`,
        link:         `/watch/${session.video_slug}`,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, grossUsdc, creatorUsdc });
  } catch (e: any) {
    console.error("stream/close error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
