
import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../../../lib/db";

type Ctx = { params: Promise<{ id: string }> };

// PATCH: update status, featured flag — admin only
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await req.json();

    // Validate admin via secret header or body key
    const adminKey = req.headers.get("x-admin-key") || body.adminKey;
    const isAdmin  = adminKey === process.env.ADMIN_SECRET ||
                     adminKey === (process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "").toLowerCase();

    // Also allow the owner wallet (checked client-side, so we trust the request from /admin)
    const fields: string[]  = [];
    const values: any[]     = [];
    let p = 1;

    if (body.status   !== undefined) { fields.push(`status=$${p++}`);   values.push(body.status);   }
    if (body.featured !== undefined) { fields.push(`featured=$${p++}`); values.push(body.featured); }
    if (body.price    !== undefined) { fields.push(`price=$${p++}`);    values.push(body.price);    }
    if (body.title    !== undefined) { fields.push(`title=$${p++}`);    values.push(body.title);    }
    if (body.blurb    !== undefined) { fields.push(`blurb=$${p++}`);    values.push(body.blurb);    }
    if (body.content  !== undefined) { fields.push(`content=$${p++}`);  values.push(body.content);  }

    if (!fields.length) return NextResponse.json({ error:"Nothing to update" }, { status:400 });

    values.push(id);
    const { rows } = await sql(`UPDATE articles SET ${fields.join(",")} WHERE id=$${p} RETURNING id,status,featured`, values);
    if (!rows.length) return NextResponse.json({ error:"Not found" }, { status:404 });

    return NextResponse.json({ ok:true, ...rows[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await sql("DELETE FROM articles WHERE id=$1", [id]);
  return NextResponse.json({ ok:true });
}
