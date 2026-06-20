import { NextResponse } from "next/server";
import { supabase, IS_SUPABASE_CONFIGURED } from "../../../lib/supabase";

export async function GET() {
  const env = {
    SUPABASE_URL:  process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ set" : "✗ MISSING",
    SUPABASE_KEY:  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ set" : "✗ MISSING",
    USDC_ADDRESS:  process.env.NEXT_PUBLIC_USDC_ADDRESS || "(default 0x3600...)",
  };

  if (!IS_SUPABASE_CONFIGURED)
    return NextResponse.json({ ok:false, env, error:"Supabase not configured" });

  try {
    const { count, error } = await supabase.from("articles").select("*", { count:"exact", head:true });
    if (error) return NextResponse.json({ ok:false, env, error:error.message });
    return NextResponse.json({ ok:true, env, articles:count });
  } catch (e:any) {
    return NextResponse.json({ ok:false, env, error:e.message });
  }
}
