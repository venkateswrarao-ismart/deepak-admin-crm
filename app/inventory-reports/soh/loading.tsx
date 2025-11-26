import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SOHReportLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>

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
      </Card>
    </div>
  )
}
