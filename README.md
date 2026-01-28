# PhotoMemory Vault — Photographer Session Intelligence System

PhotoMemory Vault streams AI critiques for uploaded photos and saves them in Postgres so you can keep a session history, search past critiques by meaning (pgvector), and refine critiques into new versions. It does not include an external knowledge base.

![App Screenshot](public/screenshot.png)

## Core Features

- Streaming image critique (GPT‑4o)
- Session history in Postgres (per‑session cookie)
- Semantic recall search with pgvector
- Rubric scoring persisted as JSON (composition, lighting, color, technical, originality)
- Critique refinement/versioning (create a new version from a prior critique)
- Postgres‑based rate limiting

## Tech Stack

- Next.js 15, TypeScript, Tailwind CSS
- LangChain.js + OpenAI (GPT‑4o + text-embedding-3-small)
- Postgres + pgvector (vector search) via `pg`

## Quick Start

1. Install deps
   - npm install
2. Configure env
   - cp .env.example .env.local
   - Fill: OPENAI_API_KEY, DATABASE_URL (use a Postgres with pgvector enabled)
3. Run DB migrations
   - npm run db:migrate
4. Start dev
   - npm run dev
   - Open http://localhost:3000

## Postgres Schema

Migrations create:
- `critiques` with `embedding vector(1536)` for recall search
- `rate_limits` for Postgres-based rate limiting

Requires the `vector` extension. On managed Postgres (Neon/Supabase), enable pgvector. For local Postgres:

CREATE EXTENSION IF NOT EXISTS vector;

## API Overview

- POST `/api/critique` (multipart form with `image`)
  - Streams `data: { "critique": "...chunk..." }` events; emits a final `[DONE]` and includes `{ "savedId": number }` when persisted.
- GET `/api/history`
  - Returns `{ items: [...] }` for the current session.
- GET `/api/search?q=...`
  - Returns `{ results: [...] }` ordered by vector similarity within the current session.
- POST `/api/critique/refine` (JSON `{ id: number, instructions?: string }`)
  - Streams an evolved critique and persists as a new version.

## Notes

- No external knowledge base is included. Retrieval can be added later by ingesting your own text into Postgres (pgvector).
- Environment variables in `.env.local` are not committed; keep your keys private.
