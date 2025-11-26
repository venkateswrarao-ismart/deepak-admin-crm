import { createSupabaseServerClient } from "@/lib/supabase"
import { AppointmentForm } from "../../_components/appointment-form"
import { redirect } from "next/navigation"

interface NewAppointmentPageProps {
  searchParams: {
    po?: string
  }
}

export default async function NewAppointmentPage({ searchParams }: NewAppointmentPageProps) {
  const supabase = createSupabaseServerClient()

  // Fetch purchase orders for dropdown
  const { data: purchaseOrders } = await supabase
    .from("purchase_orders")
    .select("id, vendors(name)")
    .in("po_status", ["Approved"])
    .order("created_at", { ascending: false })

  if (!purchaseOrders || purchaseOrders.length === 0) {
    redirect("/dashboard/inbound?error=No approved purchase orders found")
  }

  const formattedPOs = purchaseOrders.map((po) => ({
    id: po.id,
    label: `PO: ${po.id} - ${po.vendors?.name || "Unknown Vendor"}`,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Schedule Inbound Appointment</h1>
      <p className="text-muted-foreground">Schedule an appointment for inbound delivery of goods.</p>
      <AppointmentForm purchaseOrders={formattedPOs} preselectedPO={searchParams.po} />
    </div>
  )
}
