-- Update match_decisions RPC to scope by project IDs instead of user_id.
-- This enables workspace-aware AI queries: personal workspace searches personal
-- projects only, team workspace searches team projects only.

CREATE OR REPLACE FUNCTION match_decisions(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL,
  p_project_id uuid DEFAULT NULL,
  p_project_ids uuid[] DEFAULT NULL
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
    -- When p_project_ids is provided, scope to those projects (workspace-aware)
    -- Otherwise fall back to user_id filtering (backwards compatibility)
    AND (
      CASE
        WHEN p_project_ids IS NOT NULL THEN d.project_id = ANY(p_project_ids)
        ELSE d.user_id = p_user_id
      END
    )
    AND (p_project_id IS NULL OR d.project_id = p_project_id)
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
