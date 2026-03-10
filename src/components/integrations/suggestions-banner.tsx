'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SuggestionsBannerProps {
  count: number;
}

export function SuggestionsBanner({ count }: SuggestionsBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible || count === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-purple-200/80 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-900/10 px-5 py-3">
      <div className="flex items-center gap-3">
        <svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          <span className="font-semibold">{count} decision{count !== 1 ? 's' : ''}</span> found in
          your GitHub PRs — <Link href="/dashboard/suggestions" className="underline hover:text-purple-900 dark:hover:text-purple-100">review them</Link>
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-200"
        aria-label="Dismiss banner"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
