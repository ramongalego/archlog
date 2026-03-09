import { schedules } from '@trigger.dev/sdk/v3';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/send';
import { buildWeeklyDigestHtml, buildWeeklyDigestText } from '@/lib/email/templates/weekly-digest';
import type { Database } from '@/types/database';
import type { User, Decision } from '@/types/decisions';

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const weeklyDigestTask = schedules.task({
  id: 'weekly-digest',
  cron: '0 9 * * 1', // Every Monday at 9:00 AM UTC
  run: async () => {
    const supabase = getSupabase();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://archlog.app';

    const { data: users } = (await supabase
      .from('users')
      .select('id, email, display_name, timezone')
      .eq('digest_opted_in', true)) as {
      data: Pick<User, 'id' | 'email' | 'display_name' | 'timezone'>[] | null;
    };

    if (!users || users.length === 0) {
      return { processed: 0 };
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let processed = 0;

    for (const user of users) {
      const { data: recentDecisions } = (await supabase
        .from('decisions')
        .select('id, title, category, confidence, created_at')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false })) as { data: Decision[] | null };

      const { data: pendingReviews } = (await supabase
        .from('decisions')
        .select('id, title, outcome_due_date')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .in('outcome_status', ['pending', 'still_playing_out'])
        .lte('outcome_due_date', new Date().toISOString())
        .order('outcome_due_date', { ascending: true })) as { data: Decision[] | null };

      const { data: allDecisions } = (await supabase
        .from('decisions')
        .select('id, title, created_at, outcome_status')
        .eq('user_id', user.id)
        .eq('is_archived', false)) as { data: Decision[] | null };

      let randomDecision: Decision | null = null;
      if (allDecisions && allDecisions.length > 0) {
        const idx = Math.floor(Math.random() * allDecisions.length);
        randomDecision = allDecisions[idx];
      }

      const html = buildWeeklyDigestHtml({
        displayName: user.display_name,
        recentDecisions: recentDecisions ?? [],
        pendingReviews: pendingReviews ?? [],
        randomDecision,
        unsubscribeUrl: `${baseUrl}/dashboard/settings`,
      });

      const text = buildWeeklyDigestText({
        displayName: user.display_name,
        recentDecisions: recentDecisions ?? [],
        pendingReviews: pendingReviews ?? [],
        randomDecision,
      });

      try {
        await sendEmail({
          to: user.email,
          subject: 'Your weekly decision digest',
          html,
          text,
        });
        processed++;
      } catch (err) {
        console.error(`Failed to send digest to ${user.email}:`, err);
      }
    }

    return { processed };
  },
});
