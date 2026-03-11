'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { archiveDecision, restoreDecision } from '../actions';

export function ArchiveButton({
  decisionId,
  isArchived,
}: {
  decisionId: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleArchiveOrRestore() {
    setLoading(true);
    setShowConfirm(false);

    const result = isArchived
      ? await restoreDecision(decisionId)
      : await archiveDecision(decisionId);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      if (isArchived) {
        toast.success('Decision restored.');
      } else {
        toast.info('Decision archived.');
      }
      router.refresh();
      setLoading(false);
    }
  }

  function handleClick() {
    if (isArchived) {
      handleArchiveOrRestore();
    } else {
      setShowConfirm(true);
    }
  }

  return (
    <>
      <Button
        variant={isArchived ? 'secondary' : 'ghost'}
        size="sm"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          isArchived ? (
            'Restoring...'
          ) : (
            'Archiving...'
          )
        ) : isArchived ? (
          <span className="flex items-center gap-1">
            <svg
              className="h-3 w-3"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 8a6 6 0 1 1 1.5 4" />
              <polyline points="2 4 2 8 6 8" />
            </svg>
            Restore
          </span>
        ) : (
          'Archive'
        )}
      </Button>
      <ConfirmModal
        open={showConfirm}
        title="Archive this decision?"
        description="It will be hidden from your timeline. You can restore it later."
        confirmLabel="Archive"
        variant="danger"
        onConfirm={handleArchiveOrRestore}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
