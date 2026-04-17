import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Trigger embedding generation for a decision via the Supabase Edge Function.
 *
 * Intentionally non-throwing: callers use fire-and-forget from server actions
 * so failures here must not surface to the user. Failures are logged with
 * decision context so they can be retried or investigated.
 */
export async function triggerEmbeddingGeneration(decisionId: string): Promise<void> {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } =
    env();

  try {
    const res = await fetch(`${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`, {
      method: 'POST',
      headers: {
        apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ decision_id: decisionId }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '<unreadable>');
      logger.warn('Embedding generation responded non-2xx', {
        decisionId,
        status: res.status,
        body: body.slice(0, 500),
      });
    }
  } catch (err) {
    logger.error('Failed to trigger embedding generation', err, { decisionId });
  }
}
