"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, UserCheck } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/supabase"

type Order = {
  id: string
  customer_id: string
  status: string
  total_amount: number
  delivery_address: string
  created_at: string
  customer: {
    full_name: string | null
    phone: string | null
  } | null
}

type DeliveryAgent = {
  id: string
  full_name: string | null
  phone: string | null
}

type DeliveryAssignment = {
  id: number
  order_id: string
  delivery_agent_id: string
  assigned_at: string
  status: string
  updated_at: string
  delivery_agent?: {
    full_name: string | null
  }
}

export default function AssignOrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string>("")
  const [currentAssignment, setCurrentAssignment] = useState<DeliveryAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()

  // Fetch order, delivery agents, and current assignment
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(`
            id, 
            customer_id, 
            status, 
            total_amount, 
            delivery_address, 
            created_at,
            customer:customer_id(full_name, phone)
          `)
          .eq("id", params.id)
          .single()

        if (orderError) throw orderError

        // Fetch delivery agents (profiles with role = delivery)
        const { data: agentsData, error: agentsError } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .eq("role", "delivery")

        if (agentsError) throw agentsError

        // Fetch current assignment if exists
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("delivery_assignments")
          .select(`
            id, 
            order_id, 
            delivery_agent_id, 
            assigned_at, 
            status, 
            updated_at,
            delivery_agent:delivery_agent_id(full_name)
          `)
          .eq("order_id", params.id)
          .order("assigned_at", { ascending: false })
          .limit(1)

        if (assignmentError) throw assignmentError

        // Set state with fetched data
        setOrder(orderData as Order)
        setDeliveryAgents(agentsData as DeliveryAgent[])

        if (assignmentData && assignmentData.length > 0) {
          setCurrentAssignment(assignmentData[0] as unknown as DeliveryAssignment)
          setSelectedAgentId(assignmentData[0].delivery_agent_id)
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setError(error.message || "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, params.id])

  // Handle assignment submission
  const handleAssign = async () => {
    if (!selectedAgentId) {
      toast({
        title: "Error",
        description: "Please select a delivery agent",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // If there's an existing assignment, update its status to 'reassigned'
      if (currentAssignment) {
        await supabase.from("delivery_assignments").update({ status: "reassigned" }).eq("id", currentAssignment.id)
      }

      // Create new assignment
      const { data, error } = await supabase
        .from("delivery_assignments")
        .insert({
          order_id: params.id,
          delivery_agent_id: selectedAgentId,
          status: "assigned",
        })
        .select()

      if (error) throw error

      // Send notification to delivery agent
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
              order_id: params.id,
              custom_message: "",
            }),
          },
        )

        if (!notificationResponse.ok) {
          console.error("Notification API error:", await notificationResponse.text())
          // We don't throw here to avoid blocking the main flow if notification fails
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

      // Redirect back to order details
      router.push(`/dashboard/orders/${params.id}`)
    } catch (error: any) {
      console.error("Error assigning order:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to assign order",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
            <Link href="/dashboard/orders">Back to Orders</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/orders/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Assign Delivery Agent
          </CardTitle>
          <CardDescription>Assign a delivery agent to order #{params.id.slice(0, 8)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Order Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{order.customer?.full_name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{order.customer?.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "INR",
                  }).format(order.total_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{order.status}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="font-medium">{order.delivery_address}</p>
            </div>
          </div>

          {currentAssignment && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <h3 className="text-amber-800 font-medium">Current Assignment</h3>
              <p className="text-sm text-amber-700">
                This order is currently assigned to{" "}
                <span className="font-medium">{currentAssignment.delivery_agent?.full_name}</span>
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Assigned on {new Date(currentAssignment.assigned_at).toLocaleString()}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivery-agent">Select Delivery Agent</Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger id="delivery-agent">
                  <SelectValue placeholder="Select a delivery agent" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryAgents.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No delivery agents available
                    </SelectItem>
                  ) : (
                    deliveryAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name} {agent.phone ? `(${agent.phone})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/orders/${params.id}`}>Cancel</Link>
          </Button>
          <Button onClick={handleAssign} disabled={isSubmitting || !selectedAgentId}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>Assign & Notify Agent</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
