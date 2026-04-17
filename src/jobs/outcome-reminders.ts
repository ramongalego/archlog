import { schedules } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/send';
import {
  buildOutcomeReminderHtml,
  buildOutcomeReminderText,
} from '@/lib/email/templates/outcome-reminder';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/database';
import type { User, Decision } from '@/types/decisions';

function getSupabase() {
  return createClient<Database>(env().NEXT_PUBLIC_SUPABASE_URL, env().SUPABASE_SERVICE_ROLE_KEY);
}

export const outcomeRemindersTask = schedules.task({
  id: 'outcome-reminders',
  cron: '0 10 * * *', // Every day at 10:00 AM UTC
  run: async () => {
    const supabase = getSupabase();
    const baseUrl = env().NEXT_PUBLIC_APP_URL;

    // Only email about decisions that became overdue in the last 24 hours
    // (first day past due). Persistent nudges are handled by the weekly digest.
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: dueDecisions } = (await supabase
      .from('decisions')
      .select('id, title, user_id, outcome_due_date')
      .in('outcome_status', ['pending', 'still_playing_out'])
      .eq('is_archived', false)
      .lte('outcome_due_date', now.toISOString())
      .gte('outcome_due_date', oneDayAgo.toISOString())
      .order('outcome_due_date', { ascending: true })) as { data: Decision[] | null };

    if (!dueDecisions || dueDecisions.length === 0) {
      return { processed: 0 };
    }

    const byUser = new Map<string, Decision[]>();
    for (const d of dueDecisions) {
      const existing = byUser.get(d.user_id) || [];
      existing.push(d);
      byUser.set(d.user_id, existing);
    }

    let processed = 0;

    for (const [userId, decisions] of byUser) {
      const { data: profile } = (await supabase
        .from('users')
        .select('email, display_name')
        .eq('id', userId)
        .single()) as { data: Pick<User, 'email' | 'display_name'> | null };

      if (!profile) continue;

      const html = buildOutcomeReminderHtml({
        displayName: profile.display_name,
        decisions,
        baseUrl,
      });

      const text = buildOutcomeReminderText({
        displayName: profile.display_name,
        decisions,
        baseUrl,
      });

      const count = decisions.length;
      const subject = `${count} decision${count > 1 ? 's' : ''} ready for review`;

      try {
        await sendEmail({
          to: profile.email,
          subject,
          html,
          text,
        });
        processed++;
      } catch (err) {
        logger.error('Failed to send outcome reminder', err, { userId });
      }
    }

    return { processed };
  },
});
