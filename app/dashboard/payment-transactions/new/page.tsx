import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentTransactionForm } from "../_components/payment-transaction-form"

export default function NewPaymentTransactionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Payment Transaction</h1>
        <p className="text-muted-foreground">Create a new payment transaction record</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>Enter the details for the new payment transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentTransactionForm showDocumentUpload={true} />
        </CardContent>
      </Card>
    </div>
  )
}
