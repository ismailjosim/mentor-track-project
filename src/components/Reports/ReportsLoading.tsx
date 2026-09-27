export function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-7 space-y-3">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="h-80 bg-card rounded-2xl border p-5 space-y-4">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted/30 rounded" />
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="h-48 bg-card rounded-2xl border p-5" />
          <div className="h-64 bg-card rounded-2xl border p-5" />
        </div>
      </div>
    </div>
  );
}
