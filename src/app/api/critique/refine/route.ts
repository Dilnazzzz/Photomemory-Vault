import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("pmv_sess")?.value;
    if (!sessionId) return NextResponse.json({ error: "No session" }, { status: 400 });

    const body = await req.json();
    const id = body?.id as number | undefined;
    const instructions = (body?.instructions as string | undefined) || "";
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const pool = getDb();
    const { rows } = await pool.query(
      `SELECT id, image_description, critique, version FROM critiques WHERE id = $1 AND session_id = $2`,
      [id, sessionId]
    );
    const prev = rows[0];
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.5, streaming: true });

    const template = `You are an expert photography critic. Evolve and refine the prior critique.

Prior critique:\n---\n{prev}\n---\n
Image description:\n---\n{desc}\n---\n
User instructions (optional):\n---\n{instructions}\n---\n
Write an improved critique that remains honest and actionable. Keep 'What Works Well' and 'Areas for Improvement'.`;

    const prompt = PromptTemplate.fromTemplate(template);
    const chain = RunnableSequence.from([
      async () => ({ prev: prev.critique, desc: prev.image_description, instructions }),
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const s = await chain.stream({});
          let full = "";
          for await (const chunk of s) {
            full += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ critique: chunk })}\n\n`));
          }

          // Persist new version
          try {
            const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
            const emb = await embeddings.embedQuery(prev.image_description);
            const inserted = await pool.query(
              `INSERT INTO critiques (session_id, image_description, critique, rubric, embedding, version, parent_id)
               VALUES ($1, $2, $3, $4, $5::vector, $6, $7)
               RETURNING id, version`,
              [
                sessionId,
                prev.image_description,
                full,
                null,
                `[${emb.join(",")}]`,
                (prev.version || 1) + 1,
                prev.id,
              ]
            );
            const row = inserted.rows[0];
            if (row) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ savedId: row.id, version: row.version })}\n\n`)
              );
            }
          } catch (e) {
            console.warn("Refine persist failed:", e);
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err) {
          console.error("Refine error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Failed to refine" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

