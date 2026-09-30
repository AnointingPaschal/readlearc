/**
 * POST /api/stream/session/[id]/heartbeat
 * Called every second by the video player with a signed voucher.
 * Verifies the signature and advances the session counter.
 * Returns 200 (serve next segment) or 402 (payment insufficient).
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../../../lib/supabase";
import { verifyVoucher } from "../../../../../../lib/stream-channel";

type C = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: C) {
  const { id: sessionId } = await params;

  try {
    const { amountOwed, secondsWatched, signature } = await req.json();

    if (!amountOwed || !signature) {
      return NextResponse.json({ error: "amountOwed and signature required" }, { status: 400 });
    }

    // ── Load session from Supabase ────────────────────────────────
    const { data: session, error: sErr } = await supabase
      .from("stream_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sErr || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status !== "open") {
      return NextResponse.json({ error: "Session is closed" }, { status: 400 });
    }

    // ── Verify voucher ────────────────────────────────────────────
    const result = verifyVoucher(
      {
        sessionId,
        amountOwed:  BigInt(amountOwed),
        secondsWatched: secondsWatched || 0,
        signature,
      },
      session.session_key,
      BigInt(session.amount_owed_native || "0"),
      BigInt(session.deposit_native || "0"),
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 402 });
    }

    // ── Update session counters ───────────────────────────────────
    const { error: upErr } = await supabase
      .from("stream_sessions")
      .update({
        amount_owed_native: amountOwed.toString(),
        seconds_watched:    secondsWatched || 0,
      })
      .eq("id", sessionId);

    if (upErr) {
      console.error("heartbeat update failed:", upErr.message);
    }

    return NextResponse.json({ ok: true, serve: true });
  } catch (e: any) {
    console.error("heartbeat error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
