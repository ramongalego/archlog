import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RestoreButton } from './restore-button';
import { DeleteButton } from './delete-button';
import { formatRelativeDate } from '@/lib/utils';
import {
  CATEGORY_LABELS,
  CONFIDENCE_LABELS,
  getOutcomeDisplay,
  type DecisionCategory,
  type ConfidenceLevel,
  type OutcomeStatus,
} from '@/types/decisions';

export interface DecisionCardData {
  id: string;
  title: string;
  category: DecisionCategory;
  confidence: ConfidenceLevel;
  outcome_status: OutcomeStatus;
  outcome_due_date: string;
  created_at: string;
  custom_category?: string | null;
  is_archived?: boolean;
  author_name?: string | null;
}

export function DecisionCard({
  decision,
  onAction,
  onDelete,
}: {
  decision: DecisionCardData;
  onAction?: () => void;
  onDelete?: (id: string) => void;
}) {
  const categoryLabel =
    decision.category === 'other' && decision.custom_category
      ? decision.custom_category
      : CATEGORY_LABELS[decision.category];

  const outcome = getOutcomeDisplay(decision.outcome_status, decision.outcome_due_date);
  const archived = decision.is_archived === true;

  return (
    <Link href={`/dashboard/decisions/${decision.id}`} className="block">
      <Card
        className={`hover:border-gray-300 dark:hover:border-gray-700 transition-all cursor-pointer ${archived ? 'opacity-60' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {decision.title}
            </p>
            {archived && (
              <Badge className="bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 shrink-0">
                Archived
              </Badge>
            )}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0 ml-4">
            {formatRelativeDate(decision.created_at)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={outcome.color}>{outcome.label}</Badge>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {categoryLabel} &middot; {CONFIDENCE_LABELS[decision.confidence]} confidence
            </span>
          </div>
          {decision.author_name && !archived && (
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-4">
              {decision.author_name}
            </span>
          )}
          {archived && (
            <div className="flex items-center gap-3">
              <RestoreButton decisionId={decision.id} onSuccess={onAction} />
              <DeleteButton
                decisionId={decision.id}
                onSuccess={() => {
                  onDelete?.(decision.id);
                  onAction?.();
                }}
              />
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function DecisionList({
  decisions,
  onAction,
  onDelete,
}: {
  decisions: DecisionCardData[];
  onAction?: () => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {decisions.map((d) => (
        <DecisionCard key={d.id} decision={d} onAction={onAction} onDelete={onDelete} />
      ))}
    </div>
  );
}
