// Deprecated — use lib/supabase.ts instead
// Kept as a re-export for any remaining imports
export { supabase as default } from "./supabase";
export async function sql() { throw new Error("Use lib/supabase.ts instead of lib/db.ts"); }
