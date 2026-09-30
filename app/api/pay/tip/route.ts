/**
 * POST /api/pay/tip
 * Records a tip after the on-chain CreatorTip.tip() call.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const {
      fromAddress,
      toAddress,
      amountUsdc,
      contentId,
      contentType,   // 'article' | 'video'
      txHash,
    } = await req.json();

    if (!fromAddress || !toAddress || !amountUsdc) {
      return NextResponse.json({ error: "fromAddress, toAddress, amountUsdc required" }, { status: 400 });
    }

    const { error } = await supabase.from("tips").insert({
      from_address:  fromAddress.toLowerCase(),
      to_address:    toAddress.toLowerCase(),
      amount_usdc:   amountUsdc,
      content_id:    contentId || null,
      content_type:  contentType || null,
      tx_hash:       txHash || null,
    });

    if (error) {
      console.error("tips insert failed:", error.message);
    }

    // Notify creator
    await supabase.from("notifications").insert({
      user_address: toAddress.toLowerCase(),
      type:         "tip",
      title:        "You received a tip!",
      body:         `${fromAddress.slice(0,6)}… tipped you $${parseFloat(amountUsdc).toFixed(3)} USDC`,
      link:         contentType === "video" ? `/watch/${contentId}` : `/article/${contentId}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("pay/tip error:", e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
  }
}
