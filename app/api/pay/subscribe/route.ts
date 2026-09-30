/**
 * POST /api/pay/subscribe
 * Records a subscription purchase after the on-chain payment is confirmed.
 * Calls ContentRegistry.recordSubscription via the recorder wallet (server-side).
 */
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { supabaseAdmin as supabase } from "../../../../lib/supabase";
import { signedContentRegistry } from "../../../../lib/contracts";
import { getProvider } from "../../../../lib/arc";

export async function POST(req: NextRequest) {
  try {
    const {
      subscriberAddress,
      creatorAddress,
      plan,          // 'monthly' | 'yearly'
      txHash,
      amountUsdc,
    } = await req.json();

    if (!subscriberAddress || !creatorAddress || !plan) {
      return NextResponse.json({ error: "subscriberAddress, creatorAddress, plan required" }, { status: 400 });
    }

    // ── Determine expiry ──────────────────────────────────────────
    const now = new Date();
    const expiry = new Date(now);
    if (plan === "yearly") {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }
    const expiryTs = Math.floor(expiry.getTime() / 1000);

    // ── Record on-chain if recorder key is configured ─────────────
    const recorderKey = process.env.RECORDER_PRIVATE_KEY;
    if (recorderKey && process.env.NEXT_PUBLIC_CONTENT_REG_ADDRESS) {
      try {
        const provider = getProvider();
        const signer   = new ethers.Wallet(recorderKey, provider);
        const contract = signedContentRegistry(signer);
        const gross    = ethers.parseUnits(String(amountUsdc || "0"), 6);
        const tx = await contract.recordSubscription(
          ethers.getAddress(creatorAddress),
          ethers.getAddress(subscriberAddress),
          BigInt(expiryTs),
          gross,
        );
        await tx.wait();
      } catch (e: any) {
        console.error("ContentRegistry.recordSubscription failed:", e.message);
        // Non-fatal — still record in Supabase
      }
    }

    // ── Upsert in Supabase ────────────────────────────────────────
    const { error: subErr } = await supabase.from("subscriptions").upsert(
      {
        creator_address:    creatorAddress.toLowerCase(),
        subscriber_address: subscriberAddress.toLowerCase(),
        plan,
        amount_usdc:        amountUsdc || 0,
        tx_hash:            txHash || null,
        expiry:             expiry.toISOString(),
        on_chain_expiry:    expiryTs,
        status:             "active",
      },
      { onConflict: "creator_address,subscriber_address" }
    );

    if (subErr) {
      console.error("subscriptions upsert failed:", subErr.message);
    }

    // Record article earnings for the creator
    const gross    = parseFloat(amountUsdc || "0");
    const creatorAmt = gross * 0.98; // 2% platform fee
    await supabase.from("earnings").insert({
      writer_address: creatorAddress.toLowerCase(),
      article_id:     null,
      reader_address: subscriberAddress.toLowerCase(),
      gross_amount:   gross,
      writer_amount:  creatorAmt.toFixed(6),
      tx_hash:        txHash || null,
      period:         new Date().toISOString().slice(0, 7),
      status:         "pending",
    }).catch(() => {});

    // Notify creator
    await supabase.from("notifications").insert({
      user_address: creatorAddress.toLowerCase(),
      type:         "subscription",
      title:        "New Subscriber!",
      body:         `${subscriberAddress.slice(0,6)}… subscribed (${plan}) — $${gross.toFixed(2)} USDC`,
      link:         "/creator",
    }).catch(() => {});

    return NextResponse.json({ ok: true, expiry: expiry.toISOString() });
  } catch (e: any) {
    console.error("pay/subscribe error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creator    = searchParams.get("creator");
  const subscriber = searchParams.get("subscriber");

  if (!creator || !subscriber) {
    return NextResponse.json({ error: "creator and subscriber required" }, { status: 400 });
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("creator_address", creator.toLowerCase())
    .eq("subscriber_address", subscriber.toLowerCase())
    .maybeSingle();

  if (!data) return NextResponse.json({ subscribed: false });

  const active = data.status === "active" && new Date(data.expiry) > new Date();
  return NextResponse.json({ subscribed: active, expiry: data.expiry, plan: data.plan });
}
