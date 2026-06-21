import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
export async function GET() {
  const { data } = await supabaseAdmin.from("notifications").select("*").order("created_at",{ascending:false}).limit(100);
  return NextResponse.json(data||[]);
}
