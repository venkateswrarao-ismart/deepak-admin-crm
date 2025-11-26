import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { SOHReportClient } from "./client"

export const dynamic = "force-dynamic"

// Define the stock item type
export type StockItem = {
  id: string
  article_id: string
  name: string
  quantity: number
  openingQuantity: number
  location: string
  reorderLevel: number
  status: "In Stock" | "Low Stock" | "Critical"
  category: string
}

// This function will run on the server
async function getStockData() {
  const supabase = createServerComponentClient({ cookies })

  // Fetch products data
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, article_id, name, stock, category, price, mrp, cost_price")

  if (productsError) {
    console.error("Error fetching products:", productsError)
    return []
  }

  // Transform products data to stock items
  const stockItems: StockItem[] = products.map((product) => {
    // Calculate status based on stock level and reorder level
    // Assuming reorder level is 20% of current stock for this example
    const reorderLevel = Math.round(product.stock * 0.2) || 10
    let status: "In Stock" | "Low Stock" | "Critical" = "In Stock"

    if (product.stock <= reorderLevel * 0.5) {
      status = "Critical"
    } else if (product.stock <= reorderLevel) {
      status = "Low Stock"
    }

    // For this example, we'll use a placeholder for location
    // In a real system, you would fetch this from a locations table
    const location = `Warehouse - ${product.article_id ? product.article_id.substring(0, 2).toUpperCase() : "NA"}`

    // For opening quantity, we'll use current stock + 10% as an example
    // In a real system, you would fetch this from inventory history
    const openingQuantity = Math.round(product.stock * 1.1)

    return {
      id: product.id,
      article_id: product.article_id || product.id,
      name: product.name,
      quantity: product.stock,
      openingQuantity,
      location,
      reorderLevel,
      status,
      category: product.category || "Uncategorized",
    }
  })

  return stockItems
}

// Server component for fetching data
export default async function SOHReportPage() {
  // Fetch data on the server
  const stockData = await getStockData()

  // The rest of the component will be hydrated on the client
  return (
    <div className="space-y-4">
      <SOHReportClient initialStockData={stockData} />
    </div>
  )
}
