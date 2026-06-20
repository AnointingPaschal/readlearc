
import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const readerAddress = searchParams.get("reader");
  const admin = searchParams.get("admin") === "1";

  try {
    const { rows } = await sql("SELECT * FROM articles WHERE id=$1", [id]);
    if (!rows.length) return NextResponse.json({ error:"Not found" }, { status:404 });
    const a = rows[0];

    // Check if reader has paid
    let hasPaid = false;
    if (readerAddress) {
      const r = await sql(
        "SELECT 1 FROM read_receipts WHERE article_id=$1 AND LOWER(reader_address)=LOWER($2)",
        [id, readerAddress]
      );
      hasPaid = r.rows.length > 0;
    }

    // Author always has full access
    const isAuthor = readerAddress && readerAddress.toLowerCase() === a.author_address.toLowerCase();
    const unlocked = hasPaid || isAuthor || admin;

    return NextResponse.json({
      id:            String(a.id),
      title:         a.title,
      blurb:         a.blurb,
      content:       unlocked ? a.content : undefined,
      price:         Number(a.price).toFixed(6),
      priceRaw:      a.price,
      category:      a.category,
      readTime:      a.read_time,
      isResearch:    a.is_research,
      authorAddress: a.author_address,
      authorShort:   a.author_address.slice(0,6) + "…" + a.author_address.slice(-4),
      status:        a.status,
      featured:      a.featured,
      reads:         a.reads,
      hasPaid,
      timestamp:     Math.floor(new Date(a.created_at).getTime()/1000),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { title, blurb, content, price, category, readTime, isResearch, authorAddress } = body;
    if (!authorAddress) return NextResponse.json({ error:"authorAddress required" }, { status:400 });

    // Verify ownership (or admin)
    const { rows } = await sql("SELECT author_address FROM articles WHERE id=$1", [id]);
    if (!rows.length) return NextResponse.json({ error:"Not found" }, { status:404 });
    const isAuthor = rows[0].author_address.toLowerCase() === authorAddress.toLowerCase();
    const isAdmin  = body.adminKey === process.env.ADMIN_SECRET;
    if (!isAuthor && !isAdmin) return NextResponse.json({ error:"Forbidden" }, { status:403 });

    const { rows: updated } = await sql(`
      UPDATE articles SET
        title=$1, blurb=$2, content=$3, price=$4, category=$5,
        read_time=$6, is_research=$7
      WHERE id=$8 RETURNING *
    `, [title, blurb, content, price, category, readTime, isResearch, id]);

    return NextResponse.json({ ok:true, id: updated[0].id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await req.json().catch(()=>({}));
    const { authorAddress, adminKey } = body;
    const isAdmin = adminKey === process.env.ADMIN_SECRET;

    if (!isAdmin) {
      const { rows } = await sql("SELECT author_address FROM articles WHERE id=$1", [id]);
      if (!rows.length) return NextResponse.json({ error:"Not found" }, { status:404 });
      if (rows[0].author_address.toLowerCase() !== authorAddress?.toLowerCase()) {
        return NextResponse.json({ error:"Forbidden" }, { status:403 });
      }
    }

    await sql("DELETE FROM articles WHERE id=$1", [id]);
    return NextResponse.json({ ok:true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}
