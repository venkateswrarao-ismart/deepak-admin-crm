import type { Metadata } from "next"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import ReverseGRNClient from "./client"

export const metadata: Metadata = {
  title: "Reverse GRN | Inventory Management",
  description: "Manage returns and corrections to received goods",
}

async function getReverseGRNData() {
  const supabase = createServerComponentClient({ cookies })

  const { data: reverseGRNs, error } = await supabase
    .from("reverse_grn")
    .select(`
      id,
      grn_id,
      return_date,
      status,
      reason,
      notes,
      goods_receipt_notes!inner(
        id,
        po_id,
        invoice_number,
        purchase_orders(
          vendor_id,
          vendor_name
        )
      ),
      reverse_grn_items(
        id,
        article_id,
        returned_quantity,
        unit_price
      )
    `)
    .order("return_date", { ascending: false })

  if (error) {
    console.error("Error fetching reverse GRN data:", error)
    return []
  }

  // Transform the data to match the UI requirements
  return reverseGRNs.map((rgrn) => {
    // Calculate total items and value
    const totalItems = rgrn.reverse_grn_items?.length || 0
    const totalValue =
      rgrn.reverse_grn_items?.reduce((sum, item) => sum + item.returned_quantity * item.unit_price, 0) || 0

    // Get vendor name from the nested data
    const vendorName = rgrn.goods_receipt_notes?.purchase_orders?.vendor_name || "Unknown Vendor"

    return {
      id: rgrn.id,
      grnId: rgrn.grn_id,
      vendorName,
      returnDate: new Date(rgrn.return_date).toISOString().split("T")[0],
      status: rgrn.status || "Draft",
      totalItems,
      totalValue,
      reason: rgrn.reason,
    }
  })
}

export default async function ReverseGRNPage() {
  const reverseGRNs = await getReverseGRNData()
  return <ReverseGRNClient reverseGRNs={reverseGRNs} />
}
