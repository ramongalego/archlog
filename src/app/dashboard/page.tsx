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
import { daysUntil } from '@/lib/utils';

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
    .select('id, title, category, confidence, outcome_status, outcome_due_date, created_at')
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

  // Analytics sample — total, overdue, vindication rate
  let statsQuery = supabase
    .from('decisions')
    .select('outcome_status')
    .eq('user_id', user.id)
    .eq('is_archived', false);

  if (activeProjectId) {
    statsQuery = statsQuery.eq('project_id', activeProjectId);
  }

  const { data: allDecisions } = (await statsQuery) as {
    data: Pick<Decision, 'outcome_status'>[] | null;
  };
  const allDecs = allDecisions ?? [];
  const totalCount = allDecs.length;
  const reviewed = allDecs.filter(
    (d) => d.outcome_status !== 'pending' && d.outcome_status !== 'still_playing_out'
  );
  const vindicatedCount = reviewed.filter((d) => d.outcome_status === 'vindicated').length;
  const vindicatedPct =
    reviewed.length > 0 ? Math.round((vindicatedCount / reviewed.length) * 100) : null;
  const overdueCount = (reviewsDue ?? []).length;

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

      {/* Analytics sample */}
      {totalCount >= 5 && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">{totalCount}</span>{' '}
          decisions total
          {overdueCount > 0 && (
            <>
              <span className="text-gray-300 dark:text-gray-600">&middot;</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {overdueCount}
              </span>{' '}
              overdue
            </>
          )}
          {vindicatedPct !== null && (
            <>
              <span className="text-gray-300 dark:text-gray-600">&middot;</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {vindicatedPct}%
              </span>{' '}
              validated
            </>
          )}
          <span className="text-gray-300 dark:text-gray-600">&middot;</span>
          <Link
            href="/dashboard/analytics"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-2"
          >
            View analytics &rarr;
          </Link>
        </div>
      )}

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
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      Overdue by {Math.abs(daysUntil(d.outcome_due_date))} days
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
