import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

export async function GET(_: NextRequest, { params }: C) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin.from("drafts").select("*").eq("id",id).single();
  if (error) return NextResponse.json({ error:error.message }, { status:404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: C) {
  const { id } = await params;
  const b = await req.json();
  const { data, error } = await supabaseAdmin.from("drafts").update({
    title:      b.title,
    sections:   b.sections,
    refs: b.refs,
    keywords:   b.keywords,
    status:     b.status,
    last_saved: new Date().toISOString(),
  }).eq("id",id).select().single();
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: C) {
  const { id } = await params;
  await supabaseAdmin.from("drafts").delete().eq("id",id);
  return NextResponse.json({ ok:true });
}
