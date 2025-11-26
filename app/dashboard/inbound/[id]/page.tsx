import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { InboundManagementForm } from "../_components/inbound-management-form"

interface InboundPageProps {
  params: {
    id: string
  }
}

export default async function InboundPage({ params }: InboundPageProps) {
  console.log("Inbound page requested for ID:", params.id)

  const supabase = createSupabaseServerClient()

  try {
    // Fetch the purchase order with all related data
    const { data: purchaseOrder, error } = await supabase
      .from("purchase_orders")
      .select(`
      id,
      vendor_id,
      vendor_code,
      vendor_name,
      vendor_address,
      vendor_phone,
      vendor_email,
      vendor_gst,
      payment_terms,
      rtv,
      created_at,
      updated_at,
      po_status,
      inbound_status,
      vendors:vendor_id (
        id, name, contact_number, email, address
      )
    `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching purchase order:", error)
      notFound()
    }

    if (!purchaseOrder) {
      console.error("Purchase order not found for ID:", params.id)
      notFound()
    }

    // Fetch purchase order items separately
    const { data: purchaseOrderItems } = await supabase
      .from("purchase_order_itemstwo")
      .select(`
      id, 
      article_id, 
      ordered_quantity, 
      cost_price,
      articles:article_id (
        id, name, unit_of_measurement
      )
    `)
      .eq("po_id", params.id)

    // Add items to the purchase order object
    purchaseOrder.purchase_order_items = purchaseOrderItems || []

    // Fetch appointments for this PO
    const { data: appointments } = await supabase
      .from("inbound_appointments")
      .select("*")
      .eq("po_id", params.id)
      .order("appointment_date", { ascending: false })

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inbound Management: PO {purchaseOrder.id}</h1>
        <p className="text-muted-foreground">
          Manage inbound status, appointments, and goods receipt for this purchase order.
        </p>
        <InboundManagementForm purchaseOrder={purchaseOrder} appointments={appointments || []} />
      </div>
    )
  } catch (error) {
    console.error("Error in inbound detail page:", error)
    notFound()
  }
}
