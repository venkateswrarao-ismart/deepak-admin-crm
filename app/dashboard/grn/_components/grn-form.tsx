"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface GRNFormProps {
  purchaseOrders?: { id: string; label: string; status?: string }[]
  selectedPO: any
}

export function GRNForm({ purchaseOrders, selectedPO }: GRNFormProps) {
  // Add this right after the GRNForm function declaration
  console.log("Purchase Orders received:", purchaseOrders)
  const [poId, setPoId] = useState(selectedPO?.id || "")
  const [poDetails, setPoDetails] = useState<any>(selectedPO)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingPO, setLoadingPO] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date())
  const [invoiceAmount, setInvoiceAmount] = useState("")
  const [availablePurchaseOrders, setAvailablePurchaseOrders] = useState<{ id: string; label: string }[]>([])
  const [loadingPurchaseOrders, setLoadingPurchaseOrders] = useState(false)
  const [productMap, setProductMap] = useState<Map<string, string>>(new Map())

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  // Add this calculation function
  const calculateTotals = () => {
    let subtotal = 0
    let tax = 0
    let total = 0

    items.forEach((item) => {
      const itemPrice = item.cost_price || 0
      const receivedQty = item.received_quantity || 0
      const itemSubtotal = itemPrice * receivedQty
      subtotal += itemSubtotal

      // Use item-specific GST percentage if available
      const gstPercentage = item.gst_percentage || 0
      const itemTax = itemSubtotal * (gstPercentage / 100)
      tax += itemTax
    })

    total = subtotal + tax

    return { subtotal, tax, total }
  }

  // Check if invoice amount matches calculated total
  const amountsMatch = () => {
    if (!invoiceAmount || invoiceAmount.trim() === "") return false

    const calculatedTotal = calculateTotals().total
    const invoiceAmountNum = Number.parseFloat(invoiceAmount)

    // Allow a small tolerance for rounding differences (0.01)
    return Math.abs(calculatedTotal - invoiceAmountNum) < 0.01
  }

  // Initialize items from selectedPO if available
  useEffect(() => {
    if (selectedPO && selectedPO.purchase_order_items) {
      const initialItems = selectedPO.purchase_order_items.map((item: any) => ({
        ...item,
        received_quantity: item.ordered_quantity,
        rejected_quantity: 0,
        notes: "",
      }))
      setItems(initialItems)
    }
  }, [selectedPO])

  // Handle PO selection change
  const handlePOChange = (value: string) => {
    setPoId(value)
    setPoDetails(null)
    setItems([])
    setError(null)

    if (value) {
      setLoadingPO(true)
      fetchPODetails(value)
    }
  }

  // Fetch purchase orders if not provided as props
  useEffect(() => {
    if (purchaseOrders && purchaseOrders.length > 0) {
      console.log("Using purchase orders from props:", purchaseOrders)
      setAvailablePurchaseOrders(purchaseOrders)
      return
    }

    async function fetchApprovedPurchaseOrders() {
      try {
        setLoadingPurchaseOrders(true)
        console.log("Fetching approved purchase orders...")

        const supabase = createSupabaseClient()
        const { data, error } = await supabase
          .from("purchase_orders")
          .select("id, vendor_name, created_at, po_status")
          .eq("po_status", "Approved")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching purchase orders:", error)
          toast({
            title: "Error",
            description: "Failed to load purchase orders. Please try again.",
            variant: "destructive",
          })
          return
        }

        console.log("Fetched purchase orders:", data)

        if (data && data.length > 0) {
          const formattedPOs = data.map((po) => ({
            id: po.id,
            label: `PO #${po.id} - ${po.vendor_name || "Unknown Vendor"} (${new Date(po.created_at).toLocaleDateString()})`,
            status: po.po_status,
          }))
          setAvailablePurchaseOrders(formattedPOs)
        } else {
          setAvailablePurchaseOrders([])
        }
      } catch (err) {
        console.error("Exception in fetchApprovedPurchaseOrders:", err)
      } finally {
        setLoadingPurchaseOrders(false)
      }
    }

    fetchApprovedPurchaseOrders()
  }, [purchaseOrders, toast])

  // // Fetch product IDs for articles
  // const fetchProductIdsForArticles = async (articleIds: string[]) => {
  //   try {
  //     if (!articleIds || articleIds.length === 0) return

  //     // Fetch products that match these article IDs
  //     const { data: products, error } = await supabase.from("products").select("id, name").in("id", articleIds)

  //     if (error) {
  //       console.error("Error fetching product IDs:", error)
  //       return
  //     }

  //     // Create a mapping of article ID to product ID
  //     const newProductMap = new Map<string, string>()
  //     if (products && products.length > 0) {
  //       products.forEach((product) => {
  //         newProductMap.set(product.id, product.id)
  //       })
  //     }

  //     setProductMap(newProductMap)
  //     console.log("Product mapping created:", Object.fromEntries(newProductMap))
  //   } catch (err) {
  //     console.error("Error in fetchProductIdsForArticles:", err)
  //   }
  // }

  // Fetch PO details with improved error handling
  const fetchPODetails = async (id: string) => {
    try {
      console.log(`Fetching details for PO: ${id}`)

      // Check if the PO exists first
      const { count, error: countError } = await supabase
        .from("purchase_orders")
        .select("*", { count: "exact", head: true })
        .eq("id", id)

      if (countError) {
        console.error("Error checking if PO exists:", countError)
        setError("Could not verify purchase order exists.")
        setLoadingPO(false)
        return
      }

      if (count === 0) {
        setError(`Purchase order with ID ${id} not found.`)
        setLoadingPO(false)
        return
      }

      // Fetch the PO without using .single()
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .select("*, vendors(id, name)")
        .eq("id", id)

      if (poError || !poData || poData.length === 0) {
        console.error("Error fetching PO details:", poError)
        setError("Could not load purchase order details. Please try again.")
        setLoadingPO(false)
        return
      }

      const po = poData[0]
      console.log("Fetched PO details:", po)

      // Fetch PO items from purchase_order_itemstwo table with the updated schema fields
      const { data: poItems, error: itemsError } = await supabase
        .from("purchase_order_itemstwo")
        .select(
          "id, po_id, article_id, article_code, article_text, cost_price, mrp, ordered_quantity, received_quantity, uom, gst_percentage",
        )
        .eq("po_id", id)

      if (itemsError) {
        console.error("Error fetching PO items from purchase_order_itemstwo:", itemsError)
        setError("Could not load purchase order items. Please try again.")
        setLoadingPO(false)
        return
      }

      console.log("Fetched PO items from purchase_order_itemstwo:", poItems)

      // Fetch product details for each item
      if (poItems && poItems.length > 0) {
        const articleIds = poItems.map((item) => item.article_id).filter((id) => id)

        // Fetch articles to get their names from products table
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("article_id, name")
          .in("article_id", articleIds)

        if (productsError) {
          console.error("Error fetching products:", productsError)
        }

        console.log("Fetched products:", products)

        // Create a map of article IDs to names
        const articleMap = new Map()
        if (products) {
          products.forEach((product) => {
            articleMap.set(product.article_id, product.name)
          })
        }

        // Create enhanced items with article names
        const enhancedItems = poItems.map((item) => ({
          ...item,
          article_text: item.article_text || articleMap.get(item.article_id) || "Unknown Article",
          received_quantity: item.received_quantity || item.ordered_quantity,
          rejected_quantity: 0,
          notes: "",
        }))

        console.log("Enhanced items:", enhancedItems)

        // Set items state
        setItems(enhancedItems)

        // Set PO details
        setPoDetails({
          ...po,
          purchase_order_items: enhancedItems,
        })
      } else {
        setItems([])
        setPoDetails({
          ...po,
          purchase_order_items: [],
        })
      }
    } catch (err: any) {
      console.error("Exception in fetchPODetails:", err)
      setError(err.message || "An error occurred while loading purchase order details.")
    } finally {
      setLoadingPO(false)
    }
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

    if (!poId) {
      toast({
        title: "Missing purchase order",
        description: "Please select a purchase order first.",
        variant: "destructive",
      })
      return
    }

    if (!poDetails) {
      toast({
        title: "Purchase order details not loaded",
        description: "Please wait for the purchase order details to load or try selecting again.",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "No items found",
        description: "This purchase order has no items to receive.",
        variant: "destructive",
      })
      return
    }

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
      console.log("Creating GRN with the following data:", {
        po_id: poId,
        items: items.length,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        invoice_amount: Number.parseFloat(invoiceAmount),
      })

      // Determine GRN status based on received quantities
      const allReceived = items.every(
        (item) => item.received_quantity === item.ordered_quantity && item.rejected_quantity === 0,
      )
      const status = "Received"

      // Create GRN with invoice details
      const { data: grn, error: grnError } = await supabase
        .from("goods_receipt_notes")
        .insert({
          po_id: poId,
          received_date: new Date().toISOString(),
          status: status,
          notes: notes,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate?.toISOString(),
          invoice_amount: Number.parseFloat(invoiceAmount),
        })
        .select()

      if (grnError) {
        console.error("Error creating GRN:", grnError)
        throw new Error(`Failed to create GRN: ${grnError.message}`)
      }

      if (!grn || grn.length === 0) {
        throw new Error("Failed to create GRN: No data returned")
      }

      const grnId = grn[0].id
      console.log(`GRN created with ID: ${grnId}`)

      // Create GRN items - using article_id column as per the actual database schema
      const grnItems = items.map((item) => ({
        grn_id: grnId,
        po_item_id: Number.parseInt(item.id.toString()), // Convert to integer as per schema
        article_id: item.article_id,
        ordered_quantity: item.ordered_quantity,
        received_quantity: item.received_quantity,
        rejected_quantity: item.rejected_quantity || 0,
        unit_price: item.cost_price,
        notes: item.notes,
      }))

      console.log(`Creating ${grnItems.length} GRN items:`, grnItems)
      const { error: itemsError } = await supabase.from("grn_itemstwo").insert(grnItems)

      if (itemsError) {
        console.error("Error creating GRN items:", itemsError)
        throw new Error(`Failed to create GRN items: ${itemsError.message}`)
      }

      // Update product stock quantities based on received items
      console.log("Updating product stock quantities...")
      for (const item of items) {
        if (item.article_id && item.received_quantity > 0) {
          // Get current stock quantity
          const { data: productData, error: productError } = await supabase
            .from("products")
            .select("stock")
            .eq("article_id", item.article_id)
            .single()

          if (productError) {
            console.error(`Error fetching product with article_id ${item.article_id}:`, productError)
            continue // Skip to next item if there's an error
          }

          if (!productData) {
            console.warn(`No product found with article_id ${item.article_id}`)
            continue // Skip to next item if product not found
          }

          const currentStock = productData.stock || 0
          const newStock = currentStock + item.received_quantity

          console.log(
            `Updating stock for article_id ${item.article_id}: ${currentStock} + ${item.received_quantity} = ${newStock}`,
          )

          // Update the stock quantity
          const { error: updateError } = await supabase
            .from("products")
            .update({ stock: newStock, updated_at: new Date().toISOString() })
            .eq("article_id", item.article_id)

          if (updateError) {
            console.error(`Error updating stock for article_id ${item.article_id}:`, updateError)
          }
        }
      }

      // Update PO status to Completed if all items received
      if (allReceived) {
        console.log(`Updating PO ${poId} status to Completed`)
        await supabase.from("purchase_orders").update({ inbound_status: "Completed" }).eq("id", poId)
      }

      toast({
        title: "GRN created",
        description: "The goods receipt note has been created successfully.",
      })

      router.push(`/dashboard/grn/${grnId}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error in GRN creation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create GRN",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {poDetails && !loadingPO && invoiceAmount && !amountsMatch() && (
            <Alert variant="warning" className="bg-amber-50 border-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Amount Mismatch</AlertTitle>
              <AlertDescription className="text-amber-700">
                The invoice amount (₹{Number.parseFloat(invoiceAmount).toFixed(2)}) does not match the calculated total
                (₹
                {calculateTotals().total.toFixed(2)}). These amounts must match to create a GRN.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="po">Purchase Order (Approved Only)</Label>
            <Select value={poId} onValueChange={handlePOChange} disabled={!!selectedPO || loadingPO}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingPurchaseOrders ? "Loading purchase orders..." : "Select an approved purchase order"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {loadingPurchaseOrders ? (
                  <div className="p-2 text-center text-muted-foreground">Loading purchase orders...</div>
                ) : availablePurchaseOrders.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">No approved purchase orders found</div>
                ) : (
                  availablePurchaseOrders.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {loadingPurchaseOrders
                ? "Loading purchase orders..."
                : availablePurchaseOrders.length === 0
                  ? "No approved purchase orders found. Please create and approve purchase orders first."
                  : "Only approved purchase orders can be used to create GRNs"}
            </p>
          </div>

          {loadingPO && <div className="text-center py-4 text-muted-foreground">Loading purchase order details...</div>}

          {poDetails && !loadingPO && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-md">
                <div>
                  <Label className="text-sm text-muted-foreground">Vendor</Label>
                  <p className="font-medium">{poDetails.vendors?.name || poDetails.vendor_name || "Unknown Vendor"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">PO Date</Label>
                  <p className="font-medium">{new Date(poDetails.created_at).toLocaleDateString()}</p>
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

              <div className="space-y-2">
                <Label>Receipt Items</Label>
                {items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Article ID</TableHead>
                        <TableHead className="text-right">Cost Price</TableHead>
                        <TableHead className="text-right">Ordered Qty</TableHead>
                        <TableHead className="text-right">Received Qty</TableHead>
                        <TableHead className="text-right">Rejected Qty</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.article_text || "Unknown Article"}</TableCell>
                          <TableCell>{item.article_id || "N/A"}</TableCell>
                          <TableCell className="text-right">₹{Number.parseFloat(item.cost_price).toFixed(2)}</TableCell>
                          <TableCell className="text-right">{item.ordered_quantity}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              max={item.ordered_quantity - (item.rejected_quantity || 0)}
                              value={
                                item.received_quantity === undefined || item.received_quantity === null
                                  ? ""
                                  : item.received_quantity
                              }
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.id,
                                  "received_quantity",
                                  e.target.value === "" ? 0 : Number.parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-20 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              max={item.ordered_quantity - (item.received_quantity || 0)}
                              value={item.rejected_quantity || ""}
                              placeholder="0"
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.id,
                                  "rejected_quantity",
                                  e.target.value === "" ? 0 : Number.parseInt(e.target.value) || 0,
                                )
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
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No items found for this purchase order in purchase_order_itemstwo table.
                  </div>
                )}
              </div>

              <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                <h3 className="text-lg font-medium mb-3">Calculated Amount</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Subtotal</Label>
                    <div className="p-2 bg-background rounded border mt-1">
                      ₹{calculateTotals().subtotal.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <Label>Tax (GST)</Label>
                    <div className="p-2 bg-background rounded border mt-1">₹{calculateTotals().tax.toFixed(2)}</div>
                  </div>
                  <div>
                    <Label>Total Amount</Label>
                    <div
                      className={cn(
                        "p-2 bg-background rounded border mt-1 font-medium",
                        invoiceAmount && !amountsMatch() ? "border-amber-500 text-amber-700" : "",
                      )}
                    >
                      ₹{calculateTotals().total.toFixed(2)}
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
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/grn")}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || loadingPO || !poDetails || items.length === 0 || (invoiceAmount && !amountsMatch())}
            className={items.length > 0 ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {loading
              ? "Creating..."
              : loadingPO
                ? "Loading PO..."
                : !poDetails
                  ? "Select PO First"
                  : items.length === 0
                    ? "No Items Available"
                    : invoiceAmount && !amountsMatch()
                      ? "Amounts Must Match"
                      : "Create GRN"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
