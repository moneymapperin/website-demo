export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-border/70 dark:bg-border ${className}`}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="flex justify-center py-6">
        <Skeleton className="h-44 w-44 rounded-full" />
      </div>
      <Skeleton className="h-24 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-28 w-full rounded-3xl" />
    </div>
  )
}
