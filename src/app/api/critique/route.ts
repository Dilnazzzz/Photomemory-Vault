import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import dotenv from "dotenv";
import path from "path";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Initialize Redis client for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Initialize the rate limiter
// This allows 3 requests from the same IP address in a 1-hour sliding window.
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  analytics: true,
});

export async function POST(req: NextRequest) {
  // === RATE LIMITING LOGIC ===
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = (forwardedFor ? forwardedFor.split(",")[0] : null) ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again in an hour." },
      { status: 429 }
    );
  }
  // === END RATE LIMITING LOGIC ===

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Convert image to a format the model can understand
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");

    // === 1. Initialize models and database connections ===
    const llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.5 });
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
    const embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
    });

    // === 2. Multimodal Step: Analyze the image to get a description ===
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

    // === 3. RAG Step: Retrieve relevant principles from Pinecone ===
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
    });
    const retriever = vectorStore.asRetriever();

    // === 4. Generation Step: Create the final prompt and chain ===
    const critiqueTemplate = `You are an expert photography critic providing encouraging, constructive feedback directly to a user about their photo.

You have been provided with a detailed description of the photo and relevant photography principles to guide your analysis.

**Photo Description:**
{description}

**Relevant Photography Principles:**
{context}

---
**Your Critique:**
Address the user directly about their photo. Do not mention the "description" or the "principles" in your response. Structure your critique into two sections: 'What Works Well' and 'Areas for Improvement'. Be specific, helpful, and use a friendly, natural tone.`;

    const critiquePrompt = PromptTemplate.fromTemplate(critiqueTemplate);

    const ragChain = RunnableSequence.from([
      async (description: string) => ({
        context: await retriever
          .invoke(description)
          .then((docs) => docs.map((d) => d.pageContent).join("\n")),
        description,
      }),
      critiquePrompt,
      llm,
      new StringOutputParser(),
    ]);

    // === 5. Invoke the chain and return the result ===
    const result = await ragChain.invoke(imageDescription);

    return NextResponse.json({ critique: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate critique" },
      { status: 500 }
    );
  }
}
