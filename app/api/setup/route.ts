import { NextRequest, NextResponse } from "next/server";
import { sql } from "../../../lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== "readlearc-setup") {
    return NextResponse.json({ error: "Add ?key=readlearc-setup to the URL" }, { status: 401 });
  }

  const steps: string[] = [];
  const errors: string[] = [];

  async function run(label: string, query: string) {
    try { await sql(query); steps.push("OK: " + label); }
    catch (e: any) { errors.push("FAIL: " + label + " — " + e.message); }
  }

  await run("articles", `CREATE TABLE IF NOT EXISTS articles (id SERIAL PRIMARY KEY, title TEXT NOT NULL, blurb TEXT NOT NULL, content TEXT NOT NULL, price NUMERIC(10,6) NOT NULL DEFAULT 0.020000, category VARCHAR(50) NOT NULL DEFAULT 'General', read_time INTEGER NOT NULL DEFAULT 3, is_research BOOLEAN NOT NULL DEFAULT FALSE, author_address VARCHAR(42) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', featured BOOLEAN NOT NULL DEFAULT FALSE, reads INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);

  await run("read_receipts", `CREATE TABLE IF NOT EXISTS read_receipts (id SERIAL PRIMARY KEY, article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE, reader_address VARCHAR(42) NOT NULL, tx_hash VARCHAR(66), amount_paid NUMERIC(10,6), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(article_id, reader_address))`);

  await run("comments", `CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE, author_address VARCHAR(42) NOT NULL, author_name VARCHAR(100), content TEXT NOT NULL, parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, edited BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);

  await run("reactions", `CREATE TABLE IF NOT EXISTS reactions (id SERIAL PRIMARY KEY, article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE, address VARCHAR(42) NOT NULL, reaction_key VARCHAR(20) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(article_id, address))`);

  await run("follows", `CREATE TABLE IF NOT EXISTS follows (id SERIAL PRIMARY KEY, follower_address VARCHAR(42) NOT NULL, following_address VARCHAR(42) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(follower_address, following_address))`);

  await run("updated_at function", `CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql`);

  await run("drop old trigger", `DROP TRIGGER IF EXISTS articles_updated_at ON articles`);

  await run("articles trigger", `CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at()`);

  const { rows } = await sql(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`).catch(() => ({ rows: [] as any[] }));

  return NextResponse.json({
    success:  errors.length === 0,
    message:  errors.length === 0 ? "Database ready!" : "Done with errors",
    steps,
    errors,
    tables:   rows.map((r: any) => r.table_name),
  });
}
