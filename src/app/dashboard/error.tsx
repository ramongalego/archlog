'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The runtime already logs to stderr; we surface it to the browser console
    // so developers can correlate the digest with their server logs.
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center space-y-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Something went wrong
      </h1>
      <p className="text-gray-500 dark:text-gray-400">
        We hit an unexpected error loading this page. Try again, or head back to your dashboard.
      </p>
      {error.digest ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">Error ID: {error.digest}</p>
      ) : null}
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Dashboard home
        </Link>
      </div>
    </div>
  );
}
