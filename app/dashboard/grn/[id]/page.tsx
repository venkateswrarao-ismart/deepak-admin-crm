import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import GRNEditForm from "../_components/grn-edit-form"
import { GRNForm } from "../_components/grn-form"

interface GRNPageProps {
  params: {
    id: string
  }
  searchParams: {
    edit?: string
    po?: string
  }
}

export default async function GRNPage({ params, searchParams }: GRNPageProps) {
  const supabase = createSupabaseServerClient()

  // Handle the "new" route directly
  if (params.id === "new") {
    // Fetch purchase orders for dropdown
    try {
      const { data: purchaseOrders, error } = await supabase
        .from("purchase_orders")
        .select("id, vendors(name)")
        .eq("inbound_status", "Delivered")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching purchase orders:", error)
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Create Goods Receipt Note</h1>
            <p className="text-red-500">Failed to load purchase orders. Please try again later.</p>
          </div>
        )
      }

      // If PO is provided in search params, fetch its details
      let selectedPO = null
      if (searchParams.po) {
        try {
          // Check if the PO exists
          const { count } = await supabase
            .from("purchase_orders")
            .select("*", { count: "exact", head: true })
            .eq("id", searchParams.po)

          if (count > 0) {
            // Fetch the PO details
            const { data: po } = await supabase
              .from("purchase_orders")
              .select(`
                *,
                vendors (
                  id, name, contact_number, email, address
                )
              `)
              .eq("id", searchParams.po)
              .limit(1)

            if (po && po.length > 0) {
              // Fetch PO items
              const { data: poItems } = await supabase
                .from("purchase_order_items")
                .select(`
                  id, article_id, ordered_quantity, cost_price,
                  articles (
                    id, name, unit_of_measurement
                  )
                `)
                .eq("po_id", searchParams.po)

              selectedPO = {
                ...po[0],
                purchase_order_items: poItems || [],
              }
            }
          }
        } catch (error) {
          console.error("Error fetching selected PO:", error)
        }
      }

      const formattedPOs =
        purchaseOrders?.map((po) => ({
          id: po.id,
          label: `PO: ${po.id} - ${po.vendors?.name || "Unknown Vendor"}`,
        })) || []

      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Create Goods Receipt Note</h1>
          <p className="text-muted-foreground">Record the receipt of goods from vendors.</p>
          <GRNForm purchaseOrders={formattedPOs} selectedPO={selectedPO} />
        </div>
      )
    } catch (error) {
      console.error("Error in NewGRNPage:", error)
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Create Goods Receipt Note</h1>
          <p className="text-red-500">An unexpected error occurred. Please try again later.</p>
        </div>
      )
    }
  }

  // For existing GRN records, continue with the original code
  try {
    const { data: grn, error: grnError } = await supabase
      .from("goods_receipt_notes")
      .select("*")
      .eq("id", params.id)
      .single()

    if (grnError) {
      console.error(grnError)
      notFound()
    }

    if (!grn) {
      notFound()
    }

    // Fetching from grn_itemstwo table as per updated schema
    const { data: grnItems, error: grnItemsError } = await supabase
      .from("grn_itemstwo")
      .select("*")
      .eq("grn_id", grn.id)

    if (grnItemsError) {
      console.error("Error fetching from grn_itemstwo:", grnItemsError)
    }

    const { data: purchaseOrder, error: purchaseOrderError } = await supabase
      .from("purchase_orders")
      .select("*, vendors(name)")
      .eq("id", grn.po_id)
      .single()

    if (purchaseOrderError) {
      console.error(purchaseOrderError)
    }

    const articleIds = grnItems?.map((item) => item.article_id) || []

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .in("article_id", articleIds)

    if (productsError) {
      console.error("Error fetching products:", productsError)
    }

    const articleDetails = new Map(products?.map((product) => [product.article_id, product]))

    // Check if we're in edit mode
    const isEditMode = searchParams.edit === "true"

    if (isEditMode) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/grn/${params.id}`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Edit Goods Receipt Note</h1>
          </div>

          <GRNEditForm
            grn={grn}
            purchaseOrder={purchaseOrder}
            grnItems={grnItems || []}
            articleDetails={Object.fromEntries(articleDetails)}
          />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/grn">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Goods Receipt Note Details</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>GRN: {grn.id}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={grn.status === "Received" ? "default" : "secondary"}>{grn.status || "Pending"}</Badge>
                {/* <Link href={`/dashboard/grn/${grn.id}?edit=true`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit GRN
                  </Button>
                </Link>*/}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Purchase Order</h3>
                <p className="text-lg">{grn.po_id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Vendor</h3>
                <p className="text-lg">
                  {purchaseOrder?.vendors?.name || purchaseOrder?.vendor_name || "Unknown Vendor"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Receipt Date</h3>
                <p className="text-lg">{formatDate(grn.received_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created On</h3>
                <p className="text-lg">{formatDate(grn.created_at)}</p>
              </div>
              {/* Display invoice details if available */}
              {grn.invoice_number && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Invoice Number</h3>
                  <p className="text-lg">{grn.invoice_number}</p>
                </div>
              )}
              {grn.invoice_date && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Invoice Date</h3>
                  <p className="text-lg">{formatDate(grn.invoice_date)}</p>
                </div>
              )}
              {grn.invoice_amount && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Invoice Amount</h3>
                  <p className="text-lg">₹{Number.parseFloat(String(grn.invoice_amount)).toFixed(2)}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Received Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead>Article ID</TableHead>
                    <TableHead className="text-right">Ordered quantity</TableHead>
                    <TableHead className="text-right">Received quantity</TableHead>
                    <TableHead className="text-right">Rejected quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">GST %</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grnItems && grnItems.length > 0 ? (
                    grnItems.map((item) => {
                      const article = articleDetails.get(item.article_id)
                      const gstPercentage = article?.gst_percentage || 0
                      const itemSubtotal = (item.unit_price || 0) * item.received_quantity
                      const itemGstAmount = itemSubtotal * (gstPercentage / 100)
                      const itemTotal = itemSubtotal + itemGstAmount

                      return (
                        <TableRow key={item.id}>
                          <TableCell>{article?.name || "Unknown Article"}</TableCell>
                          <TableCell>{item.article_id}</TableCell>
                          <TableCell className="text-right">{item.ordered_quantity}</TableCell>
                          <TableCell className="text-right">{item.received_quantity}</TableCell>
                          <TableCell className="text-right">{item.rejected_quantity || 0}</TableCell>
                          <TableCell className="text-right">₹{item.unit_price?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell className="text-right">{gstPercentage}%</TableCell>
                          <TableCell className="text-right">₹{itemTotal.toFixed(2)}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No items found for this GRN
                      </TableCell>
                    </TableRow>
                  )}
                  {grnItems && grnItems.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={7} className="text-right font-medium">
                          Subtotal:
                        </TableCell>
                        <TableCell className="text-right">
                          ₹
                          {grnItems
                            .reduce((sum, item) => sum + (item.unit_price || 0) * item.received_quantity, 0)
                            .toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} className="text-right font-medium">
                          GST:
                        </TableCell>
                        <TableCell className="text-right">
                          ₹
                          {grnItems
                            .reduce((sum, item) => {
                              const article = articleDetails.get(item.article_id)
                              const gstPercentage = article?.gst_percentage || 0
                              const itemSubtotal = (item.unit_price || 0) * item.received_quantity
                              return sum + itemSubtotal * (gstPercentage / 100)
                            }, 0)
                            .toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell colSpan={7} className="text-right">
                          Grand Total:
                        </TableCell>
                        <TableCell className="text-right">
                          ₹
                          {grnItems
                            .reduce((sum, item) => {
                              const article = articleDetails.get(item.article_id)
                              const gstPercentage = article?.gst_percentage || 0
                              const itemSubtotal = (item.unit_price || 0) * item.received_quantity
                              const itemGstAmount = itemSubtotal * (gstPercentage / 100)
                              return sum + itemSubtotal + itemGstAmount
                            }, 0)
                            .toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>

            {grn.notes && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <p className="text-muted-foreground">{grn.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t">
            <Link href="/dashboard/grn">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to GRN List
              </Button>
            </Link>
            <Link href={`/dashboard/inbound/${grn.po_id}`}>
              <Button>View Purchase Order</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error in GRN detail page:", error)
    notFound()
  }
}
