
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await req.json();
    const update: any = {};
    if (body.status   !== undefined) update.status   = body.status;
    if (body.featured !== undefined) update.featured = body.featured;
    if (body.title    !== undefined) update.title    = body.title;
    if (body.blurb    !== undefined) update.blurb    = body.blurb;
    if (body.content  !== undefined) update.content  = body.content;
    if (body.price    !== undefined) update.price    = body.price;
    if (body.category !== undefined) update.category = body.category;
    if (!Object.keys(update).length) return NextResponse.json({ error:"Nothing to update" }, { status:400 });
    const { data, error } = await supabase.from("articles").update(update).eq("id", id).select("id,status,featured").single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok:true, ...data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}
