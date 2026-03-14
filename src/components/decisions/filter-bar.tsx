'use client';

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

export interface Filters {
  search: string;
  category: string;
  outcomeStatus: string;
  confidence: string;
  dateFrom: string;
  dateTo: string;
  showArchived: boolean;
  page: number;
}

interface FilterBarProps {
  filters: Filters;
  hasFilters: boolean;
  onFilterChange: (key: string, value: string | boolean) => void;
  onClear: () => void;
}

export function FilterBar({ filters, hasFilters, onFilterChange, onClear }: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
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
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          placeholder="Search decisions..."
          className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-10 pr-3 py-2 text-base md:text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Category
          </label>
          <Dropdown
            value={filters.category}
            onChange={(val) => onFilterChange('category', val)}
            options={categoryOptions}
            placeholder="All"
            className="md:w-36"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Outcome
          </label>
          <Dropdown
            value={filters.outcomeStatus}
            onChange={(val) => onFilterChange('outcomeStatus', val)}
            options={outcomeOptions}
            placeholder="All"
            className="md:w-40"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Confidence
          </label>
          <Dropdown
            value={filters.confidence}
            onChange={(val) => onFilterChange('confidence', val)}
            options={confidenceOptions}
            placeholder="All"
            className="md:w-28"
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
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-base md:text-sm text-gray-900 dark:text-gray-100 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
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
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-base md:text-sm text-gray-900 dark:text-gray-100 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showArchived}
            onChange={(e) => onFilterChange('showArchived', e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-gray-900/10 dark:focus:ring-gray-100/10"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">Show archived</span>
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className={hasFilters ? '' : 'invisible'}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
