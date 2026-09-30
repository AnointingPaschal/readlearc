/**
 * x402 HTTP 402 helpers — article paywall and agent-facing payment negotiation.
 */
import { NextResponse } from "next/server";
import { USDC_ADDRESS, ARC_CHAIN_ID, TREASURY_ADDRESS } from "./arc";

export interface PaymentAccept {
  network:   string;
  token:     string;
  amount:    string;      // USDC (6 dec, decimal string)
  seller:    string;      // treasury or writer address
  timeout:   number;      // unix timestamp
  contentId: string;      // off-chain content identifier
  memo?:     string;
}

/** Build a 402 Payment Required response with x402-standard headers */
export function build402(accept: PaymentAccept): NextResponse {
  const body = {
    error:    "Payment Required",
    x402:     true,
    accepts:  [
      {
        scheme:    "exact",
        network:   `arc-mainnet:${ARC_CHAIN_ID}`,
        token:     accept.token || USDC_ADDRESS,
        amount:    accept.amount,
        payTo:     accept.seller || TREASURY_ADDRESS,
        timeout:   accept.timeout,
        contentId: accept.contentId,
        memo:      accept.memo || "",
      },
    ],
  };

  return NextResponse.json(body, {
    status:  402,
    headers: {
      "X-Payment-Required": "true",
      "X-Price-USDC":       accept.amount,
      "X-Token-Address":    accept.token || USDC_ADDRESS,
      "X-Chain-Id":         String(ARC_CHAIN_ID),
      "Content-Type":       "application/json",
    },
  });
}

/** Build a payment-accepted response with the content + tx hash */
export function buildPaymentOk(content: unknown, txHash: string): NextResponse {
  return NextResponse.json(
    { ok: true, content, txHash },
    {
      status:  200,
      headers: { "X-Payment-Tx": txHash },
    }
  );
}

/** Minimal check: does a request carry a payment-response header? */
export function hasPaymentProof(req: Request): boolean {
  return !!(
    req.headers.get("x-payment-response") ||
    req.headers.get("x-payment-tx") ||
    req.headers.get("authorization")?.startsWith("x402 ")
  );
}

/** Extract tx hash from the payment response header */
export function extractTxHash(req: Request): string | null {
  const header = req.headers.get("x-payment-response") || req.headers.get("x-payment-tx");
  if (!header) return null;
  // If it's a JSON object, try parsing
  try {
    const parsed = JSON.parse(header);
    return parsed.txHash || parsed.transaction || null;
  } catch {
    // Treat as raw hash
    return header.startsWith("0x") ? header : null;
  }
}
