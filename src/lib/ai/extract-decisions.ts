import Anthropic from '@anthropic-ai/sdk';
import type { GitHubPR } from '@/lib/github/client';
import { parseJsonResponse } from './parse-json-response';

const anthropic = new Anthropic();

const BATCH_SIZE = 10;

export interface ExtractedDecision {
  title: string;
  why: string;
  context: string | null;
  alternatives: string | null;
  confidence: 'high' | 'medium' | 'low';
  category: 'product' | 'pricing' | 'technical' | 'hiring' | 'marketing' | 'other';
}

export interface PRDecisionResult {
  pr_number: number;
  decision: ExtractedDecision | null;
}

// Filter out PRs that are clearly not decisions
const SKIP_PREFIXES = [
  'chore:',
  'chore(',
  'fix:',
  'fix(',
  'bump:',
  'deps:',
  'dependabot',
  'renovate',
];

export function isCandidate(pr: GitHubPR): boolean {
  const titleLower = pr.title.toLowerCase().trim();

  // Skip noise PRs
  if (SKIP_PREFIXES.some((p) => titleLower.startsWith(p))) return false;

  // Skip PRs with very short or no body
  const bodyLines = (pr.body || '').split('\n').filter((l) => l.trim().length > 0);
  if (bodyLines.length < 3) return false;

  return true;
}

function formatPRForPrompt(pr: GitHubPR): string {
  return `--- PR #${pr.number} ---
Title: ${pr.title}
Author: ${pr.user?.login ?? 'unknown'}
Description:
${(pr.body || '').slice(0, 2000)}`;
}

/**
 * Extract decisions from a batch of PRs in a single API call.
 * Returns results keyed by PR number.
 */
async function extractBatch(prs: GitHubPR[]): Promise<PRDecisionResult[]> {
  const prBlocks = prs.map(formatPRForPrompt).join('\n\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You analyze pull requests to find significant product or technical decisions.

Here are ${prs.length} merged PRs. For each one, determine if a significant decision was made (e.g., choosing a technology, changing architecture, adding/removing a feature, migrating systems, changing a business rule).

Rules:
- Use past tense. This is a record of a decision that was made.
- Don't use em dashes. Use plain dashes or commas instead.
- Write like a person. Short sentences. No buzzwords.
- Don't duplicate content between why and context. They are distinct fields.
- Return null for a field if there's genuinely nothing to put there, rather than padding with weak content.

${prBlocks}

Return ONLY a JSON array (no markdown, no explanation) with one object per PR, in the same order:
[
  {
    "pr_number": 123,
    "is_decision": true or false,
    "title": "A clear one-line statement of what was decided (past tense, max 100 chars)" or null,
    "why": "The reasoning and rationale - why was this the right call? What logic led to this choice? (2-4 sentences)" or null,
    "context": "The background situation - what problem existed? What constraints or circumstances made this decision necessary? (2-4 sentences)" or null,
    "alternatives": "What alternatives were considered" or null,
    "confidence": "high" | "medium" | "low" or null,
    "category": "product" | "pricing" | "technical" | "hiring" | "marketing" | "other" or null
  }
]

For PRs specifically:
- context usually lives in the opening paragraph - "We were seeing X problem, the current approach wasn't working because Y"
- why usually lives in the rationale section - "We chose this approach because Z, it gave us A and B"

Set is_decision to false (and all other fields to null) for routine changes, minor fixes, and implementation details.

confidence means how confident YOU are that this is a real decision:
- high: clearly a deliberate choice between alternatives
- medium: likely a decision but context is thin
- low: might be a decision but could also be routine

category is the best-fit category — pick based on what DROVE the decision, not what it touches:
- product: what the product does, features, UX, scope
- pricing: tiers, plans, costs, what each tier gets, monetization, limits that differ by plan
- technical: architecture, infrastructure, stack choices, performance (when not tied to pricing)
- hiring: roles, team structure, hiring process
- marketing: positioning, channels, messaging, growth
- other: anything that doesn't fit the above`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  interface BatchItem {
    pr_number: number;
    is_decision: boolean;
    title: string | null;
    why: string | null;
    context: string | null;
    alternatives: string | null;
    confidence: 'high' | 'medium' | 'low' | null;
    category: 'product' | 'pricing' | 'technical' | 'hiring' | 'marketing' | 'other' | null;
  }

  const parsed = parseJsonResponse<BatchItem[]>(text);
  if (!parsed || !Array.isArray(parsed)) return [];

  return parsed.map((item) => ({
    pr_number: item.pr_number,
    decision:
      item.is_decision && item.title
        ? {
            title: item.title,
            why: item.why ?? '',
            context: item.context ?? null,
            alternatives: item.alternatives,
            confidence: item.confidence ?? 'medium',
            category: item.category ?? 'technical',
          }
        : null,
  }));
}

/**
 * Extract decisions from multiple PRs using batched API calls.
 * Processes PRs in batches of BATCH_SIZE to balance context quality and token efficiency.
 */
export async function extractDecisionsFromPRs(prs: GitHubPR[]): Promise<PRDecisionResult[]> {
  const results: PRDecisionResult[] = [];

  for (let i = 0; i < prs.length; i += BATCH_SIZE) {
    const batch = prs.slice(i, i + BATCH_SIZE);
    try {
      const batchResults = await extractBatch(batch);
      results.push(...batchResults);
    } catch {
      // If a batch fails, skip it rather than failing the entire scan
    }
  }

  return results;
}
