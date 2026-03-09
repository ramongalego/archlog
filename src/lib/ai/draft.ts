import Anthropic from '@anthropic-ai/sdk';
import type { DraftSuggestion } from '@/types/decisions';

const anthropic = new Anthropic();

export async function generateDraftSuggestion(rawNote: string): Promise<DraftSuggestion> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You help structure decision log entries. A founder wrote a rough note about a decision. Pull out the structured fields from what they wrote.

Rules:
- Keep their words. Don't add things they didn't say.
- Use past tense. This is a record of a decision that was made. "We chose X" not "We use X". "We decided to" not "We want to".
- Don't use em dashes. Use plain dashes or commas instead.
- Write like a person, not like a press release. Short sentences. No buzzwords.

Their note:
"""
${rawNote}
"""

Return ONLY a JSON object (no markdown, no explanation):
{
  "title": "A clear one-line statement of what was decided (max 100 chars)",
  "why": "The reasoning and trade-offs in their own words",
  "context": "What was going on that forced this decision",
  "confidence": "low" | "medium" | "high",
  "category": "product" | "pricing" | "technical" | "hiring" | "marketing" | "other"
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const parsed = JSON.parse(text) as DraftSuggestion;
  return parsed;
}
