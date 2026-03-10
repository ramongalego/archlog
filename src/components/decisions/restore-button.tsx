'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { restoreDecision } from '@/app/dashboard/decisions/actions';

export function RestoreButton({ decisionId }: { decisionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRestore(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    const result = await restoreDecision(decisionId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Decision restored.');
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleRestore}
      disabled={loading}
      className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-2 transition-colors"
    >
      {loading ? 'Restoring...' : 'Restore'}
    </button>
  );
}
