import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Service role key bypasses RLS — server-side API routes only, never expose to client
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const IS_SUPABASE_CONFIGURED = !!(URL && ANON_KEY);

// Client-side: uses anon key (respects RLS)
export const supabase = createClient(
  URL || "https://placeholder.supabase.co",
  ANON_KEY || "placeholder"
);

// Server-side: uses service role key (bypasses RLS entirely)
// Falls back to anon key if service role not set
export const supabaseAdmin = createClient(
  URL || "https://placeholder.supabase.co",
  SERVICE_KEY || ANON_KEY || "placeholder"
);
