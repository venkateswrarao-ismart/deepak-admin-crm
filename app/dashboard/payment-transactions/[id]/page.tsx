"use client"

import { useEffect, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  User,
  Building,
  CreditCard,
  Hash,
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { PrintReceiptButton } from "./print-receipt-button"
import { DocumentUpload } from "../_components/document-upload"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/hooks/use-toast"

function DocumentUploadSection({ transactionId, currentDocUrl }: { transactionId: string; currentDocUrl?: string }) {
  const [docUrl, setDocUrl] = useState(currentDocUrl || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const handleDocumentUpdate = async (newDocUrl: string) => {
    setIsUpdating(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("payment_transactions")
        .update({ doc_url: newDocUrl || null })
        .eq("id", transactionId)

      if (error) throw error

      setDocUrl(newDocUrl)
      toast({
        title: "Document updated",
        description: newDocUrl ? "Document has been uploaded successfully." : "Document has been removed.",
      })

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error("Error updating document:", error)
      toast({
        title: "Update failed",
        description: "Failed to update document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Supporting Document</p>
      {isUpdating && <div className="text-sm text-muted-foreground">Updating document...</div>}
      <DocumentUpload onUploadComplete={handleDocumentUpdate} currentDocUrl={docUrl} />
      {docUrl && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-md mt-2">
          <div className="flex items-center">
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Current Document</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" asChild>
              <a href={docUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View
              </a>
            </Button>
            {/* <Button variant="outline" size="sm" asChild>
              <a href={docUrl} download>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button> */}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TransactionDetailsPage({ params }: { params: { id: string } }) {
  const [transaction, setTransaction] = useState<any>(null)
  const [relatedOrder, setRelatedOrder] = useState<any>(null)
  const [relatedPurchaseOrder, setRelatedPurchaseOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        setLoading(true)

        // Fetch transaction details
        const { data: transactionData, error: transactionError } = await supabase
          .from("payment_transactions")
          .select(`
            *,
            vendors (*),
            profiles:customer_id (*)
          `)
          .eq("id", params.id)
          .single()

        if (transactionError || !transactionData) {
          console.error("Error fetching transaction:", transactionError)
          setError("Transaction not found")
          return
        }

        setTransaction(transactionData)

        // Fetch related order if available
        if (transactionData.order_id) {
          const { data: orderData } = await supabase
            .from("orders")
            .select("*")
            .eq("id", transactionData.order_id)
            .single()
          setRelatedOrder(orderData)
        }

        // Fetch related purchase order if available
        if (transactionData.purchase_order_id) {
          const { data: purchaseOrderData } = await supabase
            .from("purchase_orders")
            .select("*")
            .eq("id", transactionData.purchase_order_id)
            .single()
          setRelatedPurchaseOrder(purchaseOrderData)
        }
      } catch (err) {
        console.error("Error fetching transaction details:", err)
        setError("Failed to load transaction details")
      } finally {
        setLoading(false)
      }
    }

    fetchTransactionDetails()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
      </div>
    )
  }

  if (error || !transaction) {
    notFound()
  }

  // Format dates
  const paymentDate = new Date(transaction.payment_date)
  const createdAt = new Date(transaction.created_at)
  const processedAt = transaction.processed_at ? new Date(transaction.processed_at) : null

  // Get status color
  const getStatusColor = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
      refunded: "bg-purple-100 text-purple-800",
    }
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
  }

  // Get transaction type color
  const getTypeColor = (type: string) => {
    const typeColors = {
      to_vendor_payment: "bg-red-100 text-red-800",
      customer_payment: "bg-green-100 text-green-800",
      expense: "bg-orange-100 text-orange-800",
      income: "bg-blue-100 text-blue-800",
      refund: "bg-purple-100 text-purple-800",
      adjustment: "bg-gray-100 text-gray-800",
    }
    return typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/payment-transactions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transactions
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Transaction Details</h1>
          <Badge className={getStatusColor(transaction.status)}>{transaction.status.toUpperCase()}</Badge>
        </div>
        <div className="flex space-x-2">
          {transaction.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const supabase = createClient()
                  const { error } = await supabase
                    .from("payment_transactions")
                    .update({
                      status: "completed",
                      processed_at: new Date().toISOString(),
                    })
                    .eq("id", transaction.id)

                  if (error) throw error

                  toast({
                    title: "Transaction updated",
                    description: "Transaction has been marked as completed.",
                  })

                  // Update local state to reflect changes
                  setTransaction({
                    ...transaction,
                    status: "completed",
                    processed_at: new Date().toISOString(),
                  })
                } catch (error) {
                  console.error("Error updating transaction:", error)
                  toast({
                    title: "Update failed",
                    description: "Failed to update transaction status. Please try again.",
                    variant: "destructive",
                  })
                }
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Completed
            </Button>
          )}
          <PrintReceiptButton transaction={transaction} paymentDate={paymentDate} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Transaction Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Transaction Information</CardTitle>
            <CardDescription>Details about transaction {transaction.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                <p className="font-medium">{transaction.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(transaction.amount, transaction.currency)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Transaction Type</p>
                <Badge className={getTypeColor(transaction.transaction_type)}>
                  {transaction.transaction_type.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{transaction.payment_method.replace("_", " ").toUpperCase()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{format(paymentDate, "PPP")}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Reference Number</p>
                <div className="flex items-center">
                  <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{transaction.reference_number || "—"}</span>
                </div>
              </div>
            </div>

            {transaction.description && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p>{transaction.description}</p>
                </div>
              </>
            )}

            {/* Related Orders */}
            {(relatedOrder || relatedPurchaseOrder) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Related Documents</p>
                  {relatedOrder && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Order #{relatedOrder.id}</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/orders/${relatedOrder.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Order
                        </Link>
                      </Button>
                    </div>
                  )}
                  {relatedPurchaseOrder && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Purchase Order #{relatedPurchaseOrder.id}</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/purchase-orders/${relatedPurchaseOrder.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Purchase Order
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Document Upload Section */}
            <Separator />
            <DocumentUploadSection transactionId={transaction.id} currentDocUrl={transaction.doc_url} />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Party Information */}
          <Card>
            <CardHeader>
              <CardTitle>{transaction.transaction_type === "customer_payment" ? "Customer" : "Vendor"}</CardTitle>
            </CardHeader>
            <CardContent>
              {transaction.vendor_id && transaction.vendors ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{transaction.vendors.name}</span>
                  </div>
                  {transaction.vendors.vendor_code && (
                    <div className="flex items-center">
                      <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{transaction.vendors.vendor_code}</span>
                    </div>
                  )}
                  {transaction.vendors.contact_number && (
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{transaction.vendors.contact_number}</span>
                    </div>
                  )}
                  {transaction.vendors.email && (
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{transaction.vendors.email}</span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/vendors/view/${transaction.vendor_id}`}>View Vendor Profile</Link>
                  </Button>
                </div>
              ) : transaction.customer_id && transaction.profiles ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{transaction.profiles.full_name || "Customer"}</span>
                  </div>
                  {transaction.profiles.email && (
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{transaction.profiles.email}</span>
                    </div>
                  )}
                  {transaction.profiles.phone && (
                    <div className="flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{transaction.profiles.phone}</span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/customers/${transaction.customer_id}`}>View Customer Profile</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-muted-foreground">No party information available</div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    <div className="bg-blue-500 rounded-full p-1">
                      <Clock className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Transaction Created</p>
                    <p className="text-xs text-muted-foreground">{format(createdAt, "PPP p")}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    <div className="bg-green-500 rounded-full p-1">
                      <Calendar className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Payment Date</p>
                    <p className="text-xs text-muted-foreground">{format(paymentDate, "PPP p")}</p>
                  </div>
                </div>

                {processedAt ? (
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      <div className="bg-green-500 rounded-full p-1">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Processed</p>
                      <p className="text-xs text-muted-foreground">{format(processedAt, "PPP p")}</p>
                    </div>
                  </div>
                ) : transaction.status === "pending" ? (
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      <div className="bg-yellow-500 rounded-full p-1">
                        <AlertCircle className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Awaiting Processing</p>
                      <p className="text-xs text-muted-foreground">Transaction is pending</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
