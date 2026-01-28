-- Enable pgvector (requires extension installed on the server)
CREATE EXTENSION IF NOT EXISTS vector;

-- Session-less approach: sessions keyed by cookie value
CREATE TABLE IF NOT EXISTS critiques (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  image_description TEXT NOT NULL,
  critique TEXT NOT NULL,
  rubric JSONB,
  embedding vector(1536),
  version INT NOT NULL DEFAULT 1,
  parent_id BIGINT REFERENCES critiques(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_critiques_session_created
  ON critiques (session_id, created_at DESC);

-- ANN index for vector similarity (cosine)
CREATE INDEX IF NOT EXISTS idx_critiques_embedding
  ON critiques USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Simple request log for Postgres-based rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created
  ON rate_limits (key, created_at DESC);

