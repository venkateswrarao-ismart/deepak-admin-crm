import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { MRPClient } from "./client"

export const dynamic = "force-dynamic"

// Server component to fetch data
export default async function MRPUpdatePage() {
  const supabase = createServerComponentClient({ cookies })

  // Fetch products data
  const { data: products, error } = await supabase.from("products").select("*").order("name")

  if (error) {
    console.error("Error fetching products:", error)
    return <div>Error loading product data. Please try again later.</div>
  }

  // Transform products data into MRP items
  const mrpItems = products.map((product) => {
    // Calculate suggested reorder level (example: 30% of current stock or minimum 10)
    const currentStock = product.stock || 0
    const reorderLevel = Math.max(Math.floor(currentStock * 0.2), 10)
    const suggestedReorderLevel = Math.max(Math.floor(currentStock * 0.3), 15)

    // Determine status based on stock levels
    let status = "Normal"
    if (currentStock <= reorderLevel * 0.5) {
      status = "Critical"
    } else if (currentStock <= reorderLevel) {
      status = "Low Stock"
    } else if (currentStock >= reorderLevel * 3) {
      status = "Overstocked"
    }

    // Calculate average demand (example calculation)
    const averageDemand = `${Math.max(1, Math.floor(currentStock * 0.05))} units/day`

    // Set lead time (example)
    const leadTime = `${Math.floor(Math.random() * 10) + 1} days`

    return {
      id: product.article_id || `unknown-${product.id}`,
      name: product.name,
      currentStock: currentStock,
      reorderLevel: reorderLevel,
      suggestedReorderLevel: suggestedReorderLevel,
      averageDemand: averageDemand,
      leadTime: leadTime,
      status: status,
      lastUpdated: product.updated_at
        ? new Date(product.updated_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    }
  })

  return <MRPClient initialMrpItems={mrpItems} />
}
