'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SuggestionsBannerProps {
  source: string;
  count: number;
}

const SOURCE_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    border: string;
    bg: string;
    text: string;
    dismiss: string;
  }
> = {
  github: {
    label: 'your GitHub PRs',
    icon: (
      <svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
    border: 'border-purple-200/80 dark:border-purple-800/50',
    bg: 'bg-purple-50/50 dark:bg-purple-900/10',
    text: 'text-purple-700 dark:text-purple-300',
    dismiss: 'text-purple-400 hover:text-purple-600 dark:hover:text-purple-200',
  },
  gitlab: {
    label: 'your GitLab MRs',
    icon: (
      <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 00-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 00-.867 0L1.386 9.452.044 13.587a.924.924 0 00.331 1.023L12 23.054l11.625-8.443a.92.92 0 00.33-1.024" />
      </svg>
    ),
    border: 'border-orange-200/80 dark:border-orange-800/50',
    bg: 'bg-orange-50/50 dark:bg-orange-900/10',
    text: 'text-orange-700 dark:text-orange-300',
    dismiss: 'text-orange-400 hover:text-orange-600 dark:hover:text-orange-200',
  },
  text: {
    label: 'your pasted text',
    icon: (
      <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    border: 'border-blue-200/80 dark:border-blue-800/50',
    bg: 'bg-blue-50/50 dark:bg-blue-900/10',
    text: 'text-blue-700 dark:text-blue-300',
    dismiss: 'text-blue-400 hover:text-blue-600 dark:hover:text-blue-200',
  },
};

const DEFAULT_CONFIG = {
  label: 'an integration',
  icon: (
    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  ),
  border: 'border-gray-200/80 dark:border-gray-800/50',
  bg: 'bg-gray-50/50 dark:bg-gray-900/10',
  text: 'text-gray-700 dark:text-gray-300',
  dismiss: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
};

export function SuggestionsBanner({ source, count }: SuggestionsBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible || count === 0) return null;

  const config = SOURCE_CONFIG[source] ?? DEFAULT_CONFIG;

  return (
    <div
      className={`flex items-center justify-between rounded-xl border ${config.border} ${config.bg} px-5 py-3`}
    >
      <div className="flex items-center gap-3">
        {config.icon}
        <p className={`text-sm ${config.text}`}>
          <span className="font-semibold">
            {count} decision{count !== 1 ? 's' : ''}
          </span>{' '}
          found in {config.label} -{' '}
          <Link href="/dashboard/suggestions" className="underline hover:opacity-80">
            review them
          </Link>
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className={config.dismiss}
        aria-label="Dismiss banner"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
