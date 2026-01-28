import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("pmv_sess")?.value;
    if (!sessionId) return NextResponse.json({ items: [] });

    const pool = getDb();
    const { rows } = await pool.query(
      `SELECT id, image_description, critique, rubric, version, parent_id, created_at
       FROM critiques
       WHERE session_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [sessionId]
    );

    return NextResponse.json({ items: rows });
  } catch (err) {
    console.error("History error:", err);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

