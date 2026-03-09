-- RPC function for pgvector cosine similarity search over decision embeddings.
-- Used by the AI query pipeline to find the most relevant decisions for a given question.

CREATE OR REPLACE FUNCTION match_decisions(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL,
  p_project_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  why jsonb,
  context text,
  confidence text,
  category text,
  outcome_status text,
  outcome_notes text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.why,
    d.context,
    d.confidence::text,
    d.category::text,
    d.outcome_status::text,
    d.outcome_notes,
    d.created_at,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM decisions d
  WHERE d.embedding IS NOT NULL
    AND d.is_archived = false
    AND d.user_id = p_user_id
    AND (p_project_id IS NULL OR d.project_id = p_project_id)
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
