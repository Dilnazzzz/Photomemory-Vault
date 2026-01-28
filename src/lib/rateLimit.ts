import { Pool } from "pg";

export async function enforceRateLimit(
  pool: Pool,
  key: string,
  max: number,
  windowSeconds: number
) {
  const client = await pool.connect();
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowSeconds * 1000);

    await client.query(
      `DELETE FROM rate_limits WHERE created_at < $1`,
      [windowStart]
    );

    const { rows } = await client.query(
      `SELECT COUNT(*)::int AS cnt FROM rate_limits WHERE key = $1 AND created_at >= $2`,
      [key, windowStart]
    );
    const count: number = rows[0]?.cnt ?? 0;
    if (count >= max) {
      return { allowed: false } as const;
    }

    await client.query(`INSERT INTO rate_limits (key) VALUES ($1)`, [key]);
    return { allowed: true } as const;
  } finally {
    client.release();
  }
}

