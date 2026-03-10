import Anthropic from '@anthropic-ai/sdk';
import type { GitHubPR } from '@/lib/github/client';
import { parseJsonResponse } from './parse-json-response';

const anthropic = new Anthropic();

const BATCH_SIZE = 10;

export interface ExtractedDecision {
  title: string;
  reasoning: string;
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

${prBlocks}

Return ONLY a JSON array (no markdown, no explanation) with one object per PR, in the same order:
[
  {
    "pr_number": 123,
    "is_decision": true or false,
    "title": "A clear one-line statement of what was decided (past tense, max 100 chars)" or null,
    "reasoning": "A clean 2-4 sentence summary of WHY this decision was made. Use past tense." or null,
    "alternatives": "What alternatives were considered" or null,
    "confidence": "high" | "medium" | "low" or null,
    "category": "product" | "pricing" | "technical" | "hiring" | "marketing" | "other" or null
  }
]

Set is_decision to false (and all other fields to null) for routine changes, minor fixes, and implementation details.

confidence means how confident YOU are that this is a real decision:
- high: clearly a deliberate choice between alternatives
- medium: likely a decision but context is thin
- low: might be a decision but could also be routine

category is the best-fit category:
- product: feature additions, removals, UX changes, business rules
- pricing: pricing model, plan changes, billing
- technical: architecture, technology choices, infrastructure, migrations
- hiring: team structure, hiring strategy, roles
- marketing: positioning, messaging, go-to-market
- other: anything that doesn't fit the above`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  interface BatchItem {
    pr_number: number;
    is_decision: boolean;
    title: string | null;
    reasoning: string | null;
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
            reasoning: item.reasoning ?? '',
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
