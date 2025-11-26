"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { GRNForm } from "../_components/grn-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function NewGRNPage() {
  const [loading, setLoading] = useState(true)
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    async function fetchPurchaseOrders() {
      try {
        setLoading(true)
        const supabase = createSupabaseClient()

        // Fetch approved purchase orders
        const { data, error } = await supabase
          .from("purchase_orders")
          .select("id, vendor_name, created_at, po_status")
          .eq("po_status", "Approved")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching purchase orders:", error)
          return
        }

        if (data && data.length > 0) {
          const formattedPOs = data.map((po) => ({
            id: po.id,
            label: `PO #${po.id} - ${po.vendor_name || "Unknown Vendor"} (${new Date(po.created_at).toLocaleDateString()})`,
            status: po.po_status,
          }))
          setPurchaseOrders(formattedPOs)
        }
      } catch (err) {
        console.error("Exception in fetchPurchaseOrders:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPurchaseOrders()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create Goods Receipt Note</h1>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create Goods Receipt Note</h1>
      </div>
      <GRNForm purchaseOrders={purchaseOrders} selectedPO={null} />
    </div>
  )
}
