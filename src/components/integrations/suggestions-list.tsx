'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { SuggestedDecision } from '@/types/decisions';
import { dismissSuggestion } from '@/app/dashboard/suggestions/actions';

interface SuggestionsListProps {
  suggestions: SuggestedDecision[];
  projectId: string;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  low: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
};

export function SuggestionsList({ suggestions, projectId }: SuggestionsListProps) {
  const router = useRouter();
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  async function handleDismiss(id: string) {
    setDismissing(id);
    const result = await dismissSuggestion(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      setDismissed((prev) => new Set([...prev, id]));
      toast.info('Suggestion dismissed');
    }
    setDismissing(null);
  }

  function handleAccept(suggestion: SuggestedDecision) {
    // Navigate to new decision form with pre-filled data via query params
    const params = new URLSearchParams({
      from_suggestion: suggestion.id,
      title: suggestion.extracted_title,
      context: suggestion.extracted_reasoning,
      project_id: projectId,
    });
    if (suggestion.extracted_alternatives) {
      params.set('alternatives', suggestion.extracted_alternatives);
    }
    router.push(`/dashboard/decisions/new?${params.toString()}`);
  }

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (visible.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">All suggestions reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visible.map((s) => (
        <Card key={s.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {s.extracted_title}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                From PR #{s.pr_number}: {s.pr_title}
                {s.pr_author && <> by <span className="font-medium">@{s.pr_author}</span></>}
              </p>
            </div>
            <Badge className={CONFIDENCE_STYLES[s.confidence] ?? CONFIDENCE_STYLES.medium}>
              {s.confidence}
            </Badge>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {s.extracted_reasoning}
          </p>

          {s.extracted_alternatives && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">Alternatives considered:</span> {s.extracted_alternatives}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <a
              href={s.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
            >
              View PR on GitHub
            </a>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(s.id)}
                disabled={dismissing === s.id}
              >
                {dismissing === s.id ? 'Dismissing...' : 'Dismiss'}
              </Button>
              <Button size="sm" onClick={() => handleAccept(s)}>
                Accept
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
