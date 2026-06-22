import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as sb } from "../../../../lib/supabase";

const TABLES = ["groups","group_posts","profiles"];

export async function GET() {
  const checks: Record<string,any> = {};
  for (const t of TABLES) {
    const { error } = await (sb.from(t as any).select("id").limit(1) as any);
    checks[t] = error
      ? { exists: false, error: error.message }
      : { exists: true };
  }
  return NextResponse.json({ tables: checks });
}
