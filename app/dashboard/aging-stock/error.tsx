"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aging Stock</h1>
          <p className="text-muted-foreground">Analysis of slow-moving inventory</p>
        </div>
      </div>
      <Card className="p-6">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p>An unexpected error occurred: {error.message || "Unknown error"}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => reset()} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => (window.location.href = "/dashboard/aging-stock")}>Reset Filters</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
