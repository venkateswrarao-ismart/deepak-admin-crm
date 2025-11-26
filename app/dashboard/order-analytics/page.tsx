import { Suspense } from "react"
import OrderAnalyticsClient from "./order-analytics-client"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Order Analytics | iSmart Admin",
  description: "Analyze orders by date range and products",
}

export default function OrderAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Order Analytics</h1>
      </div>

      <Suspense fallback={<AnalyticsLoading />}>
        <OrderAnalyticsClient />
      </Suspense>
    </div>
  )
}

function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
      </div>

      <Skeleton className="h-[400px] w-full" />

      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
