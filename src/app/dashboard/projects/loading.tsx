export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
      {/* PageHeader */}
      <div className="h-8 w-28 rounded bg-gray-200 dark:bg-gray-800" />

      {/* Create project card */}
      <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-3">
        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Project row cards */}
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-56 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="flex gap-1">
                <div className="h-7 w-16 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-7 w-16 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
