
import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../../lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status");
  const limit    = Math.min(parseInt(searchParams.get("limit")||"100"), 500);
  const search   = searchParams.get("q");

  let where = "WHERE 1=1";
  const params: any[] = [];
  let p = 1;

  if (status && status !== "all") { where += ` AND a.status=$${p++}`; params.push(status); }
  if (search) { where += ` AND (a.title ILIKE $${p++} OR a.blurb ILIKE $${p++})`; params.push(`%${search}%`, `%${search}%`); p--; p++; }
  params.push(limit);

  const { rows } = await sql(`
    SELECT a.id, a.title, a.blurb, a.price::float, a.category,
           a.read_time, a.is_research, a.author_address,
           a.status, a.featured, a.reads,
           EXTRACT(EPOCH FROM a.created_at)::int AS timestamp,
           (SELECT COUNT(*) FROM read_receipts r WHERE r.article_id=a.id) AS paid_count
    FROM articles a ${where}
    ORDER BY a.created_at DESC LIMIT $${p}
  `, params);

  return NextResponse.json(rows.map((r: any) => ({
    id:            String(r.id),
    title:         r.title,
    blurb:         r.blurb,
    price:         Number(r.price).toFixed(6),
    category:      r.category,
    readTime:      r.read_time,
    isResearch:    r.is_research,
    authorAddress: r.author_address,
    authorShort:   r.author_address.slice(0,6)+"…"+r.author_address.slice(-4),
    status:        r.status,
    featured:      r.featured,
    reads:         r.reads,
    paidCount:     Number(r.paid_count),
    timestamp:     r.timestamp,
  })));
}
