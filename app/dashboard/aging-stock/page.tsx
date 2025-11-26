"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, AlertCircle, Clock, TrendingDown, BarChart4, ArrowDownUp } from "lucide-react"
import { AgingStockChart } from "./_components/aging-stock-chart"
import { AgingStockTable } from "./_components/aging-stock-table"
import { DateRangePicker } from "./_components/date-range-picker"
import { subDays, format, isValid, differenceInDays } from "date-fns"
import { createClient } from "@/utils/supabase/client"
import { useSearchParams } from "next/navigation"

// Define the flashing animation
const flashingAnimation = `
  @keyframes flash {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
    100% {
      opacity: 1;
    }
  }
  .animate-flash {
    animation: flash 2s infinite;
    cursor: pointer;
  }
`

export default function AgingStockPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("chart")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [sortField, setSortField] = useState<"salesQuantity" | "ageDays" | "inventoryValue">("salesQuantity")
  const [data, setData] = useState({
    allProducts: [], // All products with stock
    agingProducts: [], // Products aging over threshold (15 days)
    totalAgingValue: 0,
    oldestProduct: null,
    averageAge: 0,
    fromDate: subDays(new Date(), 30),
    toDate: new Date(),
    agingCategories: {
      "0-15 days": { count: 0, value: 0 },
      "16-30 days": { count: 0, value: 0 },
      "31-45 days": { count: 0, value: 0 },
      "45+ days": { count: 0, value: 0 },
    },
  })

  const searchParams = useSearchParams()
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  // Function to sort products based on current sort field and order
  const sortProducts = (products, field = sortField, order = sortOrder) => {
    return [...products].sort((a, b) => {
      const valueA = a[field] || 0
      const valueB = b[field] || 0

      return order === "asc" ? valueA - valueB : valueB - valueA
    })
  }

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
        let fromDate = subDays(toDate, 30) // Default to 30 days
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

        // Fetch all products with stock > 0
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
            selling_price,
            created_at,
            updated_at,
            description,
            brand,
            unit_of_measurement,
            weight
          `)
          .gt("stock", 0) // Only include products with stock
          .eq("isactive", true) // Only active products
          .order("created_at", { ascending: true }) // Oldest first

        if (productsError) {
          console.error("Error fetching products:", productsError)
          throw new Error(`Error fetching products: ${productsError.message}`)
        }

        // Fetch all order items within the date range
        const { data: orderItems, error: orderItemsError } = await supabase
          .from("order_items")
          .select(`
            id,
            order_id,
            product_id,
            quantity,
            unit_price,
            created_at,
            orders(status)
          `)
          .gte("created_at", fromDateStr)
          .lte("created_at", toDateStr)

        if (orderItemsError) {
          console.error("Error fetching order items:", orderItemsError)
          throw new Error(`Error fetching order items: ${orderItemsError.message}`)
        }

        // Calculate sales quantity and last sale date for each product
        const salesQuantities = {}
        const lastOrderDates = {}
        const totalSalesValue = {}

        // Only count completed orders
        const validOrderItems =
          orderItems?.filter((item) => item.orders?.status === "delivered" || item.orders?.status === "completed") || []

        validOrderItems.forEach((item) => {
          if (!item.product_id) return

          // Calculate sales quantity
          if (!salesQuantities[item.product_id]) {
            salesQuantities[item.product_id] = 0
            totalSalesValue[item.product_id] = 0
          }

          salesQuantities[item.product_id] += item.quantity || 0
          totalSalesValue[item.product_id] += (item.quantity || 0) * (item.unit_price || 0)

          // Track last sale date
          if (
            !lastOrderDates[item.product_id] ||
            new Date(item.created_at) > new Date(lastOrderDates[item.product_id])
          ) {
            lastOrderDates[item.product_id] = item.created_at
          }
        })

        // Process all products
        const allProductsWithData = []
        const agingProducts = []
        let totalAgingValue = 0
        let oldestProduct = null
        let totalAgeDays = 0

        const agingCategories = {
          "0-15 days": { count: 0, value: 0 },
          "16-30 days": { count: 0, value: 0 },
          "31-45 days": { count: 0, value: 0 },
          "45+ days": { count: 0, value: 0 },
        }

        // Base aging period is 15 days
        const AGING_THRESHOLD = 15

        products?.forEach((product) => {
          // Skip products with no stock
          if (!product.stock || product.stock <= 0) return

          // Calculate days since last order or creation date if no orders
          const lastOrderDate = lastOrderDates[product.id]
          const referenceDate = lastOrderDate ? new Date(lastOrderDate) : new Date(product.created_at)
          const ageDays = differenceInDays(toDate, referenceDate)

          // Calculate inventory value
          const price = product.selling_price || product.price || 0
          const inventoryValue = price * product.stock

          // Add sales data
          const salesQuantity = salesQuantities[product.id] || 0
          const salesValue = totalSalesValue[product.id] || 0

          // Calculate sales velocity (units sold per day)
          const daysBetween = Math.max(1, differenceInDays(toDate, fromDate))
          const salesVelocity = salesQuantity / daysBetween

          // Calculate days of inventory remaining based on sales velocity
          const daysOfInventory = salesVelocity > 0 ? Math.round(product.stock / salesVelocity) : 999

          // Determine age category
          let ageCategory = "0-15 days"
          if (ageDays > 45) {
            ageCategory = "45+ days"
          } else if (ageDays > 30) {
            ageCategory = "31-45 days"
          } else if (ageDays > 15) {
            ageCategory = "16-30 days"
          }

          // Add to aging categories
          agingCategories[ageCategory].count += 1
          agingCategories[ageCategory].value += inventoryValue

          // Create product object with all data
          const productWithData = {
            ...product,
            lastSaleDate: lastOrderDate || null,
            ageDays,
            ageCategory,
            inventoryValue,
            salesQuantity,
            salesValue,
            salesVelocity,
            daysOfInventory,
          }

          // Add to all products array
          allProductsWithData.push(productWithData)

          // If product is aging (over threshold), add to aging products
          if (ageDays > AGING_THRESHOLD) {
            agingProducts.push(productWithData)

            totalAgingValue += inventoryValue
            totalAgeDays += ageDays

            // Track oldest product
            if (!oldestProduct || ageDays > oldestProduct.ageDays) {
              oldestProduct = { ...productWithData }
            }
          }
        })

        // Calculate average age for aging products
        const averageAge = agingProducts.length > 0 ? Math.round(totalAgeDays / agingProducts.length) : 0

        // Fetch category information for products
        const categoryIds = [...new Set(allProductsWithData.map((product) => product.category_id).filter(Boolean))]

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
        const addCategoryNames = (products) => {
          return products.map((product) => ({
            ...product,
            category_name:
              product.category_id && categories[product.category_id]
                ? categories[product.category_id]
                : "Uncategorized",
          }))
        }

        const allProductsWithCategories = addCategoryNames(allProductsWithData)
        const agingProductsWithCategories = addCategoryNames(agingProducts)

        // Sort products by the current sort field and order
        const sortedAllProducts = sortProducts(allProductsWithCategories)
        const sortedAgingProducts = sortProducts(agingProductsWithCategories)

        setData({
          allProducts: sortedAllProducts,
          agingProducts: sortedAgingProducts,
          totalAgingValue,
          oldestProduct,
          averageAge,
          fromDate,
          toDate,
          agingCategories,
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Handle sort change
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortOrder("asc")
    }

    // Re-sort the data
    const sortedAllProducts = sortProducts(
      data.allProducts,
      field,
      field === sortField && sortOrder === "asc" ? "desc" : "asc",
    )
    const sortedAgingProducts = sortProducts(
      data.agingProducts,
      field,
      field === sortField && sortOrder === "asc" ? "desc" : "asc",
    )

    setData({
      ...data,
      allProducts: sortedAllProducts,
      agingProducts: sortedAgingProducts,
    })
  }

  if (isLoading) {
    return (
      <>
        <style jsx global>
          {flashingAnimation}
        </style>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1
                className="text-3xl font-bold tracking-tight animate-flash bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-700 text-transparent bg-clip-text"
                style={{ textShadow: "0 1px 1px rgba(0,0,0,0.05)" }}
                onClick={() => window.location.reload()}
                title="Click to refresh data"
              >
                Aging Stock
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
      </>
    )
  }

  if (error) {
    return (
      <>
        <style jsx global>
          {flashingAnimation}
        </style>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1
                className="text-3xl font-bold tracking-tight animate-flash bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-700 text-transparent bg-clip-text"
                style={{ textShadow: "0 1px 1px rgba(0,0,0,0.05)" }}
                onClick={() => window.location.reload()}
                title="Click to refresh data"
              >
                Aging Stock
              </h1>
              <p className="text-muted-foreground">Analysis of slow-moving inventory</p>
            </div>
            <DateRangePicker />
          </div>
          <Card className="p-6">
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <p>An unexpected error occurred: {error}</p>
            </div>
            <div className="mt-4">
              <Button onClick={() => (window.location.href = "/dashboard/aging-stock")} variant="outline">
                Reset Filters
              </Button>
            </div>
          </Card>
        </div>
      </>
    )
  }

  const { allProducts, agingProducts, totalAgingValue, oldestProduct, averageAge, fromDate, toDate, agingCategories } =
    data

  // Determine which products to display based on active tab
  const displayProducts = activeTab === "aging" ? agingProducts : allProducts

  if (displayProducts.length === 0) {
    return (
      <>
        <style jsx global>
          {flashingAnimation}
        </style>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1
                className="text-3xl font-bold tracking-tight animate-flash bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-700 text-transparent bg-clip-text"
                style={{ textShadow: "0 1px 1px rgba(0,0,0,0.05)" }}
                onClick={() => window.location.reload()}
                title="Click to refresh data"
              >
                Aging Stock
              </h1>
              <p className="text-muted-foreground">
                Analysis of slow-moving inventory from {formatDisplayDate(fromDate)} to {formatDisplayDate(toDate)}
              </p>
            </div>
            <DateRangePicker />
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No products found for the selected period.</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx global>
        {flashingAnimation}
      </style>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight animate-flash bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-700 text-transparent bg-clip-text"
              style={{ textShadow: "0 1px 1px rgba(0,0,0,0.05)" }}
              onClick={() => window.location.reload()}
              title="Click to refresh data"
            >
              Aging Stock
            </h1>
            <p className="text-muted-foreground">
              Analysis of slow-moving inventory from {formatDisplayDate(fromDate)} to {formatDisplayDate(toDate)}
            </p>
          </div>
          <DateRangePicker />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-sm transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Aging Value</CardTitle>
              <div className="flex items-center">
                <Package className="h-4 w-4 text-muted-foreground mr-1" />
                <ArrowDownUp className="h-3 w-3 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalAgingValue)}</div>
              <p className="text-xs text-muted-foreground">Value of inventory aging over 15 days</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-amber-500"
            onClick={() => oldestProduct?.id && (window.location.href = `/dashboard/products/view/${oldestProduct.id}`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Oldest Product</CardTitle>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                <ArrowDownUp className="h-3 w-3 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={oldestProduct?.name || "N/A"}>
                {oldestProduct?.name || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {oldestProduct ? `${oldestProduct.ageDays} days without sales` : "No aging products"}
              </p>
              {oldestProduct && (
                <div className="mt-2 text-xs text-blue-500 flex items-center">
                  View product details <span className="ml-1">→</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Age</CardTitle>
              <div className="flex items-center">
                <BarChart4 className="h-4 w-4 text-muted-foreground mr-1" />
                <ArrowDownUp className="h-3 w-3 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageAge} days</div>
              <p className="text-xs text-muted-foreground">Average age of slow-moving inventory</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
              <div className="flex items-center">
                <TrendingDown className="h-4 w-4 text-muted-foreground mr-1" />
                <ArrowDownUp className="h-3 w-3 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agingProducts.filter((p) => p.ageDays > 45).length}</div>
              <p className="text-xs text-muted-foreground">Products aging over 45 days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="aging">Aging Products</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aging Stock Distribution</CardTitle>
                <CardDescription>Breakdown of inventory by age category</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <AgingStockChart data={agingCategories} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aging Stock Details</CardTitle>
                <CardDescription>Detailed breakdown of slow-moving products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Showing {activeTab === "all" ? "all" : "aging"} products ({displayProducts.length})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={sortField === "salesQuantity" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort("salesQuantity")}
                      className="flex items-center gap-1"
                    >
                      Sales Quantity
                      {sortField === "salesQuantity" && (
                        <ArrowDownUp
                          className="h-3 w-3"
                          style={{ transform: sortOrder === "desc" ? "rotate(180deg)" : "" }}
                        />
                      )}
                    </Button>
                    <Button
                      variant={sortField === "ageDays" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort("ageDays")}
                      className="flex items-center gap-1"
                    >
                      Age
                      {sortField === "ageDays" && (
                        <ArrowDownUp
                          className="h-3 w-3"
                          style={{ transform: sortOrder === "desc" ? "rotate(180deg)" : "" }}
                        />
                      )}
                    </Button>
                    <Button
                      variant={sortField === "inventoryValue" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort("inventoryValue")}
                      className="flex items-center gap-1"
                    >
                      Value
                      {sortField === "inventoryValue" && (
                        <ArrowDownUp
                          className="h-3 w-3"
                          style={{ transform: sortOrder === "desc" ? "rotate(180deg)" : "" }}
                        />
                      )}
                    </Button>
                  </div>
                </div>
                <AgingStockTable data={displayProducts} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Products</CardTitle>
                <CardDescription>Complete inventory with sales data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Showing all products
                      {/*({allProducts.length})*/}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={sortField === "salesQuantity" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort("salesQuantity")}
                      className="flex items-center gap-1"
                    >
                      Sales Quantity
                      {sortField === "salesQuantity" && (
                        <ArrowDownUp
                          className="h-3 w-3"
                          style={{ transform: sortOrder === "desc" ? "rotate(180deg)" : "" }}
                        />
                      )}
                    </Button>
                    <Button
                      variant={sortField === "ageDays" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort("ageDays")}
                      className="flex items-center gap-1"
                    >
                      Age
                      {sortField === "ageDays" && (
                        <ArrowDownUp
                          className="h-3 w-3"
                          style={{ transform: sortOrder === "desc" ? "rotate(180deg)" : "" }}
                        />
                      )}
                    </Button>
                    <Button
                      variant={sortField === "inventoryValue" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort("inventoryValue")}
                      className="flex items-center gap-1"
                    >
                      Value
                      {sortField === "inventoryValue" && (
                        <ArrowDownUp
                          className="h-3 w-3"
                          style={{ transform: sortOrder === "desc" ? "rotate(180deg)" : "" }}
                        />
                      )}
                    </Button>
                  </div>
                </div>
                <AgingStockTable data={allProducts} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="aging" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aging Products</CardTitle>
                <CardDescription>Products with no sales for over 15 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Showing aging products ({agingProducts.length})</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={sortField === "salesQuantity" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort("salesQuantity")}
                      className="flex items-center gap-1"
                    >
                      Sales Quantity
                      {sortField === "salesQuantity" && (
                        <ArrowDownUp
                          className="h-3 w-3"
                          style={{ transform: sortOrder === "desc" ? "rotate(180deg)" : "" }}
                        />
                      )}
                    </Button>
                    <Button
                      variant={sortField === "ageDays" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort("ageDays")}
                      className="flex items-center gap-1"
                    >
                      Age
                      {sortField === "ageDays" && (
                        <ArrowDownUp
                          className="h-3 w-3"
                          style={{ transform: sortOrder === "desc" ? "rotate(180deg)" : "" }}
                        />
                      )}
                    </Button>
                    <Button
                      variant={sortField === "inventoryValue" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSort("inventoryValue")}
                      className="flex items-center gap-1"
                    >
                      Value
                      {sortField === "inventoryValue" && (
                        <ArrowDownUp
                          className="h-3 w-3"
                          style={{ transform: sortOrder === "desc" ? "rotate(180deg)" : "" }}
                        />
                      )}
                    </Button>
                  </div>
                </div>
                <AgingStockTable data={agingProducts} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Insights</CardTitle>
            <CardDescription>Recommendations based on aging stock analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agingProducts.length > 0 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-medium">Critical Aging Products</h3>
                      <ul className="space-y-1">
                        {agingProducts
                          .filter((product) => product.ageDays > 45)
                          .slice(0, 3)
                          .map((product) => (
                            <li key={product.id} className="text-sm">
                              <div className="flex items-center">
                                <span className="truncate">{product.name}</span>
                                <span className="ml-2 text-xs text-red-500 whitespace-nowrap">
                                  ({product.ageDays} days, {formatCurrency(product.inventoryValue)})
                                </span>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">High Value Aging Stock</h3>
                      <ul className="space-y-1">
                        {agingProducts
                          .sort((a, b) => b.inventoryValue - a.inventoryValue)
                          .slice(0, 3)
                          .map((product) => (
                            <li key={product.id} className="text-sm">
                              <div className="flex items-center">
                                <span className="truncate">{product.name}</span>
                                <span className="ml-2 text-xs text-amber-500 whitespace-nowrap">
                                  ({formatCurrency(product.inventoryValue)}, {product.ageDays} days)
                                </span>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Consider running promotions or discounts on critical aging products to reduce inventory and free up
                    capital.
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No specific recommendations at this time.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
