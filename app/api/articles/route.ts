
import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit    = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const category = searchParams.get("category");
  const author   = searchParams.get("author");
  const search   = searchParams.get("q");
  const featured = searchParams.get("featured");
  const admin    = searchParams.get("admin") === "1"; // admin sees all statuses

  let where   = admin ? "" : "WHERE a.status IN ('approved','featured')";
  const params: any[] = [];
  let  p = 1;

  if (!admin) {
    const conditions: string[] = ["a.status IN ('approved','featured')"];
    if (category && category !== "All") { conditions.push(`a.category = $${p++}`); params.push(category); }
    if (author)   { conditions.push(`LOWER(a.author_address) = LOWER($${p++})`); params.push(author); }
    if (featured === "1") { conditions.push("a.featured = TRUE"); }
    if (search)   { conditions.push(`(a.title ILIKE $${p++} OR a.blurb ILIKE $${p++})`); params.push(`%${search}%`, `%${search}%`); p--; p++; }
    where = "WHERE " + conditions.join(" AND ");
  } else {
    const conditions: string[] = [];
    if (category && category !== "All") { conditions.push(`a.category = $${p++}`); params.push(category); }
    if (author)   { conditions.push(`LOWER(a.author_address) = LOWER($${p++})`); params.push(author); }
    if (search)   { conditions.push(`(a.title ILIKE $${p++} OR a.blurb ILIKE $${p++})`); params.push(`%${search}%`, `%${search}%`); p--; p++; }
    if (conditions.length) where = "WHERE " + conditions.join(" AND ");
  }

  params.push(limit);

  try {
    const { rows } = await sql(`
      SELECT
        a.id, a.title, a.blurb, a.price::float, a.category,
        a.read_time, a.is_research, a.author_address,
        a.status, a.featured, a.reads,
        EXTRACT(EPOCH FROM a.created_at)::int AS timestamp
      FROM articles a
      ${where}
      ORDER BY a.created_at DESC
      LIMIT $${p}
    `, params);
    return NextResponse.json(rows.map(formatArticle));
  } catch (e: any) {
    console.error("GET /api/articles:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, blurb, content, price, category, readTime, isResearch, authorAddress } = body;
    if (!title || !content || !authorAddress) {
      return NextResponse.json({ error: "title, content and authorAddress required" }, { status: 400 });
    }

    const words    = content.split(/\s+/).filter(Boolean).length;
    const readTime2 = readTime || Math.max(1, Math.ceil(words / 200));

    const { rows } = await sql(`
      INSERT INTO articles (title, blurb, content, price, category, read_time, is_research, author_address, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
      RETURNING *
    `, [title, blurb||"", content, price||0.02, category||"General", readTime2, isResearch||false, authorAddress]);

    return NextResponse.json(formatArticle(rows[0]), { status: 201 });
  } catch (e: any) {
    console.error("POST /api/articles:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function formatArticle(row: any) {
  return {
    id:            String(row.id),
    title:         row.title,
    blurb:         row.blurb,
    price:         Number(row.price).toFixed(6),
    category:      row.category,
    readTime:      row.read_time,
    isResearch:    row.is_research,
    authorAddress: row.author_address,
    authorShort:   row.author_address.slice(0,6) + "…" + row.author_address.slice(-4),
    status:        row.status,
    featured:      row.featured,
    reads:         row.reads,
    timestamp:     row.timestamp || Math.floor(Date.now()/1000),
  };
}
