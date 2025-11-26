"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface InboundManagementFormProps {
  purchaseOrder: any
  appointments: any[]
}

export function InboundManagementForm({ purchaseOrder, appointments }: InboundManagementFormProps) {
  const [inboundStatus, setInboundStatus] = useState(purchaseOrder.inbound_status || "Created")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("items")
  const [grnList, setGrnList] = useState<any[]>([])
  const [loadingGrn, setLoadingGrn] = useState(false)
  const [poItems, setPoItems] = useState<any[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  
 const [authData, setAuthData] = useState(null)


 useEffect(() => {
    // Safely access localStorage only on the client side
    try {
      const authDataString = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      if (authDataString) {
        const parsedAuthData = JSON.parse(authDataString)
        setAuthData(parsedAuthData)
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
  }, [])

    const allowedAdminIds = [
         
          "d347bd21-e42b-4f63-ae12-b7589617b527"
        ]

        const isAdmin = allowedAdminIds.includes(authData?.user?.id)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  useEffect(() => {
    if (purchaseOrder.id) {
      fetchGrnData()
    }
  }, [purchaseOrder.id])

  useEffect(() => {
    if (purchaseOrder.id) {
      fetchPurchaseOrderItems()
    }
  }, [purchaseOrder.id])

  const fetchPurchaseOrderItems = async () => {
    setLoadingItems(true)
    try {
      // First, fetch the purchase order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("purchase_order_itemstwo")
        .select("*")
        .eq("po_id", purchaseOrder.id)
        .order("id", { ascending: true })

      if (itemsError) throw itemsError

      if (itemsData && itemsData.length > 0) {
        // Get unique article_ids (filtering out nulls)
        const articleIds = itemsData.map((item) => item.article_id).filter((id) => id !== null)

        // If we have article_ids, fetch the corresponding products
        if (articleIds.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from("products")
            .select("name, article_id, gst_percentage, unit_of_measurement")
            .in("article_id", articleIds)

          if (productsError) throw productsError

          // Create a map of article_id to product data for quick lookup
          const productMap = (productsData || []).reduce((map, product) => {
            if (product.article_id) {
              map[product.article_id] = product
            }
            return map
          }, {})

          // Merge product data with purchase order items
          const itemsWithProducts = itemsData.map((item) => ({
            ...item,
            product: item.article_id ? productMap[item.article_id] : null,
          }))

          setPoItems(itemsWithProducts)
        } else {
          setPoItems(itemsData)
        }
      } else {
        setPoItems([])
      }
    } catch (error: any) {
      console.error("Error fetching purchase order items:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase order items",
        variant: "destructive",
      })
    } finally {
      setLoadingItems(false)
    }
  }

  const fetchGrnData = async () => {
    setLoadingGrn(true)
    try {
      // Fetch GRN records for this purchase order
      const { data: grnData, error: grnError } = await supabase
        .from("goods_receipt_notes")
        .select("*")
        .eq("po_id", purchaseOrder.id)
        .order("created_at", { ascending: false })

      if (grnError) throw grnError

      setGrnList(grnData || [])
    } catch (error: any) {
      console.error("Error fetching GRN data:", error)
      toast({
        title: "Error",
        description: "Failed to load GRN data",
        variant: "destructive",
      })
    } finally {
      setLoadingGrn(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ inbound_status: status })
        .eq("id", purchaseOrder.id)

      if (error) throw error

      setInboundStatus(status)
      toast({
        title: "Status updated",
        description: `Inbound status has been updated to ${status}.`,
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Format time for display
  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Check if purchase order items exist
  const hasItems = poItems.length > 0

  return (
    <div className="space-y-6">
      {loading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Processing</AlertTitle>
          <AlertDescription>Updating inbound status...</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Vendor</Label>
              <p className="font-medium">{purchaseOrder.vendors?.name || "Unknown Vendor"}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">PO Status</Label>
              <Badge
                variant={
                  purchaseOrder.po_status === "Approved"
                    ? "default"
                    : purchaseOrder.po_status === "Cancelled"
                      ? "destructive"
                      : "secondary"
                }
              >
                {purchaseOrder.po_status || "Draft"}
              </Badge>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Created Date</Label>
              <p className="font-medium">{formatDate(purchaseOrder.created_at)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Inbound Status</Label>
            <div className="flex flex-wrap gap-2">
              {["Created", "Approved", "Dispatched", "Delivered", "Completed", "Cancelled"].map((status) => (
                <Badge
                  key={status}
                  variant={inboundStatus === status ? "default" : "outline"}
                  className={`cursor-pointer ${loading ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => !loading && handleStatusChange(status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">Order Items</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="grn">Goods Receipt</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Order Items</CardTitle>
              {hasItems && poItems.length > 0 && <Badge variant="outline">{poItems.length} items</Badge>}
            </CardHeader>
            <CardContent>
              {loadingItems ? (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-8 w-8 mb-2 animate-spin" />
                  <p className="text-muted-foreground">Loading purchase order items...</p>
                </div>
              ) : hasItems ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Article ID</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">UOM</TableHead>
                      <TableHead className="text-right">GST %</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poItems.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.article_text || item.product?.name || "Unknown Article"}</TableCell>
                        <TableCell>{item.article_id}</TableCell>
                        <TableCell className="text-right">{item.ordered_quantity}</TableCell>
                        <TableCell className="text-right">₹{item.cost_price}</TableCell>
                        <TableCell className="text-right">
                          {item.uom || item.product?.unit_of_measurement || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.product?.gst_percentage || item.gst_percentage || "0"}%
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{(item.cost_price * item.ordered_quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={6} className="text-right font-medium">
                        Subtotal:
                      </TableCell>
                      <TableCell className="text-right">
                        ₹
                        {poItems
                          .reduce((sum: number, item: any) => sum + item.cost_price * item.ordered_quantity, 0)
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} className="text-right font-medium">
                        GST:
                      </TableCell>
                      <TableCell className="text-right">
                        ₹
                        {poItems
                          .reduce((sum: number, item: any) => {
                            const gstPercentage = item.product?.gst_percentage || item.gst_percentage || 0
                            return sum + item.cost_price * item.ordered_quantity * (gstPercentage / 100)
                          }, 0)
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold">
                      <TableCell colSpan={6} className="text-right">
                        Total:
                      </TableCell>
                      <TableCell className="text-right">
                        ₹
                        {poItems
                          .reduce((sum: number, item: any) => {
                            const gstPercentage = item.product?.gst_percentage || item.gst_percentage || 0
                            const itemTotal = item.cost_price * item.ordered_quantity
                            const gstAmount = itemTotal * (gstPercentage / 100)
                            return sum + itemTotal + gstAmount
                          }, 0)
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>No items found for this purchase order.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Scheduled Appointments</CardTitle>
              <Link href={`/dashboard/inbound/appointments/new?po=${purchaseOrder.id}`}>
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Schedule Appointment
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                        <TableCell>{formatTime(appointment.expected_arrival_time)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              appointment.status === "Completed"
                                ? "default"
                                : appointment.status === "Cancelled"
                                  ? "destructive"
                                  : appointment.status === "Arrived"
                                    ? "outline"
                                    : "secondary"
                            }
                          >
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/inbound/appointments/${appointment.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No appointments scheduled yet.</p>
                  <p className="mt-2">Use the "Schedule Appointment" button to create a new delivery appointment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grn" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Goods Receipt Notes</CardTitle>
              {isAdmin && inboundStatus === "Delivered" && (
                <Link href="/dashboard/grn/new">
                  <Button size="sm" className="flex items-center gap-1">
                    <Plus className="h-4 w-4" /> Create GRN
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {loadingGrn ? (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-8 w-8 mb-2 animate-spin" />
                  <p className="text-muted-foreground">Loading GRN data...</p>
                </div>
              ) : grnList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GRN ID</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grnList.map((grn) => (
                      <TableRow key={grn.id}>
                        <TableCell>{grn.id.substring(0, 8)}...</TableCell>
                        <TableCell>{formatDate(grn.received_date)}</TableCell>
                        <TableCell>{grn.invoice_number || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={grn.status === "Completed" ? "default" : "secondary"}>
                            {grn.status || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/grn/${grn.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {inboundStatus !== "Delivered" ? (
                    <>
                      <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                      <p>Goods receipt can only be created after delivery.</p>
                      <p className="mt-2">Change the inbound status to "Delivered" to enable GRN creation.</p>
                    </>
                  ) : (
                    <>
                      <p>No goods receipt notes created yet.</p>
                      <p className="mt-2">Use the "Create GRN" button to record received goods.</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/inbound")}>
          Back to Inbound
        </Button>

        {inboundStatus === "Approved" && (
          <Button
            onClick={() => handleStatusChange("Dispatched")}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Mark as Dispatched
          </Button>
        )}

        {inboundStatus === "Dispatched" && (
          <Button
            onClick={() => handleStatusChange("Delivered")}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            Mark as Delivered
          </Button>
        )}
      </CardFooter>
    </div>
  )
}
