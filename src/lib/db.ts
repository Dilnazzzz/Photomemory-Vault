import { Pool } from "pg";

let pool: Pool | null = null;

export function getDb() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const ssl = shouldUseSSL(url) ? { rejectUnauthorized: false } : false;
  pool = new Pool({ connectionString: url, ssl });
  return pool;
}

function shouldUseSSL(url: string) {
  return url.includes("neon.tech") || url.includes("supabase.co") || url.includes("render.com");
}

