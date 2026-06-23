import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

const BRAND_KEYS = ["brand_color","bg_color","text_color","accent_color","card_color","border_color","brand_name","brand_tagline","brand_logo","site_name"];

export async function GET() {
  const { data } = await supabaseAdmin.from("platform_settings")
    .select("key,value").in("key", BRAND_KEYS);
  const brand: Record<string,string> = {};
  for (const row of data||[]) brand[row.key] = row.value;
  // defaults
  if (!brand.brand_color)  brand.brand_color  = "#6d28d9";
  if (!brand.bg_color)     brand.bg_color     = "#f9f8f7";
  if (!brand.text_color)   brand.text_color   = "#18181b";
  if (!brand.accent_color) brand.accent_color = "#059669";
  if (!brand.card_color)   brand.card_color   = "#ffffff";
  if (!brand.border_color) brand.border_color = "#e5e3e1";
  if (!brand.brand_name)   brand.brand_name   = brand.site_name || "Readlearc";
  if (!brand.brand_logo)   brand.brand_logo   = "";
  return NextResponse.json(brand);
}

export async function POST(req: Request) {
  const body = await req.json();
  const updates = Object.entries(body)
    .filter(([k]) => BRAND_KEYS.includes(k))
    .map(([key, value]) => ({ key, value: String(value), label: key, updated_at: new Date().toISOString() }));
  if (!updates.length) return NextResponse.json({ error:"No valid keys" }, { status:400 });
  const { error } = await supabaseAdmin.from("platform_settings")
    .upsert(updates, { onConflict:"key" });
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}
