"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fast-Moving Products</h1>
          <p className="text-muted-foreground">Analysis of top-selling products</p>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <h2 className="text-xl font-semibold">Something went wrong!</h2>
            <p className="text-muted-foreground max-w-md">
              {error.message || "An unexpected error occurred while loading the fast-moving products data."}
            </p>
            <Button onClick={reset} className="mt-2">
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
