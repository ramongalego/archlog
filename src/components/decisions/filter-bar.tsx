'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';
import { Dropdown } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABELS, OUTCOME_LABELS, CONFIDENCE_LABELS } from '@/types/decisions';

const categoryOptions = [
  { value: '', label: 'All' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

const outcomeOptions = [
  { value: '', label: 'All' },
  ...Object.entries(OUTCOME_LABELS).map(([value, label]) => ({ value, label })),
];

const confidenceOptions = [
  { value: '', label: 'All' },
  ...Object.entries(CONFIDENCE_LABELS).map(([value, label]) => ({ value, label })),
];

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const outcomeStatus = searchParams.get('outcome_status') ?? '';
  const confidence = searchParams.get('confidence') ?? '';
  const dateFrom = searchParams.get('date_from') ?? '';
  const dateTo = searchParams.get('date_to') ?? '';

  const hasFilters = searchQuery || category || outcomeStatus || confidence || dateFrom || dateTo;

  // Debounced search
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Sync input when URL changes externally (e.g. clear filters)
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) {
        params.set('q', searchInput);
      } else {
        params.delete('q');
      }
      params.delete('page');
      router.push(`/dashboard/decisions?${params.toString()}`);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filters change
      params.delete('page');
      router.push(`/dashboard/decisions?${params.toString()}`);
    },
    [router, searchParams]
  );

  function handleClear() {
    router.push('/dashboard/decisions');
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        {searchInput !== searchQuery ? (
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        )}
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search decisions..."
          className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-10 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Category
          </label>
          <Dropdown
            value={category}
            onChange={(val) => updateParam('category', val)}
            options={categoryOptions}
            placeholder="All"
            className="w-36"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Outcome
          </label>
          <Dropdown
            value={outcomeStatus}
            onChange={(val) => updateParam('outcome_status', val)}
            options={outcomeOptions}
            placeholder="All"
            className="w-40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Confidence
          </label>
          <Dropdown
            value={confidence}
            onChange={(val) => updateParam('confidence', val)}
            options={confidenceOptions}
            placeholder="All"
            className="w-28"
          />
        </div>

        <div>
          <label
            htmlFor="filter-date-from"
            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            From
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => updateParam('date_from', e.target.value)}
            className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="filter-date-to"
            className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
          >
            To
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => updateParam('date_to', e.target.value)}
            className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
