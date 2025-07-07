import { Pinecone } from "@pinecone-database/pinecone";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import dotenv from "dotenv";
import path from "path";

// Configure dotenv to load the .env.local file
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function run() {
  console.log("Starting ingestion...");

  try {
    // 1. Initialize Pinecone client
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

    // 2. Load documents from the /data directory
    console.log("Loading documents...");
    const loader = new DirectoryLoader("data", {
      ".pdf": (path) => new PDFLoader(path),
    });
    const docs = await loader.load();
    console.log(`${docs.length} documents loaded.`);

    // 3. Split the documents into smaller chunks
    console.log("Splitting documents into chunks...");
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splits = await textSplitter.splitDocuments(docs);
    console.log(`${splits.length} chunks created.`);

    // 4. Create embeddings and store them in Pinecone
    console.log("Creating embeddings and storing in Pinecone...");
    const embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
    });

    await PineconeStore.fromDocuments(splits, embeddings, {
      pineconeIndex,
      maxConcurrency: 5, // Use up to 5 parallel requests
    });

    console.log("✅ Ingestion complete!");
  } catch (error) {
    console.error("An error occurred during ingestion:", error);
  }
}

run();
