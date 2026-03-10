'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { recordOutcome } from '@/app/dashboard/decisions/actions';
import { OUTCOME_LABELS, type OutcomeStatus } from '@/types/decisions';

const OUTCOME_OPTIONS: OutcomeStatus[] = ['vindicated', 'reversed', 'still_playing_out'];

export function OutcomeForm({ decisionId }: { decisionId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<OutcomeStatus>('vindicated');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    } else {
      toast.success('Outcome recorded.');
      setSubmitted(true);
    }

    setSubmitting(false);
    router.refresh();
  }

  if (submitted) {
    return <p className="text-sm text-green-600 dark:text-green-400">Outcome recorded.</p>;
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
          className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
          rows={3}
        />
      </div>

      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? 'Saving...' : 'Record Outcome'}
      </Button>
    </form>
  );
}
