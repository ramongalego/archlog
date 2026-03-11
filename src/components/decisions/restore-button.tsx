'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { restoreDecision } from '@/app/dashboard/decisions/actions';

export function RestoreButton({
  decisionId,
  onSuccess,
}: {
  decisionId: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRestore(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    const result = await restoreDecision(decisionId);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success('Decision restored.');
      if (onSuccess) {
        onSuccess();
      } else {
        setLoading(false);
        router.refresh();
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleRestore}
      disabled={loading}
      className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
    >
      {loading ? (
        'Restoring...'
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
            <path d="M2 8a6 6 0 1 1 1.5 4" />
            <polyline points="2 4 2 8 6 8" />
          </svg>
          Restore
        </span>
      )}
    </button>
  );
}
