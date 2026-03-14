'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { recordOutcome } from '@/app/dashboard/decisions/actions';
import { OUTCOME_LABELS, type OutcomeStatus } from '@/types/decisions';

const OUTCOME_OPTIONS: OutcomeStatus[] = ['vindicated', 'reversed', 'still_playing_out'];

export function OutcomeForm({
  decisionId,
  onCancel,
  onSaved,
  initialStatus,
  initialNotes,
}: {
  decisionId: string;
  onCancel?: () => void;
  onSaved?: () => void;
  initialStatus?: OutcomeStatus;
  initialNotes?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OutcomeStatus>(initialStatus ?? 'vindicated');
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.set('decision_id', decisionId);
    formData.set('outcome_status', status);
    formData.set('outcome_notes', notes);

    const result = await recordOutcome(formData);

    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
    } else {
      toast.success('Outcome recorded.');
      setSubmitting(false);
      onSaved?.();
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          What happened?
        </label>
        <Dropdown
          value={status}
          onChange={(val) => setStatus(val as OutcomeStatus)}
          options={OUTCOME_OPTIONS.map((s) => ({ value: s, label: OUTCOME_LABELS[s] }))}
        />
      </div>

      <div>
        <label
          htmlFor="outcome_notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Notes (optional)
        </label>
        <textarea
          id="outcome_notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What happened? Why did it work or not?"
          className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-base md:text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving...' : 'Record Outcome'}
        </Button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
