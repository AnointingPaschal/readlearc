
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== "readlearc-setup")
    return NextResponse.json({ error:"Add ?key=readlearc-setup" }, { status:401 });

  // With Supabase, run schema SQL in the Supabase SQL Editor instead.
  // This endpoint just verifies the connection and lists tables.
  try {
    const { data, error } = await supabase.from("articles").select("id").limit(1);
    if (error && error.code === "42P01") {
      return NextResponse.json({
        success: false,
        message: "Tables not found. Run the schema SQL in Supabase → SQL Editor.",
        hint: "Paste db/schema.sql into https://supabase.com/dashboard → SQL Editor → Run",
      });
    }
    return NextResponse.json({
      success: true,
      message: "Supabase connected! Tables exist.",
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}
