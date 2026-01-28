import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import dotenv from "dotenv";
import path from "path";
import { getDb } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
// Postgres-based rate limiting config
const RL_MAX = parseInt(process.env.RATE_LIMIT_MAX || "3", 10);
const RL_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || "3600", 10);

export async function POST(req: NextRequest) {
  // Rate limiting via Postgres
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = (forwardedFor ? forwardedFor.split(",")[0] : null) ?? "127.0.0.1";
    const pool = getDb();
    const res = await enforceRateLimit(pool, ip, RL_MAX, RL_WINDOW);
    if (!res.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }
  } catch (e) {
    // If DB is not configured, skip rate limiting in local dev
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Session id from cookie (middleware sets it); fallback to ephemeral
    const sessionId = req.cookies.get("pmv_sess")?.value || `sess_${Math.random()
      .toString(36)
      .slice(2)}`;

    // Convert image to a format the model can understand
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");

    // Initialize models
    const llm = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0.5,
      streaming: true,
    });

    // Knowledge-base retrieval currently disabled by default

    // Multimodal step: Analyze the image to get a description
    const visionResponse = await llm.invoke([
      {
        type: "human",
        content: [
          {
            type: "text",
            text: "Describe this image in detail for a photography composition analysis. Focus on the subject, lighting, colors, and arrangement of elements.",
          },
          {
            type: "image_url",
            image_url: { url: `data:${imageFile.type};base64,${imageBase64}` },
          },
        ],
      },
    ]);
    const imageDescription = visionResponse.content as string;

    // Optional RAG step: disabled (no external vector DB)
    let retriever: null | { invoke: (q: string) => Promise<Array<{ pageContent: string }>> } = null;

    // Generation step: Create the final prompt and chain
    const critiqueTemplate = `You are an expert, objective photography critic. Your goal is to provide honest, professional feedback to help a photographer improve their craft.

    Based on these principles from your knowledge base:
    ---
    {context}
    ---
    And based on the AI's description of the photo:
    ---
    {description}
    ---
    Generate a direct and professional critique. Structure it into two sections: 'What Works Well' and 'Areas for Improvement'.
    
    In 'Areas for Improvement', be specific and direct about the photo's flaws and offer actionable advice on how it could have been composed, lit, or executed better. Do not be overly encouraging; be honest and objective.`;

    const critiquePrompt = PromptTemplate.fromTemplate(critiqueTemplate);

    const ragChain = RunnableSequence.from([
      async (description: string) => {
        if (retriever) {
          const docs = await retriever.invoke(description);
          return {
            context: docs.map((d) => d.pageContent).join("\n"),
            description,
          };
        }
        return { context: "", description };
      },
      critiquePrompt,
      llm,
      new StringOutputParser(),
    ]);

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the critique
          const stream = await ragChain.stream(imageDescription);
          let fullCritique = "";

          for await (const chunk of stream) {
            fullCritique += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ critique: chunk })}\n\n`));
          }

          // Persist critique with embedding and rubric
          try {
            const pool = getDb();
            const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
            const emb = await embeddings.embedQuery(imageDescription);

            // Optional rubric scoring via LLM
            let rubric: any = null;
            try {
              const rubricResp = await llm.invoke([
                { role: "system", content: "Return strict JSON only with numeric scores." },
                {
                  role: "user",
                  content:
                    `Score 1-5 for composition, lighting, color, technical, originality and include short 'notes'.\nDescription: ${imageDescription}\nCritique: ${fullCritique}`,
                },
              ]);
              const text = (rubricResp.content as any) ?? "";
              const raw = typeof text === "string" ? text : JSON.stringify(text);
              const match = raw.match(/\{[\s\S]*\}/);
              rubric = match ? JSON.parse(match[0]) : null;
            } catch {}

            const inserted = await pool.query(
              `INSERT INTO critiques (session_id, image_description, critique, rubric, embedding)
               VALUES ($1, $2, $3, $4, $5::vector)
               RETURNING id, version`,
              [sessionId, imageDescription, fullCritique, rubric, `[${emb.join(",")}]`]
            );
            const row = inserted.rows[0];
            if (row) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ savedId: row.id, version: row.version })}\n\n`
                )
              );
            }
          } catch (err) {
            console.warn("Failed to persist critique:", err);
          }

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Failed to generate critique",
              })}\n\n`
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
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate critique" },
      { status: 500 }
    );
  }
}
