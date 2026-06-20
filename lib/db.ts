/**
 * PostgreSQL connection pool.
 * Set DATABASE_URL in Vercel env vars:
 *   postgresql://user:password@your-cpanel-host:5432/dbname
 *
 * On cPanel: Databases → PostgreSQL Databases → enable remote access
 * and add your server IP (or 0.0.0.0/0 for Vercel's dynamic IPs).
 */
import { Pool, QueryResult, QueryResultRow } from "pg";

declare global { var __pgPool: Pool | undefined; }

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

// Re-use pool across hot-reloads in dev
const pool = global.__pgPool ?? (global.__pgPool = createPool());

export async function sql<T extends QueryResultRow = any>(
  text: string,
  values?: any[]
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    return await client.query<T>(text, values);
  } finally {
    client.release();
  }
}

export default pool;
