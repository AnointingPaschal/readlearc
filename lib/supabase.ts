import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(url, key);

export function check<T>(result: { data: T | null; error: any }): T {
  if (result.error) throw new Error(result.error.message || JSON.stringify(result.error));
  return result.data as T;
}
