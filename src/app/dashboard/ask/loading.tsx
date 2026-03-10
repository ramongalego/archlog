export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
      {/* PageHeader */}
      <div>
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-2 h-4 w-80 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Chat area */}
      <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
        <div className="h-64" />
      </div>

      {/* Input bar */}
      <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}
