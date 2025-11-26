"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient as createSupabaseClient } from "@/lib/supabase/client"

interface OrderStats {
  total: number
  pending: number
  confirmed: number
  reminder: number
  out_for_delivery: number
  delivered: number
  cancelled: number
}

interface OrderAnalyticsCardProps {
  initialOrderStats: OrderStats
}

export function OrderAnalyticsCard({ initialOrderStats }: OrderAnalyticsCardProps) {
  const [orderStats, setOrderStats] = useState<OrderStats>(initialOrderStats)
  const [isPending, startTransition] = useTransition()
  const supabase = createSupabaseClient()

  const refreshOrderStats = async () => {
    startTransition(async () => {
      try {
        const { data: orderStatusData, error } = await supabase.rpc("get_order_status_stats")

        if (error) {
          console.error("Error fetching order statistics:", error)
          return
        }

        if (orderStatusData) {
          const newStats = {
            total: orderStatusData.reduce((sum: number, row: any) => sum + Number(row.count), 0) || 0,
            pending: Number(orderStatusData.find((r: any) => r.status === "pending")?.count ?? 0),
            confirmed: Number(orderStatusData.find((r: any) => r.status === "confirmed")?.count ?? 0),
            reminder: Number(orderStatusData.find((r: any) => r.status === "reminder")?.count ?? 0),
            out_for_delivery: Number(orderStatusData.find((r: any) => r.status === "out_for_delivery")?.count ?? 0),
            delivered: Number(orderStatusData.find((r: any) => r.status === "delivered")?.count ?? 0),
            cancelled: Number(orderStatusData.find((r: any) => r.status === "cancelled")?.count ?? 0),
          }
          setOrderStats(newStats)
        }
      } catch (error) {
        console.error("Error refreshing order statistics:", error)
      }
    })
  }

  useEffect(() => {
    refreshOrderStats()
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div>
          <CardTitle>Customer orders Analytics</CardTitle>
          <CardDescription>Total Orders: {orderStats.total}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative w-[300px] h-[300px] mb-4">
            {/* Donut chart visualization - improved implementation */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {orderStats?.total > 0 && (
                <>
                  {/* Calculate the total percentage for each segment */}
                  {(() => {
                    // Calculate start and end angles for each segment
                    let currentAngle = 0
                    const segments = [
                      { status: "delivered", color: "rgb(34, 197, 94)" },
                      { status: "out_for_delivery", color: "rgb(59, 130, 246)" },
                      { status: "reminder", color: "rgb(168, 85, 247)" },
                      { status: "confirmed", color: "rgb(99, 102, 241)" },
                      { status: "pending", color: "rgb(245, 158, 11)" },
                      { status: "cancelled", color: "rgb(239, 68, 68)" },
                    ]

                    return segments.map((segment) => {
                      const count = orderStats[segment.status as keyof OrderStats] || 0
                      const percentage = count / orderStats.total

                      // Skip rendering if percentage is 0
                      if (percentage === 0) return null

                      // Calculate the angles
                      const startAngle = currentAngle
                      const angleSize = percentage * 2 * Math.PI
                      currentAngle += angleSize
                      const endAngle = currentAngle

                      // Calculate the SVG arc path - increased radius from 25 to 35 for wider donut
                      const x1 = 50 + 35 * Math.sin(startAngle)
                      const y1 = 50 - 35 * Math.cos(startAngle)
                      const x2 = 50 + 35 * Math.sin(endAngle)
                      const y2 = 50 - 35 * Math.cos(endAngle)

                      // Determine if the arc should be drawn the long way around
                      const largeArcFlag = angleSize > Math.PI ? 1 : 0

                      // Create the SVG path for the arc
                      const pathData = [
                        `M 50 50`,
                        `L ${x1} ${y1}`,
                        `A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Increased radius to 35
                        `Z`,
                      ].join(" ")

                      return <path key={segment.status} d={pathData} fill={segment.color} />
                    })
                  })()}
                </>
              )}
              {/* Inner white circle - reduced size to maintain donut width */}
              <circle cx="50" cy="50" r="18" fill="white" /> {/* Reduced from 20 to 15 */}
              {/* Display total count in the center */}
              <text
                x="50"
                y="50"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium"
                fill="#333"
              >
                {orderStats.total}
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Delivered</span>
              </div>
              <p className="text-lg font-bold">{orderStats?.delivered || 0}</p>
              <span className="text-xs text-muted-foreground">
                {orderStats.total > 0 ? ((orderStats.delivered / orderStats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm">Out For Delivery</span>
              </div>
              <p className="text-lg font-bold">{orderStats?.out_for_delivery || 0}</p>
              <span className="text-xs text-muted-foreground">
                {orderStats.total > 0 ? ((orderStats.out_for_delivery / orderStats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 w-full mt-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-sm">Reminder</span>
              </div>
              <p className="text-lg font-bold">{orderStats?.reminder || 0}</p>
              <span className="text-xs text-muted-foreground">
                {orderStats.total > 0 ? ((orderStats.reminder / orderStats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                <span className="text-sm">Confirmed</span>
              </div>
              <p className="text-lg font-bold">{orderStats?.confirmed || 0}</p>
              <span className="text-xs text-muted-foreground">
                {orderStats.total > 0 ? ((orderStats.confirmed / orderStats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                <span className="text-sm">Pending</span>
              </div>
              <p className="text-lg font-bold">{orderStats?.pending || 0}</p>
              <span className="text-xs text-muted-foreground">
                {orderStats.total > 0 ? ((orderStats.pending / orderStats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm">Cancelled</span>
              </div>
              <p className="text-lg font-bold">{orderStats?.cancelled || 0}</p>
              <span className="text-xs text-muted-foreground">
                {orderStats.total > 0 ? ((orderStats.cancelled / orderStats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
