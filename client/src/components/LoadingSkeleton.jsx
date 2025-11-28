// Reusable loading skeleton components

export function PlayerCardSkeleton() {
  return (
    <div className="bg-highlight-dark rounded-lg p-4 border border-neutral-700 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-neutral-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-5 bg-neutral-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-neutral-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-neutral-700 rounded"></div>
        <div className="h-4 bg-neutral-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-12 bg-neutral-800 rounded"></div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-neutral-800 rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-neutral-700 rounded w-1/2 mb-3"></div>
      <div className="h-8 bg-neutral-700 rounded w-3/4"></div>
    </div>
  );
}

export default { PlayerCardSkeleton, TableSkeleton, StatCardSkeleton };
