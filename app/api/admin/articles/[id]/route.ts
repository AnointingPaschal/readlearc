import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

export async function PATCH(req: NextRequest, { params }: C) {
  const { id } = await params;
  const b = await req.json();
  const u:any={};
  if (b.status!==undefined)   u.status=b.status;
  if (b.featured!==undefined) u.featured=b.featured;
  if (b.title!==undefined)    u.title=b.title;
  if (b.blurb!==undefined)    u.blurb=b.blurb;
  if (b.content!==undefined)  u.content=b.content;
  if (b.price!==undefined)    u.price=parseFloat(b.price);
  if (b.category!==undefined) u.category=b.category;
  if (!Object.keys(u).length) return NextResponse.json({ error:"Nothing to update" }, { status:400 });
  const { error } = await supabase.from("articles").update(u).eq("id",id);
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}

export async function DELETE(_: NextRequest, { params }: C) {
  const { id } = await params;
  const { error } = await supabase.from("articles").delete().eq("id",id);
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}
