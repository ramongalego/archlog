import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { parseJsonResponse } from './parse-json-response';

const anthropic = new Anthropic();

export interface ExtractedDecision {
  title: string;
  why: string;
  context: string | null;
  alternatives: string | null;
  confidence: 'high' | 'medium' | 'low';
  category: 'product' | 'pricing' | 'technical' | 'hiring' | 'marketing' | 'other';
}

/**
 * Extract decisions from a block of text using Claude.
 * Returns an array of extracted decisions (may be empty).
 * Used by GitHub scan, text dump, and future integrations.
 */
export async function extractDecisionsFromText(text: string): Promise<ExtractedDecision[]> {
  // Cap input to avoid excessive token usage
  const input = text.slice(0, 5000);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You analyze text to find significant product or technical decisions.

Read the following text carefully and identify any significant decisions that were made. A decision is a deliberate choice - choosing a technology, changing architecture, adding/removing a feature, migrating systems, changing a business rule, hiring strategy, pricing change, etc.

Ignore routine items, minor fixes, and implementation details that don't reflect a deliberate choice.

Rules:
- Use past tense. This is a record of a decision that was made.
- Don't use em dashes. Use plain dashes or commas instead.
- Write like a person. Short sentences. No buzzwords.
- Don't duplicate content between why and context. They are distinct fields.
- Return null for a field if there's genuinely nothing to put there, rather than padding with weak content.

Text:
"""
${input}
"""

Return ONLY a JSON array (no markdown, no explanation). Each element should be:
{
  "title": "A clear one-line statement of what was decided (past tense, max 100 chars)",
  "why": "The reasoning and rationale - why was this the right call? What logic led to this choice? (2-4 sentences, or null if unclear)",
  "context": "The background situation - what problem existed? What constraints or circumstances made this decision necessary? (2-4 sentences, or null if unclear)",
  "alternatives": "What alternatives were implicitly or explicitly considered, or null if unclear",
  "confidence": "high" | "medium" | "low",
  "category": "product" | "pricing" | "technical" | "hiring" | "marketing" | "other"
}

For GitHub PRs and merge requests specifically:
- context usually lives in the opening paragraph - "We were seeing X problem, the current approach wasn't working because Y"
- why usually lives in the rationale section - "We chose this approach because Z, it gave us A and B"

confidence means how confident YOU are that this is a real decision:
- high: clearly a deliberate choice between alternatives
- medium: likely a decision but context is thin
- low: might be a decision but could also be routine

category is the best-fit category for the decision:
- product: feature additions, removals, UX changes, business rules
- pricing: pricing model, plan changes, billing
- technical: architecture, technology choices, infrastructure, migrations
- hiring: team structure, hiring strategy, roles
- marketing: positioning, messaging, go-to-market
- other: anything that doesn't fit the above

If no decisions are found, return an empty array: []`,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  const parsed = parseJsonResponse<ExtractedDecision[]>(responseText);
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed;
}

/**
 * Store extracted decisions as suggestions in the database.
 * Shared by all sources (GitHub, text dump, future integrations).
 */
export async function storeSuggestions(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    projectId: string;
    source: string;
    decisions: ExtractedDecision[];
    metadata?: {
      githubConnectionId?: string;
      prUrl?: string;
      prNumber?: number;
      prTitle?: string;
      prAuthor?: string;
      prBody?: string;
    };
  }
): Promise<number> {
  if (params.decisions.length === 0) return 0;

  const rows = params.decisions.map((d) => ({
    user_id: params.userId,
    project_id: params.projectId,
    source: params.source,
    github_connection_id: params.metadata?.githubConnectionId ?? null,
    pr_url: params.metadata?.prUrl ?? null,
    pr_number: params.metadata?.prNumber ?? null,
    pr_title: params.metadata?.prTitle ?? null,
    pr_author: params.metadata?.prAuthor ?? null,
    pr_body: params.metadata?.prBody ?? null,
    extracted_title: d.title,
    extracted_reasoning: d.why,
    extracted_context: d.context ?? null,
    extracted_alternatives: d.alternatives,
    extracted_category: d.category ?? 'technical',
    confidence: d.confidence,
  }));

  const { error } = await supabase.from('suggested_decisions').insert(rows);
  if (error) throw new Error(error.message);

  return rows.length;
}
