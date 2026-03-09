export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      {/* PageHeader */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-9 w-36 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-36 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-9 w-40 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-9 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-9 w-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Decision cards */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="mt-2 flex gap-1.5">
              <div className="h-5 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
              <div className="h-5 w-14 rounded-md bg-gray-200 dark:bg-gray-800" />
              <div className="h-5 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
