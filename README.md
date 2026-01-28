# PhotoMemory Vault — Photographer Session Intelligence System

PhotoMemory Vault helps photographers analyze images, save critique sessions, and recall past work by meaning — not filenames. Start simple (image-only critique), then enable Postgres features for session history, semantic recall, and rubric scoring.

![App Screenshot](public/screenshot.png)

## Core Features

- Image critique powered by GPT‑4o
- Session history in Postgres (persist critiques)
- Semantic recall search with pgvector (e.g., “redwoods morning softness”)
- Rubric scoring (1–5 across composition, lighting, color, technical, originality)
- Critique versioning/evolution (persist multiple versions per session)
- Postgres-based rate limiting (no Upstash)

You can run without a knowledge base (default) or later add your own KB stored in Postgres using pgvector.

## Tech Stack

- Next.js 15, TypeScript, Tailwind CSS
- LangChain.js + OpenAI (GPT‑4o + text-embedding-3-small)
- Postgres + pgvector (vector search) via `pg`

## Quick Start

1. Install deps
   - npm install
2. Configure env
   - cp .env.example .env.local
   - Fill: OPENAI_API_KEY, DATABASE_URL
   - Optional: set DISABLE_RAG=false later if you add a knowledge base (stored in Postgres)
3. Run DB migrations
   - npx tsx scripts/migrate.ts
4. Start dev
   - npm run dev
   - Open http://localhost:3000

## Postgres Schema

Migrations create:
- `critiques` with `embedding vector(1536)` for recall search
- `rate_limits` for Postgres-based rate limiting

Requires the `vector` extension. On managed Postgres (Neon/Supabase), enable pgvector; on local Postgres:

CREATE EXTENSION IF NOT EXISTS vector;

## Semantic Recall API

GET /api/search?q=your+query
- Computes an embedding and returns your session’s most similar critiques.

## Future: Knowledge Base (Optional)

Keep DISABLE_RAG=true for now. When ready, we can ingest notes/papers into your Postgres (pgvector) and enable retrieval without external services.

## License

MIT — see LICENSE
