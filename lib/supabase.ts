import { createClient, SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL  || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const IS_SUPABASE_CONFIGURED = !!(URL && KEY && URL !== "" && KEY !== "");

// Safe client — works even when env vars are missing (build-time)
export const supabase: SupabaseClient = createClient(
  URL || "https://placeholder.supabase.co",
  KEY || "placeholder-key"
);

/** Throw a readable error if Supabase isn't configured */
export function requireSupabase() {
  if (!IS_SUPABASE_CONFIGURED) {
    throw new Error(
      "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY to Vercel env vars, then redeploy."
    );
  }
}
