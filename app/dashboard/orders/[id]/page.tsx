"use client"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ArrowLeft, Truck, User, MapPin, Printer, Loader2, UserCheck, Save, Trash, Pencil, Check, X } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/types/supabase"
import { OrderStatusUpdateForm } from "../_components/order-status-update-form"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"

const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .print-section, .print-section * {
      visibility: visible;
    }
    .print-section {
      position: absolute;
      left: 0;
      top: 0;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .print-hide {
      display: none !important;
    }
    .no-print-allowed {
      display: flex !important;
      visibility: visible !important;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: white;
      z-index: 9999;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      color: red;
    }
  }
`

type Order = {
  id: string
  customer_id: string
  delivery_boy_id: string | null
  agent_id: string | null
  status: "pending" | "confirmed" | "reminder" | "out_for_delivery" | "delivered" | "cancelled"
  total_amount: number
  delivery_address: string
  comments: string
  created_at: string
  updated_at: string
  sales_agent_name: string | null
  sales_agent_phone: string | null
  customer: {
    full_name: string | null
    phone: string | null
  } | null
  sales_executive: {
    id: string
    name: string | null
    phone: string | null
  } | null
  delivery_boy: {
    full_name: string | null
    phone: string | null
  } | null
  agent: {
    full_name: string | null
    phone: string | null
  } | null
  order_items: {
    id: string
    product_id: string
    quantity: number
    unit_price: number
    product: {
      name: string
      image_url: string | null
      gst_percentage: number | null
      selling_price: number | null
      per: string | null
      hsn_code: string | null
    } | null
  }[]
}

type Coupon = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  minimum_order_amount: number | null
  maximum_discount_amount: number | null
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  // Hooks must be called unconditionally and in the same order every render
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()
  const { id } = params

  // All state declarations at the top
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [editedAddress, setEditedAddress] = useState("")
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false)
  const [isEditingSalesAgent, setIsEditingSalesAgent] = useState(false)
  const [editedSalesAgentName, setEditedSalesAgentName] = useState("")
  const [editedSalesAgentPhone, setEditedSalesAgentPhone] = useState("")
  const [isUpdatingSalesAgent, setIsUpdatingSalesAgent] = useState(false)
  const [deliveryAgents, setDeliveryAgents] = useState<
    Array<{ id: string; full_name: string | null; phone: string | null }>
  >([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [currentAssignment, setCurrentAssignment] = useState<any>(null)
  const [orderComments, setOrderComments] = useState("")
  const [isSavingComments, setIsSavingComments] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [executives, setExecutives] = useState<any[]>([])
  const [selectedExecutive, setSelectedExecutive] = useState<any | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [authData, setAuthData] = useState(null)
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [isFetchingCoupon, setIsFetchingCoupon] = useState(false)


  
  const [editingItemId, setEditingItemId] = useState(null)
const [editQty, setEditQty] = useState(1)
const [editPrice, setEditPrice] = useState("")

const startEdit = (item) => {
  setEditingItemId(item.id)
  setEditQty(item.quantity)
  setEditPrice(item.unit_price.toString())
}

const cancelEdit = () => {
  setEditingItemId(null)
  setEditQty(1)
  setEditPrice("")
}



const handleEditOrderItem = async (item) => {
  const newQty = parseInt(editQty)
  const newPrice = parseFloat(editPrice)

  if (isNaN(newQty) || newQty <= 0 || isNaN(newPrice) || newPrice < 0) {
    toast.error("Invalid quantity or price")
    return
  }

  console.log('itemmmm',item)

  try {
    // Fetch order status before updating
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .single()

    if (orderError) throw orderError

    // Update the item and get the old values
    const { data: oldItem, error: updateError } = await supabase
      .from("order_items")
         .select("order_id, product_id, quantity")
      .eq("id", item?.id)
   
      .single()

    if (updateError) throw updateError

    console.log('olditemquantity',oldItem.quantity)
    console.log('newquantity',newQty)

    const qtyDiff = oldItem.quantity - newQty
    console.log('quantitydiff',qtyDiff)

     const { data: oldItems, error: updateErrors } = await supabase
      .from("order_items")
      .update({ quantity: newQty, unit_price: newPrice })
      .eq("id", item?.id)
      .select("order_id, product_id, quantity")
      .single()

    // Only update stock if order is NOT pending or cancelled
   if (qtyDiff !== 0 && !["pending", "cancelled"].includes(orderData.status)) {
    console.log('olditemproduct',oldItem.product_id)
  // Get current stock
  const { data: productData, error: productError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", oldItem.product_id)
    .single()

  if (productError) throw productError

  const newStock = (productData?.stock || 0) + qtyDiff

  const { error: stockError } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", oldItem.product_id)

  if (stockError) throw stockError
}


    // Recalculate total
    const { data: remainingItems, error: fetchError } = await supabase
      .from("order_items")
      .select("quantity, unit_price")
      .eq("order_id", oldItem.order_id)

    if (fetchError) throw fetchError

    const newTotal = remainingItems.reduce(
      (sum, i) => sum + i.quantity * i.unit_price,
      0
    )

    await supabase
      .from("orders")
      .update({ total_amount: newTotal })
      .eq("id", oldItem.order_id)

    cancelEdit()
    fetchOrderDetails()
    toast.success("Item updated successfully.")
  } catch (err) {
    console.error("Edit failed", err)
    toast.error("Failed to update item")
  }
}


  // Calculate derived values
  const itemsTotal = order?.order_items.reduce((sum, item) => {
    const price = item.unit_price || item.product?.selling_price || 0
    return sum + item.quantity * price
  }, 0) || 0

  const discountAmount = order ? itemsTotal - order.total_amount : 0

  // All effects grouped together
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

  useEffect(() => {
    fetchOrderDetails()
  }, [supabase, id])

  useEffect(() => {
    if (order) {
      const itemsTotal = order.order_items.reduce((sum, item) => {
        const price = item.unit_price || item.product?.selling_price || 0
        return sum + item.quantity * price
      }, 0)

      // Check if there's a discount applied
      if (Math.abs(itemsTotal - order.total_amount) > 0.01) {
        fetchCouponForOrder(itemsTotal, order.total_amount)
      }
    }
  }, [order])

  useEffect(() => {
    const fetchDeliveryData = async () => {
      if (!order) return

      try {
        const { data: agentsData, error: agentsError } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .eq("role", "driver")

        if (agentsError) throw agentsError

        const { data: assignmentData, error: assignmentError } = await supabase
          .from("delivery_assignments")
          .select(`
            id, 
            order_id, 
            delivery_agent_id, 
            assigned_at, 
            status, 
            updated_at,
            delivery_agent:delivery_agent_id (
              full_name, 
              phone, 
              vehicle:vehicle_id (
                registration_number, 
                vehicle_type, 
                capacity, 
                status
              )
            )
          `)
          .eq("order_id", id)
          .order("assigned_at", { ascending: false })
          .limit(1)

        if (assignmentError) throw assignmentError

        setDeliveryAgents(agentsData || [])

        if (assignmentData && assignmentData.length > 0) {
          setCurrentAssignment(assignmentData[0])
          setSelectedAgentId(assignmentData[0].delivery_agent_id)
        }
      } catch (error: any) {
        console.error("Error fetching delivery data:", error)
      }
    }

    fetchDeliveryData()
  }, [supabase, id, order])

  useEffect(() => {
    const fetchExecutives = async () => {
      const { data, error } = await supabase
        .from("sales_executives")
        .select("id, name, phone, manager_id, sales_managers(name)")
        .order("name", { ascending: true })

      if (!error && data) {
        setExecutives(data)
        const selected = data.find((e) => e.id === order?.sales_executive?.id)
        if (selected) setSelectedExecutive(selected)
      }
    }

    fetchExecutives()
  }, [order?.sales_executive?.id])

  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = printStyles
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Helper functions
  const fetchCouponForOrder = async (itemsTotal: number, discountedTotal: number) => {
    setIsFetchingCoupon(true)
    try {
      const discountAmount = itemsTotal - discountedTotal
      const discountPercentage = (discountAmount / itemsTotal) * 100

      // First try to find a percentage coupon that matches
      const { data: percentageCoupons, error: percentageError } = await supabase
        .from("coupons")
        .select("*")
        .eq("discount_type", "percentage")
        .gte("discount_value", discountPercentage - 0.5)
        .lte("discount_value", discountPercentage + 0.5)

      if (!percentageError && percentageCoupons?.length) {
        setCoupon(percentageCoupons[0])
        return
      }

      // If no percentage coupon found, try fixed amount
      const { data: fixedCoupons, error: fixedError } = await supabase
        .from("coupons")
        .select("*")
        .eq("discount_type", "fixed_amount")
        .gte("discount_value", discountAmount - 0.5)
        .lte("discount_value", discountAmount + 0.5)

      if (!fixedError && fixedCoupons?.length) {
        setCoupon(fixedCoupons[0])
        return
      }

      // If no exact match found, create a synthetic coupon for display
      setCoupon({
        id: "unknown",
        code: "DISCOUNT",
        discount_type: itemsTotal !== 0 ? "percentage" : "fixed_amount",
        discount_value: itemsTotal !== 0 ? discountPercentage : discountAmount,
        minimum_order_amount: null,
        maximum_discount_amount: null
      })
    } catch (error) {
      console.error("Error fetching coupon:", error)
    } finally {
      setIsFetchingCoupon(false)
    }
  }

  const fetchOrderDetails = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customer_id(full_name, phone),
          delivery_boy:delivery_boy_id(full_name, phone),
          agent:agent_id(full_name, phone),
          order_items(id, product_id, quantity, unit_price, product:product_id(name, image_url, gst_percentage, per, hsn_code, selling_price)),
          sales_executive:sales_executive_id(id,name,phone)
        `)
        .eq("id", id)
        .single()

      if (error) throw error

      if (data) {
        setOrder(data as unknown as Order)
        setEditedAddress(data.delivery_address)
        setEditedSalesAgentName(data.sales_executive?.name || "")
        setEditedSalesAgentPhone(data.sales_executive?.phone || "")
        setOrderComments(data.comments || "")
        setSelectedExecutive(data.sales_executive || "")
      } else {
        setError("Order not found")
      }
    } catch (error: any) {
      console.error("Error fetching order details:", error)
      setError(error.message || "Failed to load order details")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const amountToWords = (num: number): string => {
    const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    const double = [
      "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", 
      "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    function convertChunk(chunk: number): string {
      let str = ""
      const hundred = Math.floor(chunk / 100)
      const remainder = chunk % 100

      if (hundred) str += single[hundred] + " Hundred "

      if (remainder > 0) {
        if (remainder < 10) str += single[remainder]
        else if (remainder < 20) str += double[remainder - 10]
        else {
          const ten = Math.floor(remainder / 10)
          const unit = remainder % 10
          str += tens[ten]
          if (unit) str += " " + single[unit]
        }
      }

      return str.trim()
    }

    if (num === 0) return "Zero Rupees Only"

    const rupees = Math.floor(num)
    const paise = Math.round((num - rupees) * 100)
    let result = ""

    let remaining = rupees

    const crore = Math.floor(remaining / 10000000)
    if (crore) {
      result += convertChunk(crore) + " Crore "
      remaining %= 10000000
    }

    const lakh = Math.floor(remaining / 100000)
    if (lakh) {
      result += convertChunk(lakh) + " Lakh "
      remaining %= 100000
    }

    const thousand = Math.floor(remaining / 1000)
    if (thousand) {
      result += convertChunk(thousand) + " Thousand "
      remaining %= 1000
    }

    if (remaining > 0) {
      result += convertChunk(remaining) + " "
    }

    result = "INR " + result.trim() + " Rupees"

    if (paise > 0) {
      result += " and " + convertChunk(paise) + " Paise"
    } else {
      result += " Only"
    }

    return result
  }

  const handlePrint = () => {
    if (order?.status === "pending") {
      toast({
        title: "Cannot print",
        description: "Orders with pending status cannot be printed",
        variant: "destructive",
      })
      return
    }
    window.print()
  }

 const handleDeleteOrderItem = async (itemId: string) => {
  if (!confirm("Are you sure you want to delete this item?")) return

  try {
    console.log('order_item_idd', itemId)

    // Step 1: Get item details before deleting
    const { data: itemData, error: itemError } = await supabase
      .from("order_items")
      .select("order_id, product_id, quantity")
      .eq("id", itemId)
      .single()

    if (itemError) throw itemError

    const { order_id: orderId, product_id: productId, quantity: deletedQty } = itemData

    // Step 2: Get order status
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single()

    if (orderError) throw orderError

    // Step 3: Delete the item
    const { error: deleteError } = await supabase
      .from("order_items")
      .delete()
      .eq("id", itemId)

    if (deleteError) throw deleteError

    // Step 4: Restore stock only if order is not pending/cancelled
    if (!["pending", "cancelled"].includes(orderData.status)) {
      const { data: productData, error: productFetchError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", productId)
        .single()

      if (productFetchError) throw productFetchError

      const newStock = (productData?.stock || 0) + deletedQty

      const { error: stockUpdateError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", productId)

      if (stockUpdateError) throw stockUpdateError
    }

    // Step 5: Recalculate order total
    const { data: remainingItems, error: itemsError } = await supabase
      .from("order_items")
      .select("quantity, unit_price")
      .eq("order_id", orderId)

    if (itemsError) throw itemsError

    const newTotal = remainingItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    )

    const { error: totalUpdateError } = await supabase
      .from("orders")
      .update({ total_amount: newTotal })
      .eq("id", orderId)

    if (totalUpdateError) throw totalUpdateError

    fetchOrderDetails()
    toast.success("Item deleted, stock updated, and order total adjusted.")
  } catch (err) {
    console.error("Failed to delete item", err)
    toast.error("Could not delete item. Please try again.")
  }
}

  {/*const handleExecutiveChange = async (executiveId: string) => {
    const executive = executives.find((e) => e.id === executiveId)
    if (!executive) return

    setIsUpdating(true)
    setError(null)

    const { error } = await supabase
      .from("orders")
      .update({
        sales_executive_id: executive.id,
        sales_manager_id: executive.manager_id,
      })
      .eq("id", order?.id)

    if (error) {
      console.error("Failed to update order:", error)
      setError("Failed to update order.")
    } else {
      setSelectedExecutive(executive)
    }

    setIsUpdating(false)
  }*/}


  const handleExecutiveChange = async (executiveId: string) => {
  setIsUpdating(true);
  setError(null);

  try {
    if (executiveId === "none") {
      // Handle reset to none
      const { error } = await supabase
        .from("orders")
        .update({
          sales_executive_id: null,
          sales_manager_id: null,
        })
        .eq("id", order?.id);

      if (error) throw error;

      setSelectedExecutive(null);
      toast({
        title: "Success",
        description: "Sales executive removed",
      });
    } else {
      // Handle executive selection
      const executive = executives.find((e) => e.id === executiveId);
      if (!executive) return;

      const { error } = await supabase
        .from("orders")
        .update({
          sales_executive_id: executive.id,
          sales_manager_id: executive.manager_id,
        })
        .eq("id", order?.id);

      if (error) throw error;

      setSelectedExecutive(executive);
      toast({
        title: "Success",
        description: "Sales executive updated",
      });
    }
  } catch (error) {
    console.error("Failed to update order:", error);
    setError("Failed to update order.");
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to update sales executive",
    });
  } finally {
    setIsUpdating(false);
  }
}

  const handleStatusUpdate = (newStatus: string) => {
    if (order) {
      setOrder({
        ...order,
        status: newStatus as Order["status"],
      })
    }
  }

  const handleSaveComments = async () => {
    setIsSavingComments(true)
    const { data, error } = await supabase
      .from("orders")
      .update({ comments: orderComments, updated_at: new Date() })
      .eq("id", order?.id)

    setIsSavingComments(false)
    if (error) {
      toast({ title: "Error", description: "Failed to save comments", variant: "destructive" })
    } else {
      toast({
        title: "Success",
        description: "Comments saved successfully",
        variant: "default",
      })
    }
  }

  const handleAddressUpdate = async () => {
    if (!order) return
    if (!editedAddress.trim()) {
      toast({
        title: "Error",
        description: "Address cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingAddress(true)

    try {
      const { error } = await supabase
        .from("orders")
        .update({ delivery_address: editedAddress })
        .eq("id", order.id)

      if (error) throw error

      setOrder({
        ...order,
        delivery_address: editedAddress,
      })
      setIsEditingAddress(false)

      toast({
        title: "Success",
        description: "Delivery address updated successfully",
        variant: "success",
      })
    } catch (error: any) {
      console.error("Error updating address:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update address",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingAddress(false)
    }
  }

  const handleSalesAgentUpdate = async () => {
    if (!order) return

    setIsUpdatingSalesAgent(true)

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          sales_agent_name: editedSalesAgentName,
          sales_agent_phone: editedSalesAgentPhone,
        })
        .eq("id", order.id)

      if (error) throw error

      setOrder({
        ...order,
        sales_agent_name: editedSalesAgentName,
        sales_agent_phone: editedSalesAgentPhone,
      })
      setIsEditingSalesAgent(false)

      toast({
        title: "Success",
        description: "Sales agent details updated successfully",
        variant: "success",
      })
    } catch (error: any) {
      console.error("Error updating sales agent:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update sales agent details",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingSalesAgent(false)
    }
  }

 const handleAssign = async () => {
  setIsAssigning(true)

  try {
    const { data: existingAssignments, error: fetchError } = await supabase
      .from("delivery_assignments")
      .select("id")
      .eq("order_id", id)
      .limit(1)

    if (fetchError) throw fetchError

    let assignmentResult

    if (selectedAgentId === null) {
      // 🔴 Handle unassignment
      if (existingAssignments?.length) {
        const { error } = await supabase
          .from("delivery_assignments")
          .update({
            delivery_agent_id: null,
            status: "unassigned",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAssignments[0].id)

        if (error) throw error

        toast({
          title: "Unassigned",
          description: "Delivery agent unassigned successfully",
          variant: "default",
        })

        setCurrentAssignment(null)

        if (order) {
          setOrder({
            ...order,
            delivery_boy_id: null,
            delivery_boy: null,
          })
        }

        return
      } else {
        toast({
          title: "Info",
          description: "No delivery assignment exists to unassign",
          variant: "default",
        })
        return
      }
    }

    // ✅ Handle assigning agent
    if (existingAssignments?.length) {
      const { data, error } = await supabase
        .from("delivery_assignments")
        .update({
          delivery_agent_id: selectedAgentId,
          status: "assigned",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAssignments[0].id)
        .select()

      if (error) throw error
      assignmentResult = data
    } else {
      const { data, error } = await supabase
        .from("delivery_assignments")
        .insert({
          order_id: id,
          delivery_agent_id: selectedAgentId,
          status: "assigned",
        })
        .select()

      if (error) throw error
      assignmentResult = data
    }

    // Send notification
    try {
      const notificationResponse = await fetch(
        "https://v0-duplicateversionofgroceryapis.vercel.app/api/notifications/assign-delivery",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: selectedAgentId,
            order_id: id,
            custom_message: "",
          }),
        }
      )

      if (!notificationResponse.ok) {
        console.error("Notification API error:", await notificationResponse.text())
        toast({
          title: "Warning",
          description: "Order assigned but notification may not have been sent",
          variant: "warning",
        })
      } else {
        toast({
          title: "Success",
          description: "Order assigned and notification sent successfully",
          variant: "success",
        })
      }
    } catch (notificationError) {
      console.error("Notification error:", notificationError)
      toast({
        title: "Warning",
        description: "Order assigned but notification failed to send",
        variant: "warning",
      })
    }

    // Refresh local assignment state
    const { data: newAssignment, error: fetchError2 } = await supabase
      .from("delivery_assignments")
      .select(`
        id, 
        order_id, 
        delivery_agent_id, 
        assigned_at, 
        status, 
        updated_at,
        delivery_agent:delivery_agent_id(
          full_name, 
          phone, 
          vehicle:vehicle_id (
            registration_number, 
            vehicle_type, 
            capacity, 
            status
          )
        )
      `)
      .eq("order_id", id)
      .single()

    if (!fetchError2 && newAssignment) {
      setCurrentAssignment(newAssignment)
    }

    if (order) {
      const selectedAgent = deliveryAgents.find((agent) => agent.id === selectedAgentId)
      if (selectedAgent) {
        setOrder({
          ...order,
          delivery_boy_id: selectedAgentId,
          delivery_boy: {
            full_name: selectedAgent.full_name,
            phone: selectedAgent.phone,
          },
        })
      }
    }
  } catch (error: any) {
    console.error("Error assigning order:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to assign order",
      variant: "destructive",
    })
  } finally {
    setIsAssigning(false)
  }
}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error || "Failed to load order details"}</p>
          <Button asChild className="mt-4">
            <Link href={`/dashboard/orders?${searchParams.toString()}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {order.status === "pending" && (
        <div className="no-print-allowed">
          <div className="text-center p-8 bg-red-50 border-2 border-red-200 rounded-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Printing Not Allowed</h2>
            <p>Orders with pending status cannot be printed.</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/orders?${searchParams.toString()}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          disabled={order.status === "pending"}
          title={order.status === "pending" ? "Cannot print orders with pending status" : "Print order details"}
          className="print:hidden flex items-center"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Order Details
          {order.status === "pending" && (
            <span className="ml-2 text-xs text-red-500">(Not available for pending orders)</span>
          )}
        </Button>
      </div>

     <div className="font-bold text-xl bg-gray-200 rounded flex flex-col justify-center items-center m-2 py-2">
  <div>Order #{order?.id}</div>
  <div className="text-sm font-normal text-gray-600">
    Created on {format(new Date(order.created_at), "MMM dd, yyyy 'at' h:mm a")}
  </div>

  {order?.status && (
    <div
      className={`mt-2 text-sm px-3 py-1 rounded-full font-semibold
        ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
          order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'}
      `}
    >
      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
    </div>
  )}
</div>


      {/* Invoice Section */}
      <div className="border border-black print-section" style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
      }}>
        {/* Header */}
        <div className="flex border-b border-black justify-center font-semibold py-1" style={{ fontSize: "12px" }}>
          TAX INVOICE
        </div>

        {/* Main Content */}
        <div className="flex w-full">
          {/* Left Column */}
          <div className="w-1/2 border-r border-black">
            {/* Company Info */}
            <div className="flex border-b border-black p-1">
              <img src="/ismart2-logo.png" alt="Company Logo" className="h-24 object-contain object-left mr-2" />
              <div className="flex flex-col gap-1">
                <div className="font-bold text-xs">ISMART SYSTEMS LLP</div>
                <div className="text-xs">
                  <div className="font-semibold inline pr-2"> Corporate Address:</div>
                  <br />
                  PLOT No.7, Y S RAO TOWERS, KAVURI HILLS (PHASE-1) MADHAPUR, HYDERABAD, Telangana - 500081
                </div>
                <div className="text-xs">
                  <div className="font-semibold inline pr-2"> Warehouse Address:</div>
                  <br />
                  D.NO.12-44/4/A/1 SATHAMRAI, SHAMSHABAD, HYDERABAD, Telangana - 501218
                </div>
                <div className="text-xs">
                  <div className="font-semibold inline pr-2">GST :</div>
                  <div className="inline font-semibold">36AAJFI6467N1ZM</div>
                </div>
              </div>
            </div>

            {/* Consignee */}
            <div className="border-b border-black p-1">
              <div className="text-xs">Consignee Details</div>
              <div className="font-bold">{order.customer?.full_name || "Unknown Customer"}</div>
              <div className="text-xs">
                {order.delivery_address || "No address provided"}
                <br />
                {order.customer?.phone && `Phone: ${order.customer.phone}`}
              </div>
            </div>

            {/* Buyer */}
            <div className="p-1">
              <div className="text-xs">Delivery Address</div>
              <div className="text-xs">
                {order.delivery_address || "No address provided"}
                <br />
                {order.customer?.phone && `Phone: ${order.customer.phone}`}
              </div>
            </div>
          </div>

          {/* Right Column - Invoice Details */}
          <div className="w-1/2 grid grid-cols-2">
            {[
              { label: "Invoice No", value: order.id.slice(0, 8) },
              { label: "Dated", value: format(new Date(order.created_at), "dd-MMM-yyyy"), bold: true },
              { label: "Agent Name ", value: "" },
              { label: editedSalesAgentName || "", value: "" },
              { label: "Agent Phone Number", value: "" },
              { label: editedSalesAgentPhone, value: "" },
              { label: "Buyer's Order No.", value: order.id },
              { label: "Dated", value: format(new Date(order.created_at), "dd-MMM-yyyy"), bold: true },
              { label: "Destination", value: "" },
              { label: "Local Deliveries", value: "" },
              { label: "Vehicle Number", value: "" },
              {
                label: currentAssignment?.delivery_agent?.vehicle?.registration_number || "N/A",
                value: "",
                bold: true,
              },
                { label: "Delivery Person", value: "" },
              {
                label: currentAssignment?.delivery_agent?.full_name || "N/A",
                value: "",
                bold: true,
              },
              { label: "Mode of Payment", value: "Cash on Delivery", colSpan: 2, bold: true },
            ].map((item, index) => (
              <div
                key={index}
                className={`p-1 ${index % 2 === 0 ? "border-r border-black" : ""} ${index < 18 ? "border-b border-black" : ""}`}
                style={{ gridColumn: item.colSpan ? "span 2" : "span 1" }}
              >
                <div className="text-xs">{item.label}</div>
                <div className={`${item.bold ? "font-bold" : ""}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-black mt-1 text-xs">
          {/* Table Header */}
          <div className="grid grid-cols-[34px_2fr_1fr_1fr_1fr_1fr_50px_1fr] font-bold border-b border-black bg-gray-100">
            <div className="p-1 border-r border-black text-center">S.No</div>
            <div className="p-1 border-r border-black">Description of Goods</div>
            <div className="p-1 border-r border-black text-center">HSN/SAC</div>
            <div className="p-1 border-r border-black text-center">Quantity</div>
            <div className="p-1 border-r border-black text-center">GST Percentage</div>
            <div className="p-1 border-r border-black text-center">Rate</div>
            <div className="p-1 border-r border-black text-center">Per</div>
            <div className="p-1 text-center">Amount</div>
          </div>

          {/* Item Rows */}
          {order.order_items.map((item, idx) => {
            const price = item.unit_price || item.product?.selling_price || 0
            const itemTotal = item.quantity * price

            return (
              <div key={idx} className="grid grid-cols-[34px_2fr_1fr_1fr_1fr_1fr_50px_1fr] border-b border-black">
                <div className="p-1 border-r border-black text-center">{idx + 1}</div>
                <div className="p-1 border-r border-black font-semibold">{item.product?.name || "Unknown Product"}</div>
                <div className="p-1 border-r border-black text-center">
                  {item.product?.hsn_code ? `${item.product.hsn_code}` : "N/A"}
                </div>
                <div className="p-1 border-r border-black text-center font-semibold">{item.quantity}</div>
                <div className="p-1 border-r border-black text-center">
                  {item.product?.gst_percentage ? `${item.product?.gst_percentage}%` : "0%"}
                </div>
                <div className="p-1 border-r border-black text-center">{price.toFixed(2)}</div>
                <div className="p-1 border-r border-black text-center">{item?.product?.per || ""}</div>
                <div className="p-1 text-right pr-2 font-semibold">{itemTotal.toFixed(2)}</div>
              </div>
            )
          })}

          {/* Subtotal Row */}
          <div className="grid grid-cols-[34px_2fr_1fr_1fr_1fr_1fr_50px_1fr] font-bold">
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black">Subtotal</div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 text-right pr-2">{formatCurrency(itemsTotal)}</div>
          </div>

          {/* Discount Row (if applicable) */}
          {Math.abs(discountAmount) > 0.01 && (
            <div className="grid grid-cols-[34px_2fr_1fr_1fr_1fr_1fr_50px_1fr]">
              <div className="p-1 border-r border-black"></div>
              <div className="p-1 border-r border-black">
               
                  Discount Applied
                
              </div>
              <div className="p-1 border-r border-black"></div>
              <div className="p-1 border-r border-black"></div>
              <div className="p-1 border-r border-black"></div>
              <div className="p-1 border-r border-black"></div>
              <div className="p-1 border-r border-black"></div>
              <div className="p-1 text-right pr-2 text-red-600">-{formatCurrency(discountAmount)}</div>
            </div>
          )}

          {/* Grand Total Row */}
          <div className="grid grid-cols-[34px_2fr_1fr_1fr_1fr_1fr_50px_1fr] font-bold border-t-2 border-black">
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black">Grand Total</div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 text-right pr-2">{formatCurrency(order.total_amount)}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex mt-1">
          <div className="w-2/3 pr-2">
            <div className="text-xs">Amount chargeable (in words)</div>
            <div className="font-bold text-sm">{amountToWords(order.total_amount)}</div>
            <div className="mt-4">
              <div className="border-b border-black inline-block text-xs">Declaration</div>
              <div className="text-xs mt-1">
                We declare that this invoice shows the actual price of the goods
                <br />
                described and that all particulars are true and correct.
              </div>
            </div>
          </div>

          <div className="mr-6">
            <img src="/scan-qr-updated.jpeg" alt="Company Logo" className="object-contain object-left mr-2" />
          </div>

          <div className="w-1/3">
            <div className="text-xs font-bold">Bank Details</div>
            <div className="text-xs">
              A/c Holder's Name: ISMART SYSTEMS LLP
              <br />
              Account Number: 10222238347
              <br />
              IFSC CODE: IDFB0080225
              <br />
              Branch: SR.NAGAR BRANCH
            </div>

            <div className="border-t border-l border-black mt-2 p-1">
              <div>ISMART SYSTEMS LLP</div>
              <div className="mt-8 text-right">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Interactive Components */}
      <div className="space-y-6 print-hide">
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              Assign Sales Executive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/*<Select value={selectedExecutive?.id || ""} onValueChange={handleExecutiveChange}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select sales executive" />
              </SelectTrigger>
              <SelectContent>
                {executives.map((exec) => (
                  <SelectItem key={exec.id} value={exec.id}>
                    {exec.name} ({exec.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>*/}
 <Select 
  value={selectedExecutive?.id || "none"} 
  onValueChange={handleExecutiveChange}
  disabled={isUpdating}
>
  <SelectTrigger className="w-full max-w-sm">
    <SelectValue placeholder={isUpdating ? "Updating..." : "Select sales executive"} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">
      <span className="text-muted-foreground">-- None --</span>
    </SelectItem>
    {executives.map((exec) => (
      <SelectItem key={exec.id} value={exec.id}>
        {exec.name} ({exec.phone})
        {exec.sales_managers?.name && (
          <span className="text-xs text-muted-foreground ml-1">
            (ASM: {exec.sales_managers.name})
          </span>
        )}
      </SelectItem>
    ))}
  </SelectContent>
</Select>


            {selectedExecutive?.sales_managers?.name && (
              <p className="text-sm text-muted-foreground">
                This executive is under ASM:{" "}
                <span className="font-medium">{selectedExecutive.sales_managers.name}</span>
              </p>
            )}

            {isUpdating && (
              <div className="flex items-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </div>
            )}

            {error && <div className="text-red-500 text-sm">{error}</div>}
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingAddress ? (
              <div className="space-y-2 print-hide">
                <Textarea
                  className="w-full"
                  value={editedAddress}
                  onChange={(e) => setEditedAddress(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingAddress(false)
                      setEditedAddress(order.delivery_address)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddressUpdate} disabled={isUpdatingAddress}>
                    {isUpdatingAddress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p>{order.delivery_address}</p>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(true)} className="print-hide mt-2">
                  Edit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Delivery Person
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-4 space-y-4 print-hide">
              <div className="space-y-2">
                <Label htmlFor="delivery-agent">Assign Delivery Agent</Label>
               <Select
  value={selectedAgentId ?? "none"}
  onValueChange={(value) => {
    setSelectedAgentId(value === "none" ? null : value);
  }}
>
  <SelectTrigger id="delivery-agent">
    <SelectValue placeholder="Select a delivery agent" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">
      <span className="text-muted-foreground">-- None --</span>
    </SelectItem>
    {deliveryAgents.map((agent) => (
      <SelectItem key={agent.id} value={agent.id}>
        {agent.full_name} {agent.phone ? `(${agent.phone})` : ""}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
              </div>

              {currentAssignment && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                  <p className="text-amber-800">
                    Currently assigned to{" "}
                    <span className="font-medium">{currentAssignment.delivery_agent?.full_name}</span>
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Assigned on {new Date(currentAssignment.assigned_at).toLocaleString()}
                  </p>
                </div>
              )}

              <Button
  onClick={handleAssign}
  disabled={isAssigning || selectedAgentId === undefined}
  className="w-full"
>
  {isAssigning ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Assigning...
    </>
  ) : (
    <>
      <UserCheck className="mr-2 h-4 w-4" />
      Assign & Notify Agent
    </>
  )}
</Button>
            </div>
          </CardContent>
        </Card>

       { (authData?.user?.id === "01b13ee8-6293-4161-ba87-983de8a2f241" || authData?.user?.id === "c10adc33-89ad-4347-82f3-503eb3a90c81"  || authData?.user?.id === "67e10586-72fc-4daa-9488-d62dae229332" || authData?.user?.id === "905cb410-5a83-409d-833a-5bc0d2fec983"  || authData?.user?.id === "7044f7f1-0839-4b83-9a65-db95717d3190") &&  <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg">Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusUpdateForm
              orderId={order.id}
              currentStatus={order.status}
              onStatusUpdated={handleStatusUpdate}
            />
          </CardContent>
        </Card>}

        <Card className="p-4">
          <CardHeader>
            <CardTitle className="text-lg">Order Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="order-comments">Add Comments</Label>
              <Textarea
                id="order-comments"
                placeholder="Write any notes or comments about this order..."
                value={orderComments}
                onChange={(e) => setOrderComments(e.target.value)}
                rows={4}
              />
              <Button onClick={handleSaveComments} disabled={isSavingComments}>
                {isSavingComments ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Comments
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>


   



{((authData?.user?.id === "22620814-0492-4a4e-bfe8-121a68e4c896" || (authData?.user?.id  ==="01b13ee8-6293-4161-ba87-983de8a2f241"))) &&
  order?.order_items?.map((item) => (
    <div key={item.id} className="flex items-center justify-between border p-2 rounded-md">
      <div>
        <p className="font-medium">{item.product?.name}</p>
        {editingItemId === item.id ? (
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              value={editQty} 
              onChange={(e) => setEditQty(e.target.value)}
              className="border p-1 w-16 text-sm rounded"
              min={1}
            />
            <input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="border p-1 w-20 text-sm rounded"
              min={0}
              step="0.01"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Qty: {item.quantity} x ₹{item.unit_price}
          </p>
        )}
      </div>
   
      <div className="flex gap-1">
        {editingItemId === item.id ? (
          <>
            <Button
              size="icon"
              variant="default"
              onClick={() => handleEditOrderItem(item)}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => cancelEdit()}>
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => startEdit(item)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon" 
              variant="destructive"
              onClick={() => handleDeleteOrderItem(item.id)}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
))}
      </div>
    </div>
  )
  
}
