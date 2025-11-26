import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { PurchaseOrderForm } from "../_components/purchase-order-form"
import { BackButton } from "../_components/back-button"

interface PurchaseOrderPageProps {
  params: {
    id: string
  }
}

export default async function PurchaseOrderPage({ params }: PurchaseOrderPageProps) {
  const supabase = createSupabaseServerClient()

  // Fetch vendors for dropdown
  const { data: vendors } = await supabase.from("vendors").select("id, name").eq("is_active", true).order("name")

  // If it's a new purchase order
  if (params.id === "new") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
        </div>
        <h1 className="text-3xl font-bold">Create Purchase Order</h1>
        <p className="text-muted-foreground">
          Create a new purchase order with vendor details, items, GST percentage, and validity date.
        </p>
        <PurchaseOrderForm vendors={vendors || []} />
      </div>
    )
  }

  // Fetch the purchase order
  const { data: purchaseOrder } = await supabase.from("purchase_orders").select("*").eq("id", params.id).single()

  if (!purchaseOrder) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
      </div>
      <h1 className="text-3xl font-bold">Purchase Order: {purchaseOrder.id}</h1>
      <p className="text-muted-foreground">Edit purchase order details, items, GST percentage, and validity date.</p>
      <PurchaseOrderForm purchaseOrder={purchaseOrder} vendors={vendors || []} />
    </div>
  )
}
