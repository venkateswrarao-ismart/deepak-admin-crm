"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface GRNEditFormProps {
  grn: any
  purchaseOrder: any
  grnItems: any[]
  articleDetails: Record<string, any>
}

export default function GRNEditForm({ grn, purchaseOrder, grnItems, articleDetails }: GRNEditFormProps) {
  const [notes, setNotes] = useState(grn.notes || "")
  const [invoiceNumber, setInvoiceNumber] = useState(grn.invoice_number || "")
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(
    grn.invoice_date ? new Date(grn.invoice_date) : new Date(),
  )
  const [invoiceAmount, setInvoiceAmount] = useState(grn.invoice_amount?.toString() || "")
  const [items, setItems] = useState(
    grnItems.map((item) => ({
      ...item,
      article_name: articleDetails[item.article_id]?.name || "Unknown Article",
    })),
  )
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  // Calculate totals based on received quantities and unit prices
  const calculateTotals = () => {
    let subtotal = 0
    let tax = 0
    let total = 0

    items.forEach((item) => {
      const itemPrice = item.unit_price || 0
      const receivedQty = item.received_quantity || 0
      const itemSubtotal = itemPrice * receivedQty
      subtotal += itemSubtotal
    })

    // Use the GST percentage from the purchase order if available
    const gstPercentage = purchaseOrder?.gst_percentage || 18
    tax = subtotal * (gstPercentage / 100)
    total = subtotal + tax

    return { subtotal, tax, total, gstPercentage }
  }

  // Check if invoice amount matches calculated total
  const amountsMatch = () => {
    if (!invoiceAmount || invoiceAmount.trim() === "") return false

    const calculatedTotal = calculateTotals().total
    const invoiceAmountNum = Number.parseFloat(invoiceAmount)

    // Allow a small tolerance for rounding differences (0.01)
    return Math.abs(calculatedTotal - invoiceAmountNum) < 0.01
  }

  const handleQuantityChange = (id: string, field: string, value: number) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [field]: value }

          // Ensure rejected_quantity doesn't exceed ordered_quantity
          if (field === "rejected_quantity" && value > item.ordered_quantity) {
            newItem.rejected_quantity = item.ordered_quantity
          }

          // Ensure received_quantity + rejected_quantity doesn't exceed ordered_quantity
          if (field === "received_quantity") {
            const total = value + (item.rejected_quantity || 0)
            if (total > item.ordered_quantity) {
              newItem.received_quantity = item.ordered_quantity - (item.rejected_quantity || 0)
            }
          }

          return newItem
        }
        return item
      }),
    )
  }

  const handleItemNoteChange = (id: string, value: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          return { ...item, notes: value }
        }
        return item
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!invoiceNumber.trim()) {
      toast({
        title: "Missing invoice number",
        description: "Please enter the vendor's invoice number.",
        variant: "destructive",
      })
      return
    }

    if (!invoiceAmount.trim()) {
      toast({
        title: "Missing invoice amount",
        description: "Please enter the invoice amount.",
        variant: "destructive",
      })
      return
    }

    if (!amountsMatch()) {
      toast({
        title: "Amount mismatch",
        description: "The invoice amount must match the calculated total amount.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Update the GRN
      const { error: grnError } = await supabase
        .from("goods_receipt_notes")
        .update({
          notes: notes,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate?.toISOString(),
          invoice_amount: Number.parseFloat(invoiceAmount),
        })
        .eq("id", grn.id)

      if (grnError) {
        throw new Error(`Failed to update GRN: ${grnError.message}`)
      }

      // Update GRN items
      for (const item of items) {
        const { error: itemError } = await supabase
          .from("grn_items")
          .update({
            received_quantity: item.received_quantity,
            rejected_quantity: item.rejected_quantity || 0,
            notes: item.notes,
          })
          .eq("id", item.id)

        if (itemError) {
          throw new Error(`Failed to update GRN item: ${itemError.message}`)
        }
      }

      toast({
        title: "GRN updated",
        description: "The goods receipt note has been updated successfully.",
      })

      router.push(`/dashboard/grn/${grn.id}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error updating GRN:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update GRN",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, tax, total, gstPercentage } = calculateTotals()

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-md">
            <div>
              <Label className="text-sm text-muted-foreground">Purchase Order</Label>
              <p className="font-medium">{grn.po_id}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Vendor</Label>
              <p className="font-medium">
                {purchaseOrder?.vendors?.name || purchaseOrder?.vendor_name || "Unknown Vendor"}
              </p>
            </div>
          </div>

          <div className="space-y-4 p-4 bg-muted/20 rounded-md border">
            <h3 className="font-medium">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice-number">Invoice Number</Label>
                <Input
                  id="invoice-number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice-date">Invoice Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !invoiceDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={invoiceDate} onSelect={setInvoiceDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice-amount">Invoice Amount</Label>
                <Input
                  id="invoice-amount"
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className={cn(
                    "text-right",
                    invoiceAmount && !amountsMatch() ? "border-amber-500 focus-visible:ring-amber-500" : "",
                  )}
                />
              </div>
            </div>
          </div>

          {invoiceAmount && !amountsMatch() && (
            <Alert variant="warning" className="bg-amber-50 border-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Amount Mismatch</AlertTitle>
              <AlertDescription className="text-amber-700">
                The invoice amount (₹{Number.parseFloat(invoiceAmount).toFixed(2)}) does not match the calculated total
                (₹
                {total.toFixed(2)}). These amounts must match to update the GRN.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Receipt Items</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Article ID</TableHead>
                  <TableHead className="text-right">Ordered quantity</TableHead>
                  <TableHead className="text-right">Received quantity</TableHead>
                  <TableHead className="text-right">Rejected quantity</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.article_name}</TableCell>
                    <TableCell>{item.article_id}</TableCell>
                    <TableCell className="text-right">{item.ordered_quantity}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        max={item.ordered_quantity - (item.rejected_quantity || 0)}
                        value={item.received_quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, "received_quantity", Number.parseInt(e.target.value) || 0)
                        }
                        className="w-20 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        max={item.ordered_quantity - (item.received_quantity || 0)}
                        value={item.rejected_quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, "rejected_quantity", Number.parseInt(e.target.value) || 0)
                        }
                        className="w-20 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.notes}
                        onChange={(e) => handleItemNoteChange(item.id, e.target.value)}
                        placeholder="Reason for rejection, etc."
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <h3 className="text-lg font-medium mb-3">Calculated Amount</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Subtotal</Label>
                <div className="p-2 bg-background rounded border mt-1">₹{subtotal.toFixed(2)}</div>
              </div>
              <div>
                <Label>Tax ({gstPercentage}% GST)</Label>
                <div className="p-2 bg-background rounded border mt-1">₹{tax.toFixed(2)}</div>
              </div>
              <div>
                <Label>Total Amount</Label>
                <div
                  className={cn(
                    "p-2 bg-background rounded border mt-1 font-medium",
                    invoiceAmount && !amountsMatch() ? "border-amber-500 text-amber-700" : "",
                  )}
                >
                  ₹{total.toFixed(2)}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              *This amount is calculated based on the received quantities and item prices.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional information about this receipt..."
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/grn/${grn.id}`)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || (invoiceAmount && !amountsMatch())}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Updating..." : "Update GRN"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
