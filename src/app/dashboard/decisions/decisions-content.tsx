'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DecisionList } from '@/components/decisions/decision-card';
import { FilterBar } from '@/components/decisions/filter-bar';
import type { Filters } from '@/components/decisions/filter-bar';
import type { DecisionCardData } from '@/components/decisions/decision-card';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { listDecisions } from './actions';

const PAGE_SIZE = 20;

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-5 w-16 rounded-md bg-gray-100 dark:bg-gray-800" />
        <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

interface DecisionsContentProps {
  activeProjectId: string | null;
  initialDecisions: DecisionCardData[];
  initialTotal: number;
  initialFilters: Filters;
  tier: string;
  totalDecisionCount: number | null;
}

export function DecisionsContent({
  activeProjectId,
  initialDecisions,
  initialTotal,
  initialFilters,
  tier,
  totalDecisionCount,
}: DecisionsContentProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [decisions, setDecisions] = useState<DecisionCardData[]>(initialDecisions);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const filtersRef = useRef(initialFilters);
  const fetchIdRef = useRef(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const prevProjectIdRef = useRef(activeProjectId);

  const doFetch = useCallback(
    async (f: Filters) => {
      setLoading(true);
      const id = ++fetchIdRef.current;
      try {
        const result = await listDecisions({
          projectId: activeProjectId ?? undefined,
          search: f.search || undefined,
          category: f.category || undefined,
          outcomeStatus: f.outcomeStatus || undefined,
          confidence: f.confidence || undefined,
          dateFrom: f.dateFrom || undefined,
          dateTo: f.dateTo || undefined,
          page: f.page,
          pageSize: PAGE_SIZE,
          showArchived: f.showArchived,
        });
        if (fetchIdRef.current === id) {
          setDecisions(result.decisions as DecisionCardData[]);
          setTotal(result.total);
          setLoading(false);
        }
      } catch {
        if (fetchIdRef.current === id) {
          setLoading(false);
        }
      }
    },
    [activeProjectId]
  );

  useEffect(() => {
    if (prevProjectIdRef.current !== activeProjectId) {
      prevProjectIdRef.current = activeProjectId;
      doFetch(filtersRef.current);
    }
  }, [activeProjectId, doFetch]);

  function handleFilterChange(key: string, value: string | boolean | number) {
    const next = { ...filtersRef.current, [key]: value } as Filters;
    if (key !== 'page') next.page = 1;
    filtersRef.current = next;
    setFilters(next);

    if (key === 'search') {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => doFetch(filtersRef.current), 300);
    } else {
      doFetch(next);
    }
  }

  function handleClear() {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const next: Filters = {
      search: '',
      category: '',
      outcomeStatus: '',
      confidence: '',
      dateFrom: '',
      dateTo: '',
      showArchived: false,
      page: 1,
    };
    filtersRef.current = next;
    setFilters(next);
    doFetch(next);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters =
    filters.search ||
    filters.category ||
    filters.outcomeStatus ||
    filters.confidence ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.showArchived;

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

      <FilterBar
        filters={filters}
        hasFilters={!!hasFilters}
        onFilterChange={handleFilterChange}
        onClear={handleClear}
      />

      {tier === 'free' && totalDecisionCount !== null && (
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={`text-xs ${
              totalDecisionCount >= 50
                ? 'text-red-500 dark:text-red-400'
                : totalDecisionCount >= 40
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {totalDecisionCount}/50 Decisions
          </span>
          {totalDecisionCount >= 40 && (
            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
              className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2 transition-colors"
            >
              Upgrade for unlimited
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : decisions.length > 0 ? (
        <>
          <DecisionList
            decisions={decisions}
            onAction={() => doFetch(filtersRef.current)}
            onDelete={(id) => {
              setDecisions((prev) => prev.filter((d) => d.id !== id));
              setTotal((prev) => prev - 1);
            }}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              {filters.page > 1 ? (
                <button
                  type="button"
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Previous
                </button>
              ) : (
                <span />
              )}

              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {filters.page} of {totalPages}
              </span>

              {filters.page < totalPages ? (
                <button
                  type="button"
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Next
                </button>
              ) : (
                <span />
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 py-12 text-center">
          {hasFilters ? (
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

      <UpgradeModal
        open={showUpgrade}
        currentTier="free"
        onUpgrade={() => {}}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  );
}
