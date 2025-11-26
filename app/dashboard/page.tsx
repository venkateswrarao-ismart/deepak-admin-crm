import { createSupabaseServerClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, ShoppingCart, Tags, AlertTriangle, CheckCircle2, Archive } from "lucide-react"
import Link from "next/link"
import { OrderAnalyticsCard } from "./_components/order-analytics-card"

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  // Fetch counts for dashboard metrics
  const [
    { count: articlesCount },
    { count: categoriesCount },
    { count: vendorsCount },
    { count: purchaseOrdersCount },
    { data: recentArticles },
    { data: recentPurchaseOrders },
  ] = await Promise.all([
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("vendors").select("*", { count: "exact", head: true }),
    supabase.from("purchase_orders").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }).limit(5),
  ])

  // Fetch order counts by status
  const { data: orderStatusData } = await supabase.rpc("get_order_status_stats")

  const orderStats = {
    total: orderStatusData?.reduce((sum, row) => sum + Number(row.count), 0) || 0,
    pending: Number(orderStatusData?.find((r) => r.status === "pending")?.count ?? 0),
    confirmed: Number(orderStatusData?.find((r) => r.status === "confirmed")?.count ?? 0),
    reminder: Number(orderStatusData?.find((r) => r.status === "reminder")?.count ?? 0),
    out_for_delivery: Number(orderStatusData?.find((r) => r.status === "out_for_delivery")?.count ?? 0),
    delivered: Number(orderStatusData?.find((r) => r.status === "delivered")?.count ?? 0),
    cancelled: Number(orderStatusData?.find((r) => r.status === "cancelled")?.count ?? 0),
  }

  // Fetch products data for stock analytics
  const { data: products } = await supabase.from("products").select("id, name, stock")

  // Stock analytics calculations
  const stockBaseValue = 10
  const totalProducts = products?.length || 0
  const criticalStock = products?.filter((product) => product.stock < stockBaseValue && product.stock > 0).length || 0
  const inStock = products?.filter((product) => product.stock >= stockBaseValue).length || 0
  const outOfStock = products?.filter((product) => product.stock === 0).length || 0

  // Calculate percentages for the chart
  const criticalStockPercentage = totalProducts > 0 ? (criticalStock / totalProducts) * 100 : 0
  const inStockPercentage = totalProducts > 0 ? (inStock / totalProducts) * 100 : 0
  const outOfStockPercentage = totalProducts > 0 ? (outOfStock / totalProducts) * 100 : 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center p-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 mr-4">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                <p className="text-2xl font-bold">{articlesCount || 0}</p>
              </div>
            </div>
            <div className="relative h-2 bg-gray-100">
              <div className="absolute top-0 left-0 h-full bg-blue-500" style={{ width: "65%" }}></div>
            </div>
            <div className="p-2 px-4">
              <p className="text-sm flex items-center text-green-500">
                <span className="inline-block mr-1">↑</span> 2.5%{" "}
                <span className="text-muted-foreground ml-1">since last week</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center p-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 mr-4">
                <Tags className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categoriesCount || 0}</p>
              </div>
            </div>
            <div className="relative h-2 bg-gray-100">
              <div className="absolute top-0 left-0 h-full bg-purple-500" style={{ width: "45%" }}></div>
            </div>
            <div className="p-2 px-4">
              <p className="text-sm flex items-center text-green-500">
                <span className="inline-block mr-1">↑</span> 1.2%{" "}
                <span className="text-muted-foreground ml-1">since last week</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center p-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-100 mr-4">
                <Users className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendors</p>
                <p className="text-2xl font-bold">{vendorsCount || 0}</p>
              </div>
            </div>
            <div className="relative h-2 bg-gray-100">
              <div className="absolute top-0 left-0 h-full bg-amber-500" style={{ width: "55%" }}></div>
            </div>
            <div className="p-2 px-4">
              <p className="text-sm flex items-center text-red-500">
                <span className="inline-block mr-1">↓</span> 0.5%{" "}
                <span className="text-muted-foreground ml-1">since last week</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center p-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100 mr-4">
                <ShoppingCart className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchase Orders</p>
                <p className="text-2xl font-bold">{purchaseOrdersCount || 0}</p>
              </div>
            </div>
            <div className="relative h-2 bg-gray-100">
              <div className="absolute top-0 left-0 h-full bg-green-500" style={{ width: "70%" }}></div>
            </div>
            <div className="p-2 px-4">
              <p className="text-sm flex items-center text-green-500">
                <span className="inline-block mr-1">↑</span> 4.2%{" "}
                <span className="text-muted-foreground ml-1">since last week</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <OrderAnalyticsCard initialOrderStats={orderStats} />
        {/* Product Stock Analytics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Articles(Products) Stock Analytics</CardTitle>
            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Base Value: {stockBaseValue}
            </span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Link href="/dashboard/products?tab=in_stock" className="w-full">
                <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow duration-200 h-full">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">{inStock}</p>
                  <span className="text-xs text-muted-foreground mt-1">
                    {inStockPercentage.toFixed(1)}% of products
                  </span>
                </div>
              </Link>

              <Link href="/dashboard/products?tab=low_stock" className="w-full">
                <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow duration-200 h-full">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-3">
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Critical Stock</p>
                  <p className="text-2xl font-bold text-amber-600">{criticalStock}</p>
                  <span className="text-xs text-muted-foreground mt-1">
                    {criticalStockPercentage.toFixed(1)}% of products
                  </span>
                </div>
              </Link>

              <Link href="/dashboard/products?tab=critical_stock" className="w-full">
                <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow duration-200 h-full">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
                    <Archive className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
                  <span className="text-xs text-muted-foreground mt-1">
                    {outOfStockPercentage.toFixed(1)}% of products
                  </span>
                </div>
              </Link>
            </div>

            <div className="mt-4">
              <div className="flex justify-between mb-3 text-sm font-medium">
                <span>Stock Status Distribution</span>
                <span>Total Products: {totalProducts}</span>
              </div>

              {/* Horizontal Bar Graph */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                {/* In Stock Bar */}
                <div className="flex items-center">
                  <div className="w-24 min-w-24 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
                    <span className="text-xs font-medium">In Stock</span>
                  </div>
                  <div className="flex-1 h-8 bg-gray-200 rounded-md relative">
                    <div
                      className="h-full bg-green-500 rounded-md border border-green-600 shadow-sm flex items-center"
                      style={{ width: `${Math.max(5, inStockPercentage)}%` }}
                    >
                      <span className="ml-2 text-xs font-medium text-white">
                        {inStock} ({inStockPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Critical Stock Bar */}
                <div className="flex items-center">
                  <div className="w-24 min-w-24 flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-sm mr-2"></div>
                    <span className="text-xs font-medium">Critical</span>
                  </div>
                  <div className="flex-1 h-8 bg-gray-200 rounded-md relative">
                    <div
                      className="h-full bg-amber-500 rounded-md border border-amber-600 shadow-sm flex items-center"
                      style={{ width: `${Math.max(5, criticalStockPercentage)}%` }}
                    >
                      <span className="ml-2 text-xs font-medium text-white">
                        {criticalStock} ({criticalStockPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Out of Stock Bar */}
                <div className="flex items-center">
                  <div className="w-24 min-w-24 flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-sm mr-2"></div>
                    <span className="text-xs font-medium">Out of Stock</span>
                  </div>
                  <div className="flex-1 h-8 bg-gray-200 rounded-md relative">
                    <div
                      className="h-full bg-red-500 rounded-md border border-red-600 shadow-sm flex items-center"
                      style={{ width: `${Math.max(5, outOfStockPercentage)}%` }}
                    >
                      <span className="ml-2 text-xs font-medium text-white">
                        {outOfStock} ({outOfStockPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <span className="mr-2">Base Value:</span>
                  <span className="font-medium">
                    In Stock (≥{stockBaseValue}), Critical (1-{stockBaseValue - 1}), Out of Stock (0)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Articles</CardTitle>
            <CardDescription>Latest products added to inventory</CardDescription>
          </CardHeader>
          <CardContent>
            {recentArticles && recentArticles.length > 0 ? (
              <div className="space-y-4">
                {recentArticles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{article.name || "Unnamed Article"}</p>
                      <p className="text-sm text-muted-foreground">ID: {article.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{article.mrp || 0}</p>
                      <p className="text-sm text-muted-foreground">MRP</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent articles found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Purchase Orders</CardTitle>
            <CardDescription>Latest orders placed with vendors</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPurchaseOrders && recentPurchaseOrders.length > 0 ? (
              <div className="space-y-4">
                {recentPurchaseOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">PO: {order.id}</p>
                      <p className="text-sm text-muted-foreground">Vendor: {order.vendor_name || order.vendor_id}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          order.po_status === "Approved"
                            ? "text-green-500"
                            : order.po_status === "Cancelled"
                              ? "text-red-500"
                              : "text-yellow-500"
                        }`}
                      >
                        {order.po_status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at || "").toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent purchase orders found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Card in a new row */}

      {/* New section based on the provided design */}
      {/*
      {/* New section based on the provided design */}
    </div>
  )
}
