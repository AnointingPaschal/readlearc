import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

type C = { params: Promise<{id:string}> };

export async function PATCH(req: NextRequest, { params }: C) {
  const { id } = await params;
  const b = await req.json();
  const updates: any = {};
  if (b.status   !== undefined) updates.status   = b.status;
  if (b.featured !== undefined) updates.featured  = b.featured;
  if (b.title    !== undefined) updates.title     = b.title;
  if (b.blurb    !== undefined) updates.blurb     = b.blurb;
  if (b.content  !== undefined) updates.content   = b.content;
  if (b.price    !== undefined) updates.price     = b.price;
  if (b.category !== undefined) updates.category  = b.category;

  const { error } = await supabaseAdmin.from("articles").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });

  // Notify author if approved
  if (b.status === "approved" || b.status === "featured") {
    const { data: a } = await supabaseAdmin.from("articles").select("author_address,title").eq("id",id).single();
    if (a) {
      await supabaseAdmin.from("notifications").insert({
        user_address: a.author_address,
        type:  "article_approved",
        title: b.status === "featured" ? "Your article was featured! 🌟" : "Your article was approved!",
        body:  `"${a.title?.slice(0,60)}" is now live on Readlearc.`,
        link:  `/article/${id}`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: C) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ ok: true });
}
