import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Add it to .env.local");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl, ssl: sslConfig() });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `CREATE TABLE IF NOT EXISTS _migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`,
    );

    const migrationsDir = path.resolve(process.cwd(), "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("No migrations directory found; creating one.");
      fs.mkdirSync(migrationsDir);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const id = file;
      const res = await client.query(
        "SELECT 1 FROM _migrations WHERE id = $1",
        [id],
      );
      if (res.rowCount) {
        continue; // already applied
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`Applying migration: ${file}`);
      const statements = sql
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter((s) => {
          if (!s.length) return false;
          const withoutLineComments = s.replace(/^\s*--[^\n]*\n?/gm, "").trim();
          return withoutLineComments.length > 0;
        });
      for (const statement of statements) {
        const withSemicolon = statement.endsWith(";")
          ? statement
          : `${statement};`;
        await client.query(withSemicolon);
      }
      await client.query("INSERT INTO _migrations (id) VALUES ($1)", [id]);
    }

    await client.query("COMMIT");
    console.log("Migrations completed.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

function sslConfig(): false | { rejectUnauthorized: boolean } {
  // Neon/Supabase often require SSL in production; local dev may not
  const url = process.env.DATABASE_URL || "";
  if (
    url.includes("neon.tech") ||
    url.includes("supabase.co") ||
    url.includes("render.com")
  ) {
    return { rejectUnauthorized: false };
  }
  return false;
}

main();
