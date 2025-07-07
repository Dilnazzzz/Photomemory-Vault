import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function createIndex() {
  const pinecone = new Pinecone();

  const indexName = process.env.PINECONE_INDEX!;
  if (!indexName) {
    throw new Error("PINECONE_INDEX environment variable not set.");
  }

  // Get a list of all existing indexes
  const existingIndexes = await pinecone.listIndexes();

  // Check if the desired index already exists
  if (existingIndexes.indexes?.some((index) => index.name === indexName)) {
    console.log(`Index '${indexName}' already exists. Skipping creation.`);
    return;
  }

  console.log(`Creating index '${indexName}'...`);

  await pinecone.createIndex({
    name: indexName,
    dimension: 1536, // This is the crucial part
    metric: "cosine", // Cosine similarity is standard for text embeddings
    spec: {
      serverless: {
        cloud: "aws",
        region: "us-east-1",
      },
    },
  });

  console.log(
    `Index '${indexName}' created successfully. Please wait a moment for it to initialize.`
  );
}

createIndex();
