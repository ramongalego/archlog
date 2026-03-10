/**
 * Extract and parse JSON from a Claude response that may contain:
 * - Raw JSON
 * - JSON wrapped in markdown code fences (```json ... ```)
 * - JSON preceded by preamble text ("Here are the results:\n[...")
 *
 * Returns the parsed value, or null if parsing fails.
 */
export function parseJsonResponse<T = unknown>(raw: string): T | null {
  let text = raw.trim();
  if (!text) return null;

  // 1. Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // 2. Try parsing as-is first
  try {
    return JSON.parse(text) as T;
  } catch {
    // continue to fallback
  }

  // 3. If there's preamble text, find the first [ or { and try from there
  const firstBracket = text.search(/[\[{]/);
  if (firstBracket > 0) {
    const candidate = text.slice(firstBracket);
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // give up
    }
  }

  return null;
}
