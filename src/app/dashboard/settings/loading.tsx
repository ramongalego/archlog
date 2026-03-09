export default function Loading() {
  return (
    <div className="mx-auto max-w-xl space-y-6 animate-pulse">
      {/* PageHeader */}
      <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-800" />

      {/* Billing card */}
      <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-3">
        <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-12 rounded-md bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-48 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="h-8 w-36 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Settings form card */}
      <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
