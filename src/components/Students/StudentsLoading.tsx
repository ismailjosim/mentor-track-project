export function StudentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-7 space-y-3">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded" />
      </div>

      {/* Metric Cards skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`metric-skel-${i}`} className="h-24 bg-card rounded-2xl border p-4 space-y-2">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-6 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="h-10 w-full bg-muted/40 rounded" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`row-skel-${i}`} className="h-12 w-full bg-muted/20 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
