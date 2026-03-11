import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { getActiveProjectId } from '@/lib/active-project';
import { formatRelativeDate } from '@/lib/utils';
import {
  CONFIDENCE_LABELS,
  CATEGORY_LABELS,
  OUTCOME_LABELS,
  type ConfidenceLevel,
  type DecisionCategory,
  type OutcomeStatus,
} from '@/types/decisions';

export const metadata: Metadata = { title: 'Analytics' };

interface AnalyticsDecision {
  confidence: ConfidenceLevel;
  category: DecisionCategory;
  outcome_status: OutcomeStatus;
  created_at: string;
  outcome_due_date: string;
}

const CALIBRATION_THRESHOLD = 15;

const outcomeBarColors: Record<OutcomeStatus, string> = {
  vindicated: 'bg-emerald-500',
  reversed: 'bg-red-500',
  still_playing_out: 'bg-blue-500',
  pending: 'bg-gray-400/60 dark:bg-gray-500/50',
};

const heatmapOutcomes: OutcomeStatus[] = ['vindicated', 'reversed', 'still_playing_out'];
const heatmapColors: Record<OutcomeStatus, string> = {
  vindicated: 'bg-emerald-500',
  reversed: 'bg-red-500',
  still_playing_out: 'bg-blue-500',
  pending: '',
};

const categoryBarColors: Record<DecisionCategory, string> = {
  product: 'bg-violet-500',
  pricing: 'bg-amber-500',
  technical: 'bg-blue-500',
  hiring: 'bg-emerald-500',
  marketing: 'bg-pink-500',
  other: 'bg-gray-500',
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const activeProjectId = await getActiveProjectId();

  let query = supabase
    .from('decisions')
    .select('confidence, category, outcome_status, created_at, outcome_due_date')
    .eq('user_id', user.id)
    .eq('is_archived', false);

  if (activeProjectId) {
    query = query.eq('project_id', activeProjectId);
  }

  const { data: decisions } = (await query) as { data: AnalyticsDecision[] | null };
  const all = decisions ?? [];

  // --- Compute stats ---

  const total = all.length;
  const reviewed = all.filter(
    (d) => d.outcome_status !== 'pending' && d.outcome_status !== 'still_playing_out'
  );
  const reviewedCount = reviewed.length;
  const now = new Date();

  // Last logged
  const sorted = [...all].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const lastLogged = sorted[0]?.created_at ?? null;

  // Confidence calibration
  const confidenceLevels: ConfidenceLevel[] = ['high', 'medium', 'low'];
  const calibration = confidenceLevels.map((level) => {
    const atLevel = reviewed.filter((d) => d.confidence === level);
    const vindicated = atLevel.filter((d) => d.outcome_status === 'vindicated').length;
    const t = atLevel.length;
    return { level, vindicated, total: t, rate: t > 0 ? vindicated / t : 0 };
  });

  // Outcome breakdown
  const outcomeKeys: OutcomeStatus[] = ['vindicated', 'reversed', 'still_playing_out', 'pending'];
  const outcomes = outcomeKeys.map((status) => ({
    status,
    count: all.filter((d) => d.outcome_status === status).length,
  }));

  // Category distribution
  const categoryKeys: DecisionCategory[] = [
    'product',
    'pricing',
    'technical',
    'hiring',
    'marketing',
    'other',
  ];
  const categories = categoryKeys
    .map((cat) => {
      const inCat = all.filter((d) => d.category === cat);
      return { category: cat, count: inCat.length };
    })
    .filter((c) => c.count > 0)
    .sort(
      (a, b) =>
        b.count - a.count || CATEGORY_LABELS[a.category].localeCompare(CATEGORY_LABELS[b.category])
    );
  const maxCategoryCount = Math.max(...categories.map((c) => c.count), 1);

  // Category × Outcome heatmap
  const heatmapCategories = categoryKeys.filter((cat) =>
    all.some((d) => d.category === cat && d.outcome_status !== 'pending')
  );
  const heatmapData: Record<string, Record<string, number>> = {};
  let heatmapMax = 1;
  for (const cat of heatmapCategories) {
    heatmapData[cat] = {};
    for (const outcome of heatmapOutcomes) {
      const count = all.filter((d) => d.category === cat && d.outcome_status === outcome).length;
      heatmapData[cat][outcome] = count;
      if (count > heatmapMax) heatmapMax = count;
    }
  }

  // Decision velocity — last 6 months
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const count = all.filter((dec) => {
      const created = new Date(dec.created_at);
      return created >= d && created < nextMonth;
    }).length;
    months.push({ label, count });
  }
  const maxMonthCount = Math.max(...months.map((m) => m.count), 1);

  // Review backlog
  const overdue = all.filter(
    (d) =>
      (d.outcome_status === 'pending' || d.outcome_status === 'still_playing_out') &&
      new Date(d.outcome_due_date) <= now
  ).length;

  const calibrationReady = reviewedCount >= CALIBRATION_THRESHOLD;
  const heatmapReady = heatmapCategories.length >= 1 && reviewedCount >= 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Analytics" />

      {total === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No decisions yet.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Log some decisions to see your analytics.
          </p>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total decisions</p>
            </Card>
            <Card>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {reviewedCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reviewed</p>
            </Card>
            <Card>
              {(() => {
                const vindicatedCount = reviewed.filter(
                  (d) => d.outcome_status === 'vindicated'
                ).length;
                return (
                  <>
                    <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                      {reviewedCount > 0 ? (
                        <>
                          {vindicatedCount}/{reviewedCount}
                        </>
                      ) : (
                        '-'
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Validated
                      {reviewedCount > 0 && (
                        <span className="text-gray-400 dark:text-gray-500">
                          {' '}
                          ({Math.round((vindicatedCount / reviewedCount) * 100)}%)
                        </span>
                      )}
                    </p>
                  </>
                );
              })()}
            </Card>
            <Card>
              <p
                className={`text-2xl font-semibold ${overdue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}
              >
                {overdue}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Overdue reviews</p>
            </Card>
          </div>

          {/* Last logged nudge */}
          {lastLogged && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Last decision logged {formatRelativeDate(lastLogged)}
            </p>
          )}

          {/* Confidence Calibration */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Confidence Calibration
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              When you have high confidence, are you actually right more often?
            </p>

            {!calibrationReady ? (
              <div className="py-4 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">Not enough data yet.</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {reviewedCount} of {CALIBRATION_THRESHOLD} reviewed outcomes needed for meaningful
                  calibration.
                </p>
                <div className="mt-2 mx-auto w-48 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 transition-all"
                    style={{
                      width: `${Math.min((reviewedCount / CALIBRATION_THRESHOLD) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {calibration.map(({ level, vindicated, total, rate }) => (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {CONFIDENCE_LABELS[level]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {total > 0 ? `${Math.round(rate * 100)}% vindicated` : 'No data'}
                        {total > 0 && (
                          <span className="text-gray-400 dark:text-gray-500 ml-1">
                            ({vindicated}/{total})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                      {total > 0 && (
                        <div
                          className="h-2 rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.round(rate * 100)}%` }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Outcome Breakdown */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Outcome Breakdown
            </h2>

            {/* Stacked bar */}
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              {outcomes
                .filter((o) => o.count > 0)
                .map((o) => (
                  <div
                    key={o.status}
                    className={`${outcomeBarColors[o.status]} transition-all`}
                    style={{ width: `${(o.count / total) * 100}%` }}
                    title={`${OUTCOME_LABELS[o.status]}: ${o.count}`}
                  />
                ))}
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {outcomes
                .filter((o) => o.count > 0)
                .map((o) => (
                  <div key={o.status} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${outcomeBarColors[o.status]}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {OUTCOME_LABELS[o.status]} ({o.count})
                    </span>
                  </div>
                ))}
            </div>
          </Card>

          {/* Category × Outcome Heatmap */}
          {heatmapReady && (
            <Card>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Category &times; Outcome
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3" />
                      {heatmapOutcomes.map((o) => (
                        <th
                          key={o}
                          className="text-center font-medium text-gray-500 dark:text-gray-400 pb-2 px-2"
                        >
                          {OUTCOME_LABELS[o]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapCategories.map((cat) => (
                      <tr key={cat}>
                        <td className="text-sm font-medium text-gray-700 dark:text-gray-300 py-1.5 pr-3 whitespace-nowrap">
                          {CATEGORY_LABELS[cat]}
                        </td>
                        {heatmapOutcomes.map((outcome) => {
                          const count = heatmapData[cat][outcome];
                          const intensity = count > 0 ? Math.max(0.15, count / heatmapMax) : 0;
                          return (
                            <td key={outcome} className="px-2 py-1.5">
                              <div className="flex justify-center">
                                {count > 0 ? (
                                  <div
                                    className={`${heatmapColors[outcome]} rounded h-5 flex items-center justify-center`}
                                    style={{
                                      width: `${Math.max(intensity * 100, 24)}%`,
                                      minWidth: '24px',
                                      opacity: Math.max(intensity, 0.4),
                                    }}
                                  >
                                    <span className="text-[10px] font-medium text-white">
                                      {count}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-700">-</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Category Distribution */}
          {categories.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Decisions by Category
              </h2>
              <div className="space-y-3">
                {categories.map(({ category, count }) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {CATEGORY_LABELS[category]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {count} decision{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={`h-2 rounded-full ${categoryBarColors[category]} transition-all`}
                        style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Decision Velocity */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Decision Velocity
            </h2>
            <div className="flex items-end gap-2 h-32">
              {months.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    {m.count || ''}
                  </span>
                  <div className="w-full flex items-end" style={{ height: '80px' }}>
                    <div
                      className="w-full rounded-t bg-emerald-500 transition-all"
                      style={{
                        height:
                          m.count > 0 ? `${Math.max((m.count / maxMonthCount) * 100, 8)}%` : '0%',
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{m.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
