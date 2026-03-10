import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { listDecisions } from './actions';
import { DecisionsContent } from './decisions-content';
import { getActiveProjectId } from '@/lib/active-project';
import type { DecisionCategory, OutcomeStatus, ConfidenceLevel } from '@/types/decisions';
import type { DecisionCardData } from '@/components/decisions/decision-card';

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

  const search = typeof params.q === 'string' ? params.q : '';
  const category = typeof params.category === 'string' ? params.category : '';
  const outcomeStatus = typeof params.outcome_status === 'string' ? params.outcome_status : '';
  const confidence = typeof params.confidence === 'string' ? params.confidence : '';
  const dateFrom = typeof params.date_from === 'string' ? params.date_from : '';
  const dateTo = typeof params.date_to === 'string' ? params.date_to : '';
  const showArchived = params.show_archived === 'true';
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const initialFilters = {
    search,
    category,
    outcomeStatus,
    confidence,
    dateFrom,
    dateTo,
    showArchived,
    page,
  };

  const { decisions, total } = await listDecisions({
    projectId: activeProjectId ?? undefined,
    search: search || undefined,
    category: (category as DecisionCategory) || undefined,
    outcomeStatus: (outcomeStatus as OutcomeStatus) || undefined,
    confidence: (confidence as ConfidenceLevel) || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize: 20,
    showArchived,
  });

  return (
    <DecisionsContent
      activeProjectId={activeProjectId}
      initialDecisions={decisions as DecisionCardData[]}
      initialTotal={total}
      initialFilters={initialFilters}
    />
  );
}
