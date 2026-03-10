import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DecisionList } from '@/components/decisions/decision-card';
import { FilterBar } from '@/components/decisions/filter-bar';
import { listDecisions } from './actions';
import { getActiveProjectId } from '@/lib/active-project';
import type { DecisionCategory, OutcomeStatus, ConfidenceLevel } from '@/types/decisions';

export default async function DecisionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const params = await searchParams;
  const activeProjectId = await getActiveProjectId();

  const search = typeof params.q === 'string' ? params.q : undefined;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const outcomeStatus =
    typeof params.outcome_status === 'string' ? params.outcome_status : undefined;
  const confidence = typeof params.confidence === 'string' ? params.confidence : undefined;
  const dateFrom = typeof params.date_from === 'string' ? params.date_from : undefined;
  const dateTo = typeof params.date_to === 'string' ? params.date_to : undefined;
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const pageSize = 20;

  const { decisions, total } = await listDecisions({
    projectId: activeProjectId ?? undefined,
    search,
    category: category as DecisionCategory | undefined,
    outcomeStatus: outcomeStatus as OutcomeStatus | undefined,
    confidence: confidence as ConfidenceLevel | undefined,
    dateFrom,
    dateTo,
    page,
    pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  function paginationHref(targetPage: number) {
    const p = new URLSearchParams();
    if (search) p.set('q', search);
    if (category) p.set('category', category);
    if (outcomeStatus) p.set('outcome_status', outcomeStatus);
    if (confidence) p.set('confidence', confidence);
    if (dateFrom) p.set('date_from', dateFrom);
    if (dateTo) p.set('date_to', dateTo);
    if (targetPage > 1) p.set('page', String(targetPage));
    const qs = p.toString();
    return `/dashboard/decisions${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Decisions">
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

      <FilterBar />

      {decisions.length > 0 ? (
        <>
          <DecisionList decisions={decisions} />

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              {page > 1 ? (
                <Link
                  href={paginationHref(page - 1)}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}

              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={paginationHref(page + 1)}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 py-12 text-center">
          {search || category || outcomeStatus || confidence || dateFrom || dateTo ? (
            <>
              <p className="text-gray-500 dark:text-gray-400">No decisions match your filters.</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Try adjusting your search or filters.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-500 dark:text-gray-400">No decisions yet.</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Log your first decision. It takes about two minutes.
              </p>
              <Link href="/dashboard/decisions/new" className="mt-4 inline-block">
                <Button>Log your first decision</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
