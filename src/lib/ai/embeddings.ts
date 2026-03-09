/**
 * Trigger embedding generation for a decision via the Supabase Edge Function.
 * This is called asynchronously after decision create/update to avoid blocking the UI.
 */
export async function triggerEmbeddingGeneration(decisionId: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.warn('Supabase config not complete, skipping embedding generation');
    return;
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ decision_id: decisionId }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Embedding generation failed:', body);
    }
  } catch (err) {
    // Non-blocking - log and continue
    console.error('Failed to trigger embedding generation:', err);
  }
}
