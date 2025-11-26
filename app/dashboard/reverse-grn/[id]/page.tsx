import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import ReverseGRNDetailClient from "./ReverseGRNDetailClient"

export const metadata: Metadata = {
  title: "Return Details | Inventory Management",
  description: "View details of a product return",
}

export default async function ReverseGRNDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies })

  // Fetch the reverse GRN record
  const { data: reverseGRN, error: reverseGRNError } = await supabase
    .from("reverse_grn")
    .select(`
      *,
      goods_receipt_notes:grn_id (
        *,
        purchase_orders:po_id (
          vendor_name,
          vendor_address,
          vendor_phone
        )
      )
    `)
    .eq("id", params.id)
    .single()

  if (reverseGRNError || !reverseGRN) {
    console.error("Error fetching reverse GRN:", reverseGRNError)
    notFound()
  }

  // Fetch the reverse GRN items
  const { data: reverseGRNItems, error: itemsError } = await supabase
    .from("reverse_grn_items")
    .select("*")
    .eq("reverse_grn_id", params.id)

  if (itemsError) {
    console.error("Error fetching reverse GRN items:", itemsError)
  }

  // Fetch product details for each item
  const items = await Promise.all(
    (reverseGRNItems || []).map(async (item) => {
      const { data: product } = await supabase
        .from("products")
        .select("name")
        .eq("article_id", item.article_id)
        .single()

      // Fetch original GRN item to get received quantity
      const { data: grnItem } = await supabase
        .from("grn_items")
        .select("received_quantity")
        .eq("id", item.grn_item_id)
        .single()

      return {
        id: item.id,
        productId: item.article_id,
        productName: product?.name || `Product (${item.article_id})`,
        receivedQuantity: grnItem?.received_quantity || 0,
        returnQuantity: item.returned_quantity,
        unitPrice: item.unit_price,
        reason: item.reason,
      }
    }),
  )

  const totalValue = items.reduce((sum, item) => sum + item.returnQuantity * item.unitPrice, 0)
  const totalQuantity = items.reduce((sum, item) => sum + item.returnQuantity, 0)

  // Get vendor information
  const vendorName = reverseGRN.goods_receipt_notes?.purchase_orders?.vendor_name || "N/A"
  const vendorAddress = reverseGRN.goods_receipt_notes?.purchase_orders?.vendor_address || "N/A"
  const vendorContact = reverseGRN.goods_receipt_notes?.purchase_orders?.vendor_phone || "N/A"

  return (
    <ReverseGRNDetailClient
      reverseGRN={reverseGRN}
      items={items}
      vendorName={vendorName}
      vendorAddress={vendorAddress}
      vendorContact={vendorContact}
      totalValue={totalValue}
      totalQuantity={totalQuantity}
    />
  )
}
