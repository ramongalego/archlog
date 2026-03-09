export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-pulse">
      {/* PageHeader */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-9 w-36 rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Reviews Due section */}
      <section>
        <div className="mb-3 h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-5 w-16 rounded-md bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Decisions section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-14 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
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
      </section>
    </div>
  );
}
