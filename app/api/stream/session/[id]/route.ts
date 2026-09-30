/**
 * GET /api/stream/session/[id]
 * Returns the current state of a streaming session.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../../lib/supabase";

type C = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: C) {
  const { id: sessionId } = await params;

  const { data: session, error } = await supabase
    .from("stream_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}
