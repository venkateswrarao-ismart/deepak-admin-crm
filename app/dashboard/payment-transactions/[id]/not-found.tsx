import Link from "next/link"
import { FileX } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TransactionNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <FileX className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Transaction Not Found</h1>
      <p className="text-muted-foreground mb-6">
        The transaction you are looking for does not exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/dashboard/payment-transactions">Return to Transactions</Link>
      </Button>
    </div>
  )
}
