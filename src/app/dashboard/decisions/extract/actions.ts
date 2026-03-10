'use server';

import { createClient } from '@/lib/supabase/server';
import { extractDecisionsFromText, storeSuggestions } from '@/lib/ai/suggestion-pipeline';
import { extractTextSchema } from '@/lib/validation';

export async function extractFromText(
  text: string,
  projectId: string
): Promise<{ found?: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const parsed = extractTextSchema.safeParse({ text, projectId });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const decisions = await extractDecisionsFromText(parsed.data.text);

    const found = await storeSuggestions(supabase, {
      userId: user.id,
      projectId: parsed.data.projectId,
      source: 'text',
      decisions,
    });

    return { found };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Extract failed:', message);
    return { error: `Extraction failed: ${message}` };
  }
}
