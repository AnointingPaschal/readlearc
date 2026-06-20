/**
 * PostgreSQL via Supabase (or any external PostgreSQL).
 * Set DATABASE_URL in Vercel env vars:
 *   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 *
 * Use the TRANSACTION POOLER string from Supabase (port 6543) — 
 * it's built for serverless/Vercel.
 */
import { Pool, QueryResultRow } from "pg";

declare global { var __pgPool: Pool | undefined; }

const pool = global.__pgPool ?? (global.__pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
}));

export async function sql<T extends QueryResultRow = any>(
  text: string,
  values?: any[]
) {
  const client = await pool.connect();
  try {
    return await client.query<T>(text, values);
  } finally {
    client.release();
  }
}

export default pool;
