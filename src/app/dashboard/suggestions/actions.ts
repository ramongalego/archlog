'use server';

import { createClient } from '@/lib/supabase/server';
import { suggestionIdSchema } from '@/lib/validation';

export async function dismissSuggestion(id: string): Promise<{ error?: string }> {
  const parsed = suggestionIdSchema.safeParse({ id });
  if (!parsed.success) return { error: 'Invalid suggestion ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('suggested_decisions')
    .update({ status: 'dismissed' as const })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id);

  if (error) return { error: 'Failed to dismiss suggestion' };
  return {};
}

export async function acceptSuggestion(id: string): Promise<{ error?: string }> {
  const parsed = suggestionIdSchema.safeParse({ id });
  if (!parsed.success) return { error: 'Invalid suggestion ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('suggested_decisions')
    .update({ status: 'accepted' as const })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id);

  if (error) return { error: 'Failed to accept suggestion' };
  return {};
}
