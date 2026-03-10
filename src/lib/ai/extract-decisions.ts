import Anthropic from '@anthropic-ai/sdk';
import type { GitHubPR } from '@/lib/github/client';

const anthropic = new Anthropic();

export interface ExtractedDecision {
  title: string;
  reasoning: string;
  alternatives: string | null;
  confidence: 'high' | 'medium' | 'low';
}

// Filter out PRs that are clearly not decisions
const SKIP_PREFIXES = ['chore:', 'chore(', 'fix:', 'fix(', 'bump:', 'deps:', 'dependabot', 'renovate'];

export function isCandidate(pr: GitHubPR): boolean {
  const titleLower = pr.title.toLowerCase().trim();

  // Skip noise PRs
  if (SKIP_PREFIXES.some((p) => titleLower.startsWith(p))) return false;

  // Skip PRs with very short or no body
  const bodyLines = (pr.body || '').split('\n').filter((l) => l.trim().length > 0);
  if (bodyLines.length < 3) return false;

  return true;
}

export async function extractDecisionFromPR(
  pr: GitHubPR
): Promise<ExtractedDecision | null> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You analyze pull requests to determine if a significant product or technical decision was made.

PR Title: ${pr.title}
PR Author: ${pr.user?.login ?? 'unknown'}
PR Description:
"""
${(pr.body || '').slice(0, 4000)}
"""

If a significant decision was made (e.g., choosing a technology, changing architecture, adding/removing a feature, migrating systems, changing a business rule), extract it.

If no clear decision is present (just a routine change, minor fix, or implementation detail), return exactly: null

If a decision IS present, return ONLY a JSON object (no markdown, no explanation):
{
  "title": "A clear one-line statement of what was decided (past tense, max 100 chars)",
  "reasoning": "A clean, well-written summary of WHY this decision was made. Synthesize the context and reasoning from the PR into clear, concise prose. Don't copy messy formatting, checklists, or raw PR template text. Write 2-4 sentences that capture the situation, the motivation, and the key trade-offs. Use past tense.",
  "alternatives": "What alternatives were implicitly or explicitly considered, or null if unclear",
  "confidence": "high" | "medium" | "low"
}

confidence means how confident YOU are that this is a real decision:
- high: clearly a deliberate choice between alternatives
- medium: likely a decision but context is thin
- low: might be a decision but could also be routine`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const trimmed = text.trim();

  if (trimmed === 'null' || trimmed === '') return null;

  try {
    return JSON.parse(trimmed) as ExtractedDecision;
  } catch {
    return null;
  }
}
