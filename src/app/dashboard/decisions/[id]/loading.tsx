export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      {/* Title */}
      <div>
        <div className="h-7 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-2 h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Badge row */}
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
        <div className="h-5 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
        <div className="h-5 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Context card */}
      <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>

      {/* Why card */}
      <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}
