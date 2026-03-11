'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { OutcomeForm } from './outcome-form';
import { OUTCOME_LABELS, OUTCOME_COLORS, type OutcomeStatus } from '@/types/decisions';
import { formatDate } from '@/lib/utils';

interface OutcomeSectionProps {
  decisionId: string;
  outcomeStatus: OutcomeStatus;
  outcomeNotes: string | null;
  outcomeRecordedAt: string | null;
  createdAt: string;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

export function OutcomeSection({
  decisionId,
  outcomeStatus,
  outcomeNotes,
  outcomeRecordedAt,
  createdAt,
}: OutcomeSectionProps) {
  const [changing, setChanging] = useState(false);

  const isResolved = outcomeStatus === 'vindicated' || outcomeStatus === 'reversed';

  // For pending / ongoing, show the form pre-filled with any existing data
  if (!isResolved) {
    return (
      <Card>
        <h2 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
          Record Outcome
        </h2>
        <OutcomeForm
          decisionId={decisionId}
          initialStatus={outcomeStatus === 'still_playing_out' ? outcomeStatus : undefined}
          initialNotes={outcomeNotes ?? undefined}
        />
      </Card>
    );
  }

  // Resolved: rich outcome display
  const reviewDays = outcomeRecordedAt ? daysBetween(createdAt, outcomeRecordedAt) : null;

  if (changing) {
    return (
      <Card>
        <h2 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
          Change Outcome
        </h2>
        <OutcomeForm
          decisionId={decisionId}
          onCancel={() => setChanging(false)}
          onSaved={() => setChanging(false)}
          initialStatus={outcomeStatus}
          initialNotes={outcomeNotes ?? undefined}
        />
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Outcome</h2>

      <div className="flex items-center gap-2">
        <Badge className={OUTCOME_COLORS[outcomeStatus]}>{OUTCOME_LABELS[outcomeStatus]}</Badge>
        {outcomeRecordedAt && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Recorded {formatDate(outcomeRecordedAt)}
          </span>
        )}
      </div>

      {reviewDays !== null && reviewDays > 0 && (
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          Reviewed after {reviewDays} {reviewDays === 1 ? 'day' : 'days'}
        </p>
      )}

      {outcomeNotes && (
        <blockquote className="mt-3 border-l-2 border-gray-200 dark:border-gray-700 pl-3 text-sm text-gray-600 dark:text-gray-400 italic">
          {outcomeNotes}
        </blockquote>
      )}

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={() => setChanging(true)}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Change outcome
        </button>
      </div>
    </Card>
  );
}
