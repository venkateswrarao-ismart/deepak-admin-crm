import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CashOnDeliveryLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-80" />
          </div>

          <div>
            <Skeleton className="h-20 w-full" />
          </div>

          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  )
}
