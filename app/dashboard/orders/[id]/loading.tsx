import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function OrderDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      <Skeleton className="h-16 w-full" />

      {/* Invoice Section Skeleton */}
      <div className="border border-gray-200 rounded-md">
        <Skeleton className="h-8 w-full" />
        <div className="flex w-full">
          <div className="w-1/2 p-4 space-y-4">
            <div className="flex">
              <Skeleton className="h-24 w-24 mr-2" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="w-1/2 grid grid-cols-2 gap-2 p-4">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
          </div>
        </div>

        {/* Items Table Skeleton */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-8 gap-2">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
          </div>
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="grid grid-cols-8 gap-2">
                {Array(8)
                  .fill(0)
                  .map((_, j) => (
                    <Skeleton key={j} className="h-6 w-full" />
                  ))}
              </div>
            ))}
        </div>
      </div>

      {/* Interactive Components Skeletons */}
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <Card key={i} className="p-4">
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-1/3" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/3" />
            </CardContent>
          </Card>
        ))}
    </div>
  )
}
