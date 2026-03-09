'use server';

import { createClient } from '@/lib/supabase/server';
import { friendlyError } from '@/lib/supabase/errors';
import type { User } from '@/types/decisions';

export async function updateSettings(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const displayName = formData.get('display_name') as string;
  const defaultReviewDays = Number(formData.get('default_review_days'));
  const digestOptedIn = formData.get('digest_opted_in') === 'on';
  const timezone = formData.get('timezone') as string;

  if (![30, 60, 90].includes(defaultReviewDays)) {
    return { error: 'Review period must be 30, 60, or 90 days' };
  }

  const { error } = (await supabase
    .from('users')
    .update({
      display_name: displayName || null,
      default_review_days: defaultReviewDays,
      digest_opted_in: digestOptedIn,
      timezone: timezone || 'UTC',
    } as Partial<User>)
    .eq('id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}
