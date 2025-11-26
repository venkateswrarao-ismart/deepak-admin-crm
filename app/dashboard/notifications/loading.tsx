export default function NotificationsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
        <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
      </div>

      <div className="rounded-md border">
        <div className="divide-y">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="h-5 w-40 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="h-4 w-full bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-2"></div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
