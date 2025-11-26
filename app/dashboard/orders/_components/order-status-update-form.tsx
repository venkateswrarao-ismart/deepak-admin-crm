"use client"

import React, { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/supabase"

interface OrderStatusUpdateFormProps {
  orderId: string
  currentStatus: string
  onStatusUpdated: (newStatus: string) => void
}

export function OrderStatusUpdateForm({
  orderId,
  currentStatus,
  onStatusUpdated,
}: OrderStatusUpdateFormProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()
  const [authData, setAuthData] = useState<any>(null)

  useEffect(() => {
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

  const trackStatusUpdate = async (previousStatus: string, newStatus: string) => {
    try {
      const tokenString = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      if (!tokenString) return

      const parsedToken = JSON.parse(tokenString)
      const userId = parsedToken.user?.id
      const fullName = parsedToken.user?.user_metadata?.full_name || "Unknown"

      const { error } = await supabase.from("order_status_updates").insert({
        order_id: orderId,
        user_id: userId,
        previous_status: previousStatus,
        new_status: newStatus,
        updated_by: fullName,
        metadata: {
          action: "status_update",
          client_timestamp: new Date().toISOString(),
        },
      })

      if (error) {
        console.error("Failed to track status update:", error)
      }
    } catch (error) {
      console.error("Error tracking status update:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (status === currentStatus) {
      toast({
        title: "No changes made",
        description: "The status is already set to this value.",
        variant: "default",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const tokenString = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      if (!tokenString) throw new Error("User is not authenticated. No access token found.")

      const parsedToken = JSON.parse(tokenString)
      const fullName = parsedToken.user?.user_metadata?.full_name || null
      const userId = parsedToken.user?.id || null

      await trackStatusUpdate(currentStatus, status)

      const fulfillmentStatuses = ["out_for_delivery", "delivered", "reminder"]
      const nonRevertStatuses = [...fulfillmentStatuses, "cancelled"]

      // Reduce stock when confirmed
      if (status === "confirmed" && currentStatus !== "confirmed") {
        const { data: orderItems, error: orderItemsError } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId)

        if (orderItemsError) throw new Error("Failed to fetch order items")

        if (orderItems?.length) {
          for (const item of orderItems) {
            const { data: productData } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .single()

            if (!productData) continue

            const newStock = Math.max(0, productData.stock - item.quantity)
            await supabase
              .from("products")
              .update({ stock: newStock, updated_by: userId })
              .eq("id", item.product_id)
          }
        }
      }

      // Revert stock if moving away from confirmed
      if (currentStatus === "confirmed" && !nonRevertStatuses.includes(status)) {
        const { data: orderItems, error: orderItemsError } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId)

        if (orderItemsError) throw new Error("Failed to fetch order items")

        if (orderItems?.length) {
          for (const item of orderItems) {
            const { data: productData } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .single()

            if (!productData) continue

            const newStock = productData.stock + item.quantity
            await supabase
              .from("products")
              .update({ stock: newStock, updated_by: userId })
              .eq("id", item.product_id)
          }
        }
      }

      // Revert stock on cancellation
      if (status === "cancelled" && currentStatus !== "pending") {
        const { data: orderItems, error: orderItemsError } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId)

        if (orderItemsError) throw new Error("Failed to fetch order items")

        if (orderItems?.length) {
          for (const item of orderItems) {
            const { data: productData } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .single()

            if (!productData) continue

            const newStock = productData.stock + item.quantity
            await supabase
              .from("products")
              .update({ stock: newStock, updated_by: userId })
              .eq("id", item.product_id)
          }
        }
      }

      // Update the order status
      const response = await fetch(
        `https://v0-duplicateversionofgroceryapis.vercel.app/api/orders/update-status/${orderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parsedToken.access_token}`,
          },
          body: JSON.stringify({ status, updated_by: fullName, agent_id: userId }),
        }
      )

      if (!response.ok) throw new Error(await response.text())

      toast({
        title: "Status updated",
        description: `Order status has been updated to ${status}.`,
        variant: "default",
      })

      onStatusUpdated(status)
    } catch (error: any) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Order Status</Label>
        <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {authData?.user?.id !== "7044f7f1-0839-4b83-9a65-db95717d3190" && (
              <SelectItem value="pending">Pending</SelectItem>
            )}
            {authData?.user?.id !== "7044f7f1-0839-4b83-9a65-db95717d3190" && ( <SelectItem value="confirmed">Confirmed</SelectItem>)}
            {authData?.user?.id !== "7044f7f1-0839-4b83-9a65-db95717d3190" && (
              <SelectItem value="reminder">Reminder</SelectItem>
            )}
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            {authData?.user?.id !== "7044f7f1-0839-4b83-9a65-db95717d3190" && (
              <>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isSubmitting || status === currentStatus} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Status"
        )}
      </Button>
    </form>
  )
}
