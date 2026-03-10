import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { DecisionList } from '@/components/decisions/decision-card';
import { SuggestionsBanner } from '@/components/integrations/suggestions-banner';
import { getActiveProjectId } from '@/lib/active-project';
import type { DecisionCardData } from '@/components/decisions/decision-card';
import type { Decision } from '@/types/decisions';
import { formatRelativeDate, daysUntil } from '@/lib/utils';

type ReviewDue = Pick<Decision, 'id' | 'title' | 'outcome_due_date' | 'created_at'>;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const activeProjectId = await getActiveProjectId();

  // Recent decisions - scoped to active project
  let recentQuery = supabase
    .from('decisions')
    .select('id, title, category, confidence, outcome_status, created_at')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(5);

  if (activeProjectId) {
    recentQuery = recentQuery.eq('project_id', activeProjectId);
  }

  const { data: recentDecisions } = (await recentQuery) as {
    data: DecisionCardData[] | null;
  };

  // Decisions due for review - scoped to active project
  let reviewQuery = supabase
    .from('decisions')
    .select('id, title, outcome_due_date, created_at')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .in('outcome_status', ['pending', 'still_playing_out'])
    .lte('outcome_due_date', new Date().toISOString())
    .order('outcome_due_date', { ascending: true })
    .limit(5);

  if (activeProjectId) {
    reviewQuery = reviewQuery.eq('project_id', activeProjectId);
  }

  const { data: reviewsDue } = (await reviewQuery) as { data: ReviewDue[] | null };

  // Fetch pending suggestions with source to show per-source banners
  let suggestionsQuery = supabase
    .from('suggested_decisions')
    .select('source')
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (activeProjectId) {
    suggestionsQuery = suggestionsQuery.eq('project_id', activeProjectId);
  }

  const { data: pendingSuggestions } = await suggestionsQuery;

  const suggestionCounts: Record<string, number> = {};
  for (const s of pendingSuggestions ?? []) {
    suggestionCounts[s.source] = (suggestionCounts[s.source] || 0) + 1;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Dashboard">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/decisions/new">
            <Button>
              <span className="mr-1">+</span> Log Decision
            </Button>
          </Link>
          <Link
            href="/dashboard/decisions/extract"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Extract from text
          </Link>
        </div>
      </PageHeader>

      {/* Suggested Decisions Banners */}
      {Object.keys(suggestionCounts).length > 0 && (
        <div className="space-y-2">
          {Object.entries(suggestionCounts).map(([source, count]) => (
            <SuggestionsBanner key={source} source={source} count={count} />
          ))}
        </div>
      )}

      {/* Reviews Due */}
      {reviewsDue && reviewsDue.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Reviews Due
          </h2>
          <div className="space-y-3">
            {reviewsDue.map((d) => (
              <Link key={d.id} href={`/dashboard/decisions/${d.id}`} className="block">
                <Card className="flex items-center justify-between hover:border-gray-300 dark:hover:border-gray-700 transition-all cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {d.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Decided {formatRelativeDate(d.created_at)} &middot; Review overdue by{' '}
                      {Math.abs(daysUntil(d.outcome_due_date))} days
                    </p>
                  </div>
                  <Badge className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    Review
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Decisions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Recent Decisions
          </h2>
          <Link
            href="/dashboard/decisions"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            View all
          </Link>
        </div>

        {recentDecisions && recentDecisions.length > 0 ? (
          <DecisionList decisions={recentDecisions} />
        ) : (
          <Card className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No decisions yet.</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Log your first decision. It takes about two minutes.
            </p>
            <Link href="/dashboard/decisions/new" className="mt-4 inline-block">
              <Button>Log your first decision</Button>
            </Link>
          </Card>
        )}
      </section>
    </div>
  );
}
