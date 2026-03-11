'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { deleteDecision } from '@/app/dashboard/decisions/actions';

interface DeleteButtonProps {
  decisionId: string;
  /** Where to navigate after deletion. Defaults to /dashboard/decisions */
  redirectTo?: string;
  onSuccess?: () => void;
  /** Use "ghost" on detail page to match the Button component styling */
  variant?: 'inline' | 'ghost';
}

export function DeleteButton({
  decisionId,
  redirectTo = '/dashboard/decisions',
  onSuccess,
  variant = 'inline',
}: DeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setShowConfirm(false);
    setLoading(true);

    const result = await deleteDecision(decisionId);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.info('Decision permanently deleted.');
      if (onSuccess) {
        onSuccess();
      } else {
        router.replace(redirectTo);
      }
    }
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  }

  function handleCancel() {
    setShowConfirm(false);
  }

  return (
    <>
      {variant === 'ghost' ? (
        <Button variant="ghost" size="sm" onClick={handleClick} disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          {loading ? (
            'Deleting...'
          ) : (
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
                <path d="M3 4h10" />
                <path d="M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" />
                <path d="M4 4l1 9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-9" />
              </svg>
              Delete
            </span>
          )}
        </button>
      )}
      <ConfirmModal
        open={showConfirm}
        title="Delete this decision?"
        description="This will permanently delete this decision and all its history. This action cannot be undone."
        confirmLabel="Delete permanently"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={handleCancel}
      />
    </>
  );
}
