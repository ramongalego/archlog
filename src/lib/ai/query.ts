import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { embedQuery } from './embed-query';

interface MatchedDecision {
  id: string;
  title: string;
  why: unknown;
  context: string | null;
  confidence: string;
  category: string;
  outcome_status: string;
  outcome_notes: string | null;
  created_at: string;
  similarity: number;
}

export type QueryEvent =
  | { type: 'chunk'; content: string }
  | {
      type: 'citations';
      decisions: { id: string; title: string; created_at: string; project_name?: string }[];
    }
  | { type: 'done' };

function extractTextFromTiptap(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return '';
  const node = doc as { type?: string; text?: string; content?: unknown[] };
  if (node.type === 'text' && node.text) return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromTiptap).join(' ');
  }
  return '';
}

export async function* queryDecisions(params: {
  question: string;
  projectId?: string;
  userId: string;
  workspaceProjectIds: string[];
}): AsyncGenerator<QueryEvent> {
  const supabase = await createClient();

  // Embed the user's question and run pgvector similarity search
  let decisions: MatchedDecision[] = [];

  try {
    const queryEmbedding = await embedQuery(params.question);

    const { data, error } = await supabase.rpc('match_decisions', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.3,
      match_count: 10,
      p_user_id: params.userId,
      p_project_id: params.projectId ?? null,
      p_project_ids: params.workspaceProjectIds,
    });

    if (error) {
      logger.warn('pgvector search failed, falling back to recency', {
        userId: params.userId,
        projectId: params.projectId,
        error: error.message,
      });
    } else {
      decisions = (data as MatchedDecision[]) ?? [];
    }
  } catch (err) {
    logger.error('Query embedding failed, falling back to recency', err, {
      userId: params.userId,
      projectId: params.projectId,
    });
  }

  // Fallback: if semantic search returned nothing (no embeddings yet), use recency
  if (decisions.length === 0) {
    let query = supabase
      .from('decisions')
      .select(
        'id, title, why, context, confidence, category, outcome_status, outcome_notes, created_at'
      )
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (params.projectId) {
      query = query.eq('project_id', params.projectId);
    } else if (params.workspaceProjectIds.length > 0) {
      query = query.in('project_id', params.workspaceProjectIds);
    } else {
      // No projects in this workspace
      decisions = [];
    }

    if (params.workspaceProjectIds.length > 0 || params.projectId) {
      const { data: fallbackDecisions } = (await query) as {
        data: MatchedDecision[] | null;
      };
      decisions = fallbackDecisions ?? [];
    }
  }

  if (decisions.length === 0) {
    yield {
      type: 'chunk',
      content:
        "I don't have any decisions to reference yet. Log some decisions first, then come back and ask me about them.",
    };
    yield { type: 'done' };
    return;
  }

  // Build context block for Claude
  const contextLines = decisions.map((d, i) => {
    const whyText = extractTextFromTiptap(d.why) || 'Not specified';
    return [
      `[${i + 1}] "${d.title}"`,
      `  Date: ${d.created_at}`,
      `  Category: ${d.category}`,
      `  Confidence: ${d.confidence}`,
      `  Why: ${whyText}`,
      `  Context: ${d.context || 'Not specified'}`,
      `  Outcome: ${d.outcome_status}${d.outcome_notes ? ' - ' + d.outcome_notes : ''}`,
    ].join('\n');
  });

  const contextBlock = contextLines.join('\n\n');

  // Map index to decision metadata for citation lookup
  const decisionsByIndex = new Map(
    decisions.map((d, i) => [i + 1, { id: d.id, title: d.title, created_at: d.created_at }])
  );

  // For cross-project queries, look up project names for citations
  let projectNamesById: Map<string, string> | null = null;
  if (!params.projectId) {
    const decisionIds = decisions.map((d) => d.id);
    const { data: decisionRows } = await supabase
      .from('decisions')
      .select('id, project_id')
      .in('id', decisionIds);

    if (decisionRows && decisionRows.length > 0) {
      const projectIds = [...new Set(decisionRows.map((d) => d.project_id))];
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds);

      if (projects) {
        const projectMap = new Map(projects.map((p) => [p.id, p.name]));
        projectNamesById = new Map();
        for (const dr of decisionRows) {
          const name = projectMap.get(dr.project_id);
          if (name) projectNamesById.set(dr.id, name);
        }
      }
    }
  }

  const anthropic = new Anthropic();

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a decision journal assistant. The user is asking about their past decisions. Answer based only on the decisions provided below. If the answer is not in the decisions, say so honestly.

Keep your answers concise and practical. Just explain the reasoning directly. Don't reference decision titles, numbers, or IDs in your answer text. Don't use em dashes. Write plainly.

After your answer, on a new line, write REFS: followed by a comma-separated list of the decision numbers you actually used (e.g. REFS: 1, 3). Only include decisions that are directly relevant to the answer. If none were relevant, write REFS: none.

Here are the user's logged decisions:

${contextBlock}

Question: ${params.question}`,
      },
    ],
  });

  let fullText = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullText += event.delta.text;
      yield { type: 'chunk', content: event.delta.text };
    }
  }

  // Parse REFS line to find which decisions were actually used
  const refsMatch = fullText.match(/REFS:\s*(.+)/i);
  const citedDecisions: {
    id: string;
    title: string;
    created_at: string;
    project_name?: string;
  }[] = [];

  if (refsMatch && refsMatch[1].trim().toLowerCase() !== 'none') {
    const indices = refsMatch[1]
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    for (const idx of indices) {
      const d = decisionsByIndex.get(idx);
      if (d) {
        citedDecisions.push({
          ...d,
          project_name: projectNamesById?.get(d.id),
        });
      }
    }
  }

  if (citedDecisions.length > 0) {
    yield { type: 'citations', decisions: citedDecisions };
  }

  yield { type: 'done' };
}
