export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      {/* PageHeader */}
      <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-800" />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-2"
          >
            <div className="h-7 w-12 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>

      {/* Calibration card */}
      <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-4">
        <div className="h-4 w-44 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3 w-72 rounded bg-gray-200 dark:bg-gray-800" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>

      {/* Outcome breakdown card */}
      <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-3">
        <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-full rounded-full bg-gray-200 dark:bg-gray-800" />
        <div className="flex gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      </div>

      {/* Category card */}
      <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-4">
        <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>

      {/* Velocity card */}
      <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-3">
        <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="flex items-end gap-2 h-32">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gray-200 dark:bg-gray-800"
                style={{ height: `${30 + i * 10}px` }}
              />
              <div className="h-3 w-6 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
