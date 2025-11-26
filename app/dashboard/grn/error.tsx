"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("GRN page error:", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error Loading GRN Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            There was a problem loading the Goods Receipt Note details. This could be due to:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>The GRN may not exist</li>
            <li>You may not have permission to view this GRN</li>
            <li>There might be a temporary server issue</li>
          </ul>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/dashboard/grn">
            <Button variant="outline">Back to GRN List</Button>
          </Link>
          <Button onClick={reset}>Try Again</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
