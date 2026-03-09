-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding column to decisions
ALTER TABLE decisions ADD COLUMN embedding vector(1536);
ALTER TABLE decisions ADD COLUMN embedding_updated_at timestamptz;

-- IVFFlat index for similarity search (create after data exists; use 100 lists as starting point)
-- For small datasets (<10k rows), a sequential scan is fine. Create the index when needed:
-- CREATE INDEX idx_decisions_embedding ON decisions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
