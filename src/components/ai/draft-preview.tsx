'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CONFIDENCE_LABELS, CATEGORY_LABELS, type DraftSuggestion } from '@/types/decisions';

interface DraftPreviewProps {
  suggestion: DraftSuggestion;
  onAccept: (suggestion: DraftSuggestion) => void;
  onDiscard: () => void;
}

export function DraftPreview({ suggestion, onAccept, onDiscard }: DraftPreviewProps) {
  return (
    <div className="rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">AI Suggestion</span>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onDiscard}>
            Discard
          </Button>
          <Button size="sm" onClick={() => onAccept(suggestion)}>
            Accept
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Title</span>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{suggestion.title}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Why</span>
          <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion.why}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Context</span>
          <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion.context}</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {CONFIDENCE_LABELS[suggestion.confidence]}
          </Badge>
          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {CATEGORY_LABELS[suggestion.category]}
          </Badge>
        </div>
      </div>
    </div>
  );
}
