export default function SuggestionsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );
}
