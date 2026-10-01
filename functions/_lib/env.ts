export interface Env {
  /** Workers KV namespace: admin-editable config, settings, AI keys, analysis results. */
  RL_KV: KVNamespace;
  /** Optional secret used to derive content-encryption keys. If unset, one is generated and kept in KV. */
  CONTENT_MASTER_SECRET?: string;
  /** Comma-separated wallet addresses that may use the admin API before on-chain roles exist (bootstrap). */
  ADMIN_ADDRESSES?: string;
  // Optional chain defaults (overridden by what the admin saves in KV)
  CHAIN_ID?: string; CHAIN_NAME?: string; RPC_URL?: string; EXPLORER_URL?: string; FAUCET_URL?: string;
  USDC_ADDRESS?: string; ROLES_ADDRESS?: string; CONTENT_STORE_ADDRESS?: string; SOCIAL_ADDRESS?: string;
  MONETIZATION_ADDRESS?: string; PAYMENTS_ADDRESS?: string; STREAM_PAY_ADDRESS?: string; TREASURY_ADDRESS?: string;
  /** Banking (all optional; can also be saved in Admin → Finance → Banking). */
  CIRCLE_API_KEY?: string; CIRCLE_ENV?: string; CIRCLE_BASE?: string; CIRCLE_ACCOUNT_ID?: string; CIRCLE_CLIENT_ENTITY_ID?: string;
  PAYSTACK_SECRET_KEY?: string; PAYSTACK_BASE?: string;
  START_BLOCK?: string; CHUNK_BYTES?: string; TX_BYTES?: string;
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });
export const err = (message: string, status = 400) => json({ error: message }, status);
