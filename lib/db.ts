/**
 * Database client — connects via PHP bridge on cPanel.
 * 
 * The PHP bridge (public/db-bridge.php) runs on the same server as
 * PostgreSQL and proxies queries over HTTP to Vercel.
 * 
 * Required env vars:
 *   DB_BRIDGE_URL    = https://yourdomain.com/db-bridge.php
 *   DB_BRIDGE_SECRET = rl-bridge-[hash] (shown when you visit the bridge)
 */

const BRIDGE_URL    = process.env.DB_BRIDGE_URL    || "";
const BRIDGE_SECRET = process.env.DB_BRIDGE_SECRET || "";

export interface QueryResult<T = any> {
  rows:     T[];
  rowCount: number;
}

export async function sql<T = any>(
  text:   string,
  values: any[] = []
): Promise<QueryResult<T>> {
  if (!BRIDGE_URL) {
    throw new Error(
      "DB_BRIDGE_URL not set. Upload public/db-bridge.php to cPanel and set " +
      "DB_BRIDGE_URL + DB_BRIDGE_SECRET in Vercel env vars."
    );
  }

  const res = await fetch(BRIDGE_URL, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "X-Bridge-Key":  BRIDGE_SECRET,
    },
    body: JSON.stringify({ sql: text, params: values }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || `Bridge error ${res.status}`);
  }

  return { rows: data.rows || [], rowCount: data.rowCount || 0 };
}

export default { sql };
