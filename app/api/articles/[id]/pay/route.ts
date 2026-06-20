
import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../../../lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const { readerAddress, txHash, amountPaid } = await req.json();
    if (!readerAddress) return NextResponse.json({ error:"readerAddress required" }, { status:400 });

    // Check article exists
    const { rows } = await sql("SELECT id, price, author_address FROM articles WHERE id=$1", [id]);
    if (!rows.length) return NextResponse.json({ error:"Article not found" }, { status:404 });

    // Store read receipt (upsert so re-pay doesn't error)
    await sql(`
      INSERT INTO read_receipts (article_id, reader_address, tx_hash, amount_paid)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (article_id, reader_address) DO UPDATE
        SET tx_hash=EXCLUDED.tx_hash, amount_paid=EXCLUDED.amount_paid
    `, [id, readerAddress.toLowerCase(), txHash||null, amountPaid||null]);

    // Increment read count
    await sql("UPDATE articles SET reads=reads+1 WHERE id=$1", [id]);

    // Return full article content
    const { rows: articles } = await sql("SELECT * FROM articles WHERE id=$1", [id]);
    const a = articles[0];

    return NextResponse.json({
      ok:      true,
      content: a.content,
      id:      String(a.id),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status:500 });
  }
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const reader = searchParams.get("reader");
  if (!reader) return NextResponse.json({ paid:false });

  const { rows } = await sql(
    "SELECT 1 FROM read_receipts WHERE article_id=$1 AND LOWER(reader_address)=LOWER($2)",
    [id, reader]
  );
  return NextResponse.json({ paid: rows.length > 0 });
}
