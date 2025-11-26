import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function VarianceReportLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Variances</TabsTrigger>
          <TabsTrigger value="positive">Positive Variances</TabsTrigger>
          <TabsTrigger value="negative">Negative Variances</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72 mt-1" />
              </div>
              <Skeleton className="h-9 w-36" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-[180px]" />
                </div>

                <div className="rounded-md border">
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-8 gap-4">
                      {Array(8)
                        .fill(0)
                        .map((_, i) => (
                          <Skeleton key={i} className="h-4" />
                        ))}
                    </div>
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="grid grid-cols-8 gap-4">
                          {Array(8)
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
