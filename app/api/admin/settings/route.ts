import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("platform_settings").select("*").order("key");
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  const settings: Record<string,string> = {};
  for (const row of data||[]) settings[row.key] = row.value;
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const updates = Object.entries(body).map(([key, value]) => ({
    key, value: String(value), updated_at: new Date().toISOString(),
  }));
  const { error } = await supabaseAdmin.from("platform_settings")
    .upsert(updates, { onConflict:"key" });
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ ok: true });
}
