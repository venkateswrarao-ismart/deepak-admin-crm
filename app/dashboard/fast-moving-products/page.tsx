"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, TrendingUp, Package, ArrowUpRight, AlertCircle } from "lucide-react"
import { FastMovingProductsChart } from "./_components/fast-moving-products-chart"
import { FastMovingProductsTable } from "./_components/fast-moving-products-table"
import { DateRangePicker } from "./_components/date-range-picker"
import { subDays, format, isValid } from "date-fns"
import { createClient } from "@/utils/supabase/client"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

// Add custom flashing animation
const flashingAnimation = `
  @keyframes flash {
    0%, 100% { 
      opacity: 1;
      background-position: 0% 50%;
      transform: scale(1);
    }
    50% { 
      opacity: 0.7;
      background-position: 100% 50%;
      transform: scale(1.02);
    }
  }
  .animate-flash {
    animation: flash 1.5s infinite;
    background: linear-gradient(90deg, #10b981, #0ea5e9, #10b981);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-fill-color: transparent;
    display: inline-block;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .animate-flash:hover {
    animation-play-state: paused;
    transform: scale(1.05);
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`

export default function FastMovingProductsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState({
    productsWithCategories: [],
    totalQuantitySold: 0,
    totalOrders: 0,
    fromDate: subDays(new Date(), 30),
    toDate: new Date(),
  })

  const searchParams = useSearchParams()
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        // Get date range from query params or default to last 30 days
        const today = new Date()

        // Safely parse the 'to' date parameter
        let toDate = today
        if (toParam) {
          try {
            const parsedToDate = new Date(toParam)
            if (isValid(parsedToDate)) {
              toDate = parsedToDate
            }
          } catch (e) {
            console.error("Invalid 'to' date parameter:", e)
          }
        }

        // Safely parse the 'from' date parameter or default to 30 days before 'to' date
        let fromDate = subDays(toDate, 30)
        if (fromParam) {
          try {
            const parsedFromDate = new Date(fromParam)
            if (isValid(parsedFromDate)) {
              fromDate = parsedFromDate
            }
          } catch (e) {
            console.error("Invalid 'from' date parameter:", e)
          }
        }

        // Format dates for Supabase query - ensure they're valid ISO strings
        const fromDateStr = fromDate.toISOString()
        const toDateStr = toDate.toISOString()

        console.log("Date range:", { fromDateStr, toDateStr })

        // Fetch fast-moving products data with explicit join
        const { data: orderItems, error: orderItemsError } = await supabase
          .from("order_items")
          .select(`
            id,
            order_id,
            product_id,
            quantity,
            unit_price,
            created_at
          `)
          .gte("created_at", fromDateStr)
          .lte("created_at", toDateStr)
          .not("product_id", "is", null)
          .order("created_at", { ascending: false })

        if (orderItemsError) {
          console.error("Error fetching order items:", orderItemsError)
          throw new Error(`Error fetching order items: ${orderItemsError.message}`)
        }

        console.log(`Fetched ${orderItems?.length || 0} order items`)

        // Get unique product IDs
        const productIds = [...new Set(orderItems?.map((item) => item.product_id).filter(Boolean))]

        if (productIds.length === 0) {
          setData({
            productsWithCategories: [],
            totalQuantitySold: 0,
            totalOrders: 0,
            fromDate,
            toDate,
          })
          setIsLoading(false)
          return
        }

        // Fetch product details in a separate query
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select(`
            id,
            name,
            article_id,
            stock,
            image_url,
            category_id,
            price,
            selling_price
          `)
          .in("id", productIds)

        if (productsError) {
          console.error("Error fetching products:", productsError)
          throw new Error(`Error fetching products: ${productsError.message}`)
        }

        console.log(`Fetched ${products?.length || 0} products`)

        // Create a map of products for easy lookup
        const productsMap = {}
        products?.forEach((product) => {
          if (product && product.id) {
            productsMap[product.id] = product
          }
        })

        // Process data to get total quantity sold per product
        const productSales = {}

        orderItems?.forEach((item) => {
          if (!item.product_id || !productsMap[item.product_id]) return

          const productId = item.product_id
          const product = productsMap[productId]

          if (!productSales[productId]) {
            productSales[productId] = {
              id: productId,
              name: product.name || "Unknown Product",
              article_id: product.article_id,
              stock: product.stock || 0,
              image_url: product.image_url,
              category_id: product.category_id,
              price: product.selling_price || product.price || 0,
              totalQuantity: 0,
              totalSales: 0,
              orderCount: 0,
            }
          }

          productSales[productId].totalQuantity += Number(item.quantity) || 0
          productSales[productId].totalSales += (Number(item.quantity) || 0) * (Number(item.unit_price) || 0)
          productSales[productId].orderCount += 1
        })

        // Convert to array and sort by total quantity
        const sortedProducts = Object.values(productSales)
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .slice(0, 10) // Top 10 products

        // Get total orders count for the period
        const { count: totalOrders, error: ordersError } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("created_at", fromDateStr)
          .lte("created_at", toDateStr)

        if (ordersError) {
          console.error("Error fetching orders count:", ordersError)
        }

        // Get total quantity sold in the period
        const totalQuantitySold = sortedProducts.reduce((sum, product) => sum + product.totalQuantity, 0)

        // Fetch category information for products
        const categoryIds = [...new Set(sortedProducts.map((product) => product.category_id).filter(Boolean))]

        let categories = {}
        if (categoryIds.length > 0) {
          const { data: categoryData, error: categoryError } = await supabase
            .from("categories")
            .select("id, name")
            .in("id", categoryIds)

          if (categoryError) {
            console.error("Error fetching categories:", categoryError)
          }

          if (categoryData) {
            categories = categoryData.reduce((acc, cat) => {
              if (cat && cat.id) {
                acc[cat.id] = cat.name || "Unnamed Category"
              }
              return acc
            }, {})
          }
        }

        // Add category names to products
        const productsWithCategories = sortedProducts.map((product) => ({
          ...product,
          category_name:
            product.category_id && categories[product.category_id] ? categories[product.category_id] : "Uncategorized",
        }))

        setData({
          productsWithCategories,
          totalQuantitySold,
          totalOrders: totalOrders || 0,
          fromDate,
          toDate,
        })
      } catch (err) {
        console.error("Error in fetchData:", err)
        setError(err.message || "An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [fromParam, toParam])

  // Format date for display
  const formatDisplayDate = (date) => {
    return format(date, "MMM d, yyyy")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <style jsx global>
          {flashingAnimation}
        </style>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight animate-flash"
              style={{ textShadow: "0 1px 1px rgba(0,0,0,0.1)" }}
              onClick={() => window.location.reload()}
              title="Click to refresh data"
            >
              Fast-Moving Products
            </h1>
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium bg-gray-200 animate-pulse h-4 w-24 rounded"></CardTitle>
                <div className="h-4 w-4 bg-gray-200 animate-pulse rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 animate-pulse rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <style jsx global>
          {flashingAnimation}
        </style>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight animate-flash"
              style={{ textShadow: "0 1px 1px rgba(0,0,0,0.1)" }}
              onClick={() => window.location.reload()}
              title="Click to refresh data"
            >
              Fast-Moving Products
            </h1>
            <p className="text-muted-foreground">Analysis of top-selling products</p>
          </div>
          <DateRangePicker />
        </div>
        <Card className="p-6">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p>An unexpected error occurred: {error}</p>
          </div>
          <div className="mt-4">
            <Button onClick={() => (window.location.href = "/dashboard/fast-moving-products")} variant="outline">
              Reset Filters
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const { productsWithCategories, totalQuantitySold, totalOrders, fromDate, toDate } = data

  if (productsWithCategories.length === 0) {
    return (
      <div className="space-y-6">
        <style jsx global>
          {flashingAnimation}
        </style>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight animate-flash"
              style={{ textShadow: "0 1px 1px rgba(0,0,0,0.1)" }}
              onClick={() => window.location.reload()}
              title="Click to refresh data"
            >
              Fast-Moving Products
            </h1>
            <p className="text-muted-foreground">
              Analysis of top-selling products from {formatDisplayDate(fromDate)} to {formatDisplayDate(toDate)}
            </p>
          </div>
          <DateRangePicker />
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No product data available for the selected period.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <style jsx global>
        {flashingAnimation}
      </style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight animate-flash"
            style={{ textShadow: "0 1px 1px rgba(0,0,0,0.1)" }}
            onClick={() => window.location.reload()}
            title="Click to refresh data"
          >
            Fast-Moving Products
          </h1>
          <p className="text-muted-foreground">
            Analysis of top-selling products from {formatDisplayDate(fromDate)} to {formatDisplayDate(toDate)}
          </p>
        </div>
        <DateRangePicker />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/products" className="block transition-transform hover:scale-105">
          <Card className="h-full cursor-pointer hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products Sold</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantitySold}</div>
              <p className="text-xs text-muted-foreground">Units sold in selected period</p>
            </CardContent>
          </Card>
        </Link>

        <Link
          href={
            productsWithCategories[0]?.id
              ? `/dashboard/products/view/${productsWithCategories[0]?.id}`
              : "/dashboard/products"
          }
          className="block transition-transform hover:scale-105"
        >
          <Card className="h-full cursor-pointer hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Product</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={productsWithCategories[0]?.name || "N/A"}>
                {productsWithCategories[0]?.name || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {productsWithCategories[0]?.totalQuantity || 0} units sold
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/orders" className="block transition-transform hover:scale-105">
          <Card className="h-full cursor-pointer hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">Orders in selected period</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/products?tab=low_stock" className="block transition-transform hover:scale-105">
          <Card className="h-full cursor-pointer hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Check</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {productsWithCategories.filter((p) => p.stock < p.totalQuantity / 2).length}
              </div>
              <p className="text-xs text-muted-foreground">Products needing restock</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Fast-Moving Products</CardTitle>
              <CardDescription>Products with highest sales quantity in the selected period</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <FastMovingProductsChart data={productsWithCategories} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fast-Moving Products Details</CardTitle>
              <CardDescription>Detailed breakdown of top-selling products</CardDescription>
            </CardHeader>
            <CardContent>
              <FastMovingProductsTable data={productsWithCategories} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Insights</CardTitle>
          <CardDescription>Recommendations based on fast-moving product analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productsWithCategories.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="font-medium">Restock Recommendations</h3>
                    <ul className="space-y-1">
                      {productsWithCategories
                        .filter((product) => product.stock < product.totalQuantity / 2)
                        .slice(0, 3)
                        .map((product) => (
                          <li key={product.id} className="text-sm">
                            <div className="flex items-center">
                              <span className="truncate">{product.name}</span>
                              <span className="ml-2 text-xs text-red-500 whitespace-nowrap">
                                (Only {product.stock} left in stock)
                              </span>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Trending Products</h3>
                    <ul className="space-y-1">
                      {productsWithCategories.slice(0, 3).map((product) => (
                        <li key={product.id} className="text-sm">
                          <div className="flex items-center">
                            <span className="truncate">{product.name}</span>
                            <span className="ml-2 text-xs text-green-500 whitespace-nowrap">
                              ({product.totalQuantity} units sold)
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Based on your sales data, consider increasing inventory for your top-selling products. Products with
                    low stock relative to their sales velocity should be prioritized for restocking.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No product data available for the selected period.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
