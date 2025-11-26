"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { DocumentUpload } from "./document-upload"
import { Check, ChevronsUpDown } from "lucide-react"
import { Command, CommandList, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface PaymentTransactionFormProps {
  initialData?: any
  isEditing?: boolean
  showDocumentUpload?: boolean
}

export function PaymentTransactionForm({
  initialData,
  isEditing = false,
  showDocumentUpload = false,
}: PaymentTransactionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [documentUrl, setDocumentUrl] = useState<string>(initialData?.doc_url || "")
  const [transactionType, setTransactionType] = useState(initialData?.transaction_type || "")
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orderSearchOpen, setOrderSearchOpen] = useState(false)

  useEffect(() => {
    async function fetchOrders() {
      if (transactionType === "customer_payment") {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("orders")
          .select("id, total_amount, customer_id, status, created_at")
          .order("created_at", { ascending: false })
          .limit(100)

        if (data && !error) {
          setOrders(data)
        } else {
          console.error("Error fetching orders:", error)
        }
      }
    }

    fetchOrders()
  }, [transactionType])

  const handleOrderSelect = async (orderId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (data && !error) {
      setSelectedOrder(data)
      // Auto-fill form fields based on the selected order
      const form = document.querySelector("form") as HTMLFormElement
      if (form) {
        const amountInput = form.elements.namedItem("amount") as HTMLInputElement
        if (amountInput) amountInput.value = data.total_amount

        // Set order_id in a hidden way that will be submitted with the form
        const orderIdInput = form.elements.namedItem("order_id") as HTMLInputElement
        if (orderIdInput) orderIdInput.value = data.id
      }
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const transactionTypeValue = formData.get("transaction_type") as string

      const transactionData: any = {
        transaction_type: transactionTypeValue,
        amount: Number.parseFloat(formData.get("amount") as string),
        currency: (formData.get("currency") as string) || "INR",
        payment_method: formData.get("payment_method") as string,
        reference_number: (formData.get("reference_number") as string) || null,
        description: (formData.get("description") as string) || null,
        status: formData.get("status") as string,
        payment_date: formData.get("payment_date") as string,
        doc_url: documentUrl || null,
      }

      // Handle party-specific fields based on transaction type to satisfy parties_check constraint
      if (transactionTypeValue === "customer_payment" || transactionTypeValue === "refund") {
        // For customer payments/refunds, we need customer_id and order_id
        const orderId = formData.get("order_id") as string
        if (orderId) {
          // Fetch the order to get customer_id
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .select("customer_id")
            .eq("id", orderId)
            .single()

          if (orderData && !orderError) {
            transactionData.customer_id = orderData.customer_id
            transactionData.order_id = orderId
          } else {
            throw new Error("Invalid order ID or order not found")
          }
        } else {
          throw new Error("Order ID is required for customer payments and refunds")
        }

        // Clear vendor-related fields
        transactionData.vendor_id = null
        transactionData.purchase_order_id = null
      } else if (transactionTypeValue === "to_vendor_payment" || transactionTypeValue === "expense") {
        // For vendor payments/expenses, we need vendor_id
        const vendorId = formData.get("vendor_id") as string
        if (!vendorId) {
          throw new Error("Vendor ID is required for vendor payments and expenses")
        }

        transactionData.vendor_id = vendorId
        transactionData.purchase_order_id = (formData.get("purchase_order_id") as string) || null

        // Clear customer-related fields
        transactionData.customer_id = null
        transactionData.order_id = null
      } else if (transactionTypeValue === "income" || transactionTypeValue === "adjustment") {
        // For income/adjustment, we can use either customer_id or vendor_id
        // Let's default to using vendor_id if provided, otherwise require customer_id
        const vendorId = formData.get("vendor_id") as string
        const customerId = formData.get("customer_id") as string

        if (vendorId) {
          transactionData.vendor_id = vendorId
          transactionData.customer_id = null
        } else if (customerId) {
          transactionData.customer_id = customerId
          transactionData.vendor_id = null
        } else {
          throw new Error("Either Vendor ID or Customer ID is required for income and adjustment transactions")
        }

        // Clear order-related fields
        transactionData.order_id = null
        transactionData.purchase_order_id = null
      }

      let result
      if (isEditing && initialData) {
        result = await supabase.from("payment_transactions").update(transactionData).eq("id", initialData.id)
      } else {
        result = await supabase.from("payment_transactions").insert([transactionData])
      }

      if (result.error) {
        throw result.error
      }

      // Show success toast
      toast({
        title: isEditing ? "Transaction Updated!" : "Transaction Created!",
        description: isEditing
          ? "The payment transaction has been updated successfully."
          : "The payment transaction has been created successfully.",
      })

      // Wait a moment for the toast to show, then redirect
      setTimeout(() => {
        router.push("/dashboard/payment-transactions")
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error("Error saving transaction:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save the payment transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="transaction_type">Transaction Type</Label>
          <Select
            name="transaction_type"
            defaultValue={initialData?.transaction_type}
            required
            onValueChange={setTransactionType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select transaction type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="to_vendor_payment">To Vendor Payment</SelectItem>
              <SelectItem value="customer_payment">Customer Payment</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {transactionType === "customer_payment" && (
          <div className="space-y-2">
            <Label htmlFor="order_id">Order</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Popover open={orderSearchOpen} onOpenChange={setOrderSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={orderSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedOrder ? `Order #${selectedOrder.id.slice(0, 8)}` : "Search orders..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search orders by ID or number..." />
                      <CommandList>
                        <CommandEmpty>No orders found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          {orders.map((order) => (
                            <CommandItem
                              key={order.id}
                              value={order.id}
                              onSelect={() => {
                                handleOrderSelect(order.id)
                                setOrderSearchOpen(false)
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedOrder?.id === order.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              Order #{order.id.slice(0, 8)} - ₹{order.total_amount} ({order.status})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Input
                id="order_id"
                name="order_id"
                placeholder="Or enter order ID manually"
                defaultValue={initialData?.order_id || selectedOrder?.id || ""}
                className="w-1/2"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            defaultValue={initialData?.amount}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select name="currency" defaultValue={initialData?.currency || "INR"}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method">Payment Method</Label>
          <Select name="payment_method" defaultValue={initialData?.payment_method} required>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="wallet">Wallet</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={initialData?.status || "pending"} required>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_date">Payment Date</Label>
          <Input
            id="payment_date"
            name="payment_date"
            type="datetime-local"
            defaultValue={
              initialData?.payment_date ? new Date(initialData.payment_date).toISOString().slice(0, 16) : ""
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendor_id">
            Vendor ID {(transactionType === "to_vendor_payment" || transactionType === "expense") && "(Required)"}
          </Label>
          <Input
            id="vendor_id"
            name="vendor_id"
            placeholder="Enter vendor ID"
            defaultValue={initialData?.vendor_id}
            required={transactionType === "to_vendor_payment" || transactionType === "expense"}
          />
        </div>

        {(transactionType === "income" || transactionType === "adjustment") && (
          <div className="space-y-2">
            <Label htmlFor="customer_id">Customer ID (Optional if Vendor ID provided)</Label>
            <Input
              id="customer_id"
              name="customer_id"
              placeholder="Enter customer ID"
              defaultValue={initialData?.customer_id}
            />
          </div>
        )}

        {(transactionType === "to_vendor_payment" || transactionType === "expense") && (
          <div className="space-y-2">
            <Label htmlFor="purchase_order_id">Purchase Order ID (Optional)</Label>
            <Input
              id="purchase_order_id"
              name="purchase_order_id"
              placeholder="Enter purchase order ID"
              defaultValue={initialData?.purchase_order_id}
            />
          </div>
        )}

        {transactionType === "refund" && !transactionType.includes("customer_payment") && (
          <div className="space-y-2">
            <Label htmlFor="order_id">Order ID (Required for Refunds)</Label>
            <Input
              id="order_id"
              name="order_id"
              placeholder="Enter order ID for refund"
              defaultValue={initialData?.order_id}
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reference_number">Reference Number</Label>
          <Input
            id="reference_number"
            name="reference_number"
            placeholder="Enter reference number"
            defaultValue={initialData?.reference_number}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Enter transaction description"
          defaultValue={initialData?.description}
          rows={3}
        />
      </div>

      {showDocumentUpload && <DocumentUpload onUploadComplete={setDocumentUrl} currentDocUrl={initialData?.doc_url} />}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></span>
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Update Transaction"
          ) : (
            "Create Transaction"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
