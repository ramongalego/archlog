'use server';

import { createClient } from '@/lib/supabase/server';
import { friendlyError } from '@/lib/supabase/errors';
import { updateSettingsSchema } from '@/lib/validation';
import type { User } from '@/types/decisions';

export async function updateSettings(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const raw = {
    display_name: formData.get('display_name') as string,
    default_review_days: Number(formData.get('default_review_days')),
    digest_opted_in: formData.get('digest_opted_in') === 'on',
    timezone: formData.get('timezone') as string,
  };

  const parsed = updateSettingsSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { display_name, default_review_days, digest_opted_in, timezone } = parsed.data;

  const { error } = (await supabase
    .from('users')
    .update({
      display_name: display_name || null,
      default_review_days,
      digest_opted_in,
      timezone: timezone || 'UTC',
    } as Partial<User>)
    .eq('id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}
