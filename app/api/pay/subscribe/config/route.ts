/**
 * GET  /api/pay/subscribe/config?creator=0x...
 * POST /api/pay/subscribe/config
 * Creator subscription pricing configuration.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../../lib/supabase";

export async function GET(req: NextRequest) {
  const creator = new URL(req.url).searchParams.get("creator");
  if (!creator) return NextResponse.json({ error: "creator required" }, { status: 400 });

  const { data } = await supabase
    .from("creator_subscriptions")
    .select("*")
    .eq("creator_address", creator.toLowerCase())
    .maybeSingle();

  if (!data) {
    // Default config
    return NextResponse.json({ config: { monthly_price_usdc: "5.000000", yearly_price_usdc: "50.000000", enabled: false } });
  }

  return NextResponse.json({ config: data });
}

export async function POST(req: NextRequest) {
  const { creatorAddress, monthlyPrice, yearlyPrice, enabled } = await req.json();
  if (!creatorAddress) return NextResponse.json({ error: "creatorAddress required" }, { status: 400 });

  const { error } = await supabase.from("creator_subscriptions").upsert(
    {
      creator_address:    creatorAddress.toLowerCase(),
      monthly_price_usdc: monthlyPrice ?? 5.0,
      yearly_price_usdc:  yearlyPrice  ?? 50.0,
      enabled:            enabled       ?? true,
      updated_at:         new Date().toISOString(),
    },
    { onConflict: "creator_address" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
