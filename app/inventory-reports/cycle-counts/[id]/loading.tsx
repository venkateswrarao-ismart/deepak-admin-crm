import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"

export default function CycleCountDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-32 mt-1" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 max-w-sm" />

            <div className="rounded-md border">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-7 gap-4">
                  {Array(7)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-4" />
                    ))}
                </div>
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="grid grid-cols-7 gap-4">
                      {Array(7)
                        .fill(0)
                        .map((_, j) => (
                          <Skeleton key={j} className="h-4" />
                        ))}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-9 w-32" />
        </CardFooter>
      </Card>
    </div>
  )
}
