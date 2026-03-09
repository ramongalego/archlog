import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatRelativeDate } from '@/lib/utils';
import {
  CATEGORY_LABELS,
  CONFIDENCE_COLORS,
  CONFIDENCE_LABELS,
  OUTCOME_COLORS,
  OUTCOME_LABELS,
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
  created_at: string;
  custom_category?: string | null;
}

export function DecisionCard({ decision }: { decision: DecisionCardData }) {
  const categoryLabel =
    decision.category === 'other' && decision.custom_category
      ? decision.custom_category
      : CATEGORY_LABELS[decision.category];

  return (
    <Link href={`/dashboard/decisions/${decision.id}`} className="block">
      <Card className="hover:border-gray-300 dark:hover:border-gray-700 transition-all cursor-pointer">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{decision.title}</p>
          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-4">
            {formatRelativeDate(decision.created_at)}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {categoryLabel}
          </Badge>
          <Badge className={CONFIDENCE_COLORS[decision.confidence]}>
            {CONFIDENCE_LABELS[decision.confidence]}
          </Badge>
          <Badge className={OUTCOME_COLORS[decision.outcome_status]}>
            {OUTCOME_LABELS[decision.outcome_status]}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}

export function DecisionList({ decisions }: { decisions: DecisionCardData[] }) {
  return (
    <div className="space-y-3">
      {decisions.map((d) => (
        <DecisionCard key={d.id} decision={d} />
      ))}
    </div>
  );
}
