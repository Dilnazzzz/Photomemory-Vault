import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    if (!q) {
      return NextResponse.json({ error: "Missing q" }, { status: 400 });
    }

    const sessionId = req.cookies.get("pmv_sess")?.value || null;
    if (!sessionId) {
      return NextResponse.json({ results: [] });
    }

    const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
    const queryEmb = await embeddings.embedQuery(q);
    const pool = getDb();

    const { rows } = await pool.query(
      `SELECT id, image_description, critique, created_at, version
       FROM critiques
       WHERE session_id = $1 AND embedding IS NOT NULL
       ORDER BY embedding <-> $2::vector
       LIMIT 10`,
      [sessionId, `[${queryEmb.join(",")}]`]
    );

    return NextResponse.json({ results: rows });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
