import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileQuestion } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            Purchase Order Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The purchase order you're looking for doesn't exist or may have been deleted.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/dashboard/inbound" className="w-full">
            <Button className="w-full">Back to Inbound Management</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
