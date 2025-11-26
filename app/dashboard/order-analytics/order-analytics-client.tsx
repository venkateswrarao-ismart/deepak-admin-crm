"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, isValid, parseISO, subMonths, startOfDay, endOfDay } from "date-fns"
import { AlertCircle, CalendarIcon, RefreshCw, XCircle, Download } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
// Remove XLSX import to avoid blob URL issues in preview
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

// Debounce function to limit how often a function can be called
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default function OrderAnalyticsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Initialize state from URL parameters
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const startParam = searchParams.get("start")
    if (startParam) {
      try {
        const parsedDate = parseISO(startParam)
        if (isValid(parsedDate)) return parsedDate
      } catch (e) {
        console.error("Invalid start date in URL", e)
      }
    }
    return subMonths(new Date(), 1) // Default to 1 month ago
  })

  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    const endParam = searchParams.get("end")
    if (endParam) {
      try {
        const parsedDate = parseISO(endParam)
        if (isValid(parsedDate)) return parsedDate
      } catch (e) {
        console.error("Invalid end date in URL", e)
      }
    }
    return new Date()
  })

  const [selectedProduct, setSelectedProduct] = useState<string[]>(
    searchParams.get("product")
      ? searchParams
          .get("product")!
          .split(",")
          .filter((p) => p !== "all")
      : [],
  )
  const [selectedStatus, setSelectedStatus] = useState<string[]>(
    searchParams.get("status") ? searchParams.get("status")!.split(",") : [],
  )
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [allOrdersData, setAllOrdersData] = useState<any[]>([]) // Store all loaded data
  const [totalOrderCount, setTotalOrderCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [totalQuantityAllOrders, setTotalQuantityAllOrders] = useState<number>(0)
  const [totalRevenueAllOrders, setTotalRevenueAllOrders] = useState<number>(0)
  const [retryCount, setRetryCount] = useState(0)
  const [isQueryDelayed, setIsQueryDelayed] = useState<boolean>(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [orderIdFilter, setOrderIdFilter] = useState<string>("")
  const [customerFilter, setCustomerFilter] = useState<string>("")
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const pageParam = searchParams.get("page")
    return pageParam ? Number.parseInt(pageParam, 10) : 1
  })
  const [pageSize, setPageSize] = useState<number>(25)
  const [totalPages, setTotalPages] = useState<number>(1)

  // Add a new state variable for export pagination near the other state variables:
  const [exportPage, setExportPage] = useState<number>(1)
  const [exportPageSize] = useState<number>(1000)
  const [exportTotalPages, setExportTotalPages] = useState<number>(1)
  const [isExportingCurrentPage, setIsExportingCurrentPage] = useState<boolean>(false)

  // Update URL when filters change
  useEffect(() => {
    if (isInitialLoad) return

    const params = new URLSearchParams()

    if (startDate) {
      params.set("start", startDate.toISOString().split("T")[0])
    }

    if (endDate) {
      params.set("end", endDate.toISOString().split("T")[0])
    }

    if (selectedProduct.length > 0) {
      params.set("product", selectedProduct.join(","))
    }

    if (selectedStatus.length > 0) {
      params.set("status", selectedStatus.join(","))
    }

    if (orderIdFilter) {
      params.set("orderId", orderIdFilter)
    }

    if (customerFilter) {
      params.set("customer", customerFilter)
    }

    params.set("page", currentPage.toString())

    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({ path: newUrl }, "", newUrl)

    // Update active filters for display
    const filters = []
    if (startDate) filters.push(`From: ${format(startDate, "MMM d, yyyy")}`)
    if (endDate) filters.push(`To: ${format(endDate, "MMM d, yyyy")}`)
    if (selectedStatus.length > 0) filters.push(`Status: ${selectedStatus.join(", ")}`)
    if (selectedProduct.length > 0) {
      const productNames = selectedProduct
        .map((id) => {
          const product = products.find((p) => p.id === id)
          return product ? product.name : id
        })
        .join(", ")
      filters.push(`Products: ${productNames}`)
    }
    if (orderIdFilter) filters.push(`Order ID: ${orderIdFilter}`)
    if (customerFilter) filters.push(`Customer: ${customerFilter}`)

    setActiveFilters(filters)
  }, [
    startDate,
    endDate,
    selectedProduct,
    selectedStatus,
    currentPage,
    orderIdFilter,
    customerFilter,
    isInitialLoad,
    products,
  ])

  // Handle filter changes with debounce
  const debouncedSetOrderIdFilter = useMemo(
    () =>
      debounce((value: string) => {
        setOrderIdFilter(value)
        setCurrentPage(1)
        setIsQueryDelayed(true)
        setTimeout(() => {
          setIsQueryDelayed(false)
          setRetryCount((prev) => prev + 1)
        }, 800)
      }, 500),
    [],
  )

  const debouncedSetCustomerFilter = useMemo(
    () =>
      debounce((value: string) => {
        setCustomerFilter(value)
        setCurrentPage(1)
        setIsQueryDelayed(true)
        setTimeout(() => {
          setIsQueryDelayed(false)
          setRetryCount((prev) => prev + 1)
        }, 800)
      }, 500),
    [],
  )

  // Handle filter changes
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    setCurrentPage(1)
    setIsQueryDelayed(true)
    setLoading(true)

    setTimeout(() => {
      setIsQueryDelayed(false)
      setRetryCount((prev) => prev + 1)
    }, 800)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date)
    setCurrentPage(1)
    setIsQueryDelayed(true)
    setLoading(true)

    setTimeout(() => {
      setIsQueryDelayed(false)
      setRetryCount((prev) => prev + 1)
    }, 800)
  }

  const handleProductChange = (value: string) => {
    setSelectedProduct((prev) => {
      let newProducts

      if (value === "all") {
        newProducts = []
      } else {
        newProducts = prev.includes(value) ? prev.filter((product) => product !== value) : [...prev, value]
      }

      // Trigger query update
      setCurrentPage(1)
      setIsQueryDelayed(true)
      setLoading(true)

      setTimeout(() => {
        setIsQueryDelayed(false)
        setRetryCount((prev) => prev + 1)
      }, 800)

      return newProducts
    })
  }

  const handleStatusChange = (value: string) => {
    setSelectedStatus((prev) => {
      const newStatus = prev.includes(value) ? prev.filter((status) => status !== value) : [...prev, value]

      // Trigger query update
      setCurrentPage(1)
      setIsQueryDelayed(true)
      setLoading(true)

      setTimeout(() => {
        setIsQueryDelayed(false)
        setRetryCount((prev) => prev + 1)
      }, 800)

      return newStatus
    })
  }

  // Reset all filters
  const resetFilters = () => {
    setStartDate(subMonths(new Date(), 1))
    setEndDate(new Date())
    setSelectedProduct([])
    setSelectedStatus([])
    setOrderIdFilter("")
    setCustomerFilter("")
    setCurrentPage(1)
    setIsQueryDelayed(true)
    setLoading(true)

    setTimeout(() => {
      setIsQueryDelayed(false)
      setRetryCount((prev) => prev + 1)
    }, 800)
  }

  // Force refresh data
  const handleRefresh = () => {
    setLoading(true)
    setRetryCount((prev) => prev + 1)
  }

  // Fetch products for the dropdown
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from("products").select("id, name, article_id").order("name").limit(1000)

        if (error) {
          console.error("Error fetching products:", error)
          return
        }

        setProducts(data || [])
        setFilteredProducts(data || [])
        setIsInitialLoad(false)
      } catch (err) {
        console.error("Exception fetching products:", err)
      }
    }

    fetchProducts()
  }, [supabase])

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.article_id && product.article_id.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchTerm, products])

  // Helper function to safely execute Supabase queries with retries
  const safeQuery = useCallback(async (queryFn: () => Promise<any>, errorMessage: string, maxRetries = 2) => {
    let retries = 0

    while (retries <= maxRetries) {
      try {
        return await queryFn()
      } catch (err) {
        console.error(`${errorMessage} (Attempt ${retries + 1}/${maxRetries + 1}):`, err)

        if (retries === maxRetries) {
          setError(`${errorMessage}. Please try refreshing the page.`)
          return { data: null, error: err, count: 0 }
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)))
        retries++
      }
    }
  }, [])

  // Improved function to get metrics directly from orders table

  const getMetricsFromOrderItems = useCallback(async () => {
    if (!startDate || !endDate || isQueryDelayed) return

    try {
      setLoading(true)
      setError(null)

      const startDateFormatted = startOfDay(startDate).toISOString()
      const endDateFormatted = endOfDay(endDate).toISOString()

      let ordersCountQuery

      // Count orders based on whether selectedProduct is used
      if (selectedProduct.length > 0) {
        ordersCountQuery = supabase
          .from("order_items")
          .select("order_id", { count: "exact" })
          .in("product_id", selectedProduct)
          .gte("created_at", startDateFormatted)
          .lte("created_at", endDateFormatted)

        if (selectedStatus.length > 0) {
          ordersCountQuery = ordersCountQuery
            .select("order_id, orders!inner(status)", { count: "exact" })
            .in("orders.status", selectedStatus)
        }

        if (orderIdFilter) {
          ordersCountQuery = ordersCountQuery
            .select("order_id, orders!inner(id)", { count: "exact" })
            .ilike("orders.id", `%${orderIdFilter}%`)
        }

        if (customerFilter) {
          ordersCountQuery = ordersCountQuery
            .select("order_id, orders!inner(profiles(email, full_name))", { count: "exact" })
            .or(`orders.profiles.email.ilike.%${customerFilter}%,orders.profiles.full_name.ilike.%${customerFilter}%`)
        }
      } else {
        ordersCountQuery = supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDateFormatted)
          .lte("created_at", endDateFormatted)

        if (selectedStatus.length > 0) {
          ordersCountQuery = ordersCountQuery.in("status", selectedStatus)
        }

        if (orderIdFilter) {
          ordersCountQuery = ordersCountQuery.ilike("id", `%${orderIdFilter}%`)
        }

        if (customerFilter) {
          ordersCountQuery = ordersCountQuery
            .select("id, profiles!inner(email, full_name)", { count: "exact", head: true })
            .or(`profiles.email.ilike.%${customerFilter}%,profiles.full_name.ilike.%${customerFilter}%`)
        }
      }

      const ordersCountResult = await safeQuery(() => ordersCountQuery, "Failed to fetch orders count")

      let totalOrdersCount
      if (selectedProduct.length > 0) {
        const orderIds = new Set(ordersCountResult.data?.map((item) => item.order_id) || [])
        totalOrdersCount = orderIds.size
      } else {
        totalOrdersCount = ordersCountResult.count || 0
      }

      // Now fetch all orders in pages with improved pagination
      const pageSize = 1000 // Supabase's max limit
      let allOrders: any[] = []
      let page = 0
      let hasMore = true
      let totalFetched = 0

      // Set a reasonable safety limit to prevent infinite loops
      const maxPages = Math.ceil(totalOrdersCount / pageSize) + 1

      while (hasMore && page < maxPages) {
        const from = page * pageSize
        const to = from + pageSize - 1

        let ordersQuery = supabase
          .from("orders")
          .select(`
            id,
            created_at,
            status,
            customer_id,
            profiles:customer_id(email, full_name),
            order_items(
              id,
              quantity,
              unit_price,
              product_id,
              products(id, name, article_id)
            )
          `)
          .gte("created_at", startDateFormatted)
          .lte("created_at", endDateFormatted)
          .order("created_at", { ascending: false })
          .range(from, to)

        if (selectedStatus.length > 0) {
          ordersQuery = ordersQuery.in("status", selectedStatus)
        }

        if (orderIdFilter) {
          ordersQuery = ordersQuery.ilike("id", `%${orderIdFilter}%`)
        }

        if (customerFilter) {
          ordersQuery = ordersQuery.or(
            `profiles.email.ilike.%${customerFilter}%,profiles.full_name.ilike.%${customerFilter}%`,
          )
        }

        const { data: batchOrders, error } = await ordersQuery

        if (error) throw error

        if (batchOrders && batchOrders.length > 0) {
          allOrders = [...allOrders, ...batchOrders]
          totalFetched += batchOrders.length
          page++

          // If we got fewer records than the page size, we've reached the end
          if (batchOrders.length < pageSize) {
            hasMore = false
          }

          // Log progress for large datasets
          if (totalOrdersCount > 5000) {
            console.log(
              `Fetched ${totalFetched} of ${totalOrdersCount} orders (${Math.round((totalFetched / totalOrdersCount) * 100)}%)`,
            )
          }
        } else {
          hasMore = false
        }
      }

      // Update export pagination info
      setExportTotalPages(Math.ceil(totalOrdersCount / exportPageSize))

      // Process orders and calculate metrics
      const processedOrders = allOrders
        .map((order) => {
          let filteredItems = order.order_items || []

          if (selectedProduct.length > 0) {
            filteredItems = filteredItems.filter((item) => selectedProduct.includes(item.product_id))
          }

          const totalAmount = filteredItems.reduce(
            (sum, item) => sum + (item.quantity || 0) * (Number.parseFloat(item.unit_price) || 0),
            0,
          )

          return {
            ...order,
            order_items: filteredItems,
            total_amount: totalAmount,
          }
        })
        .filter((order) => order.order_items.length > 0)

      let totalQuantity = 0
      let totalRevenue = 0

      processedOrders.forEach((order) => {
        order.order_items.forEach((item) => {
          totalQuantity += item.quantity || 0
          totalRevenue += (item.quantity || 0) * (Number.parseFloat(item.unit_price) || 0)
        })
      })

      setTotalOrderCount(totalOrdersCount)
      setTotalQuantityAllOrders(totalQuantity)
      setTotalRevenueAllOrders(totalRevenue)
      setAllOrdersData(processedOrders)

      // Paginate results
      setTotalPages(Math.ceil(totalOrderCount / pageSize))
      const from = (currentPage - 1) * pageSize
      const to = Math.min(from + pageSize, processedOrders.length)
      const paginatedOrders = processedOrders.slice(from, to)
      setOrders(paginatedOrders)

      // Log pagination info for debugging
      console.log(
        `Pagination: Page ${currentPage} of ${Math.ceil(totalOrderCount / pageSize)}, showing ${from + 1}-${to} of ${processedOrders.length} loaded records (${totalOrderCount} total)`,
      )

      // Chart data
      prepareChartData(processedOrders)

      console.log(`Total orders from count: ${totalOrdersCount}`)
      console.log(`Orders fetched: ${allOrders.length}`)
      console.log(`Processed orders: ${processedOrders.length}`)
    } catch (error) {
      console.error("Error fetching metrics:", error)
      setError("An unexpected error occurred. Please try refreshing the page.")
    } finally {
      setLoading(false)
    }
  }, [
    supabase,
    startDate,
    endDate,
    selectedProduct,
    selectedStatus,
    orderIdFilter,
    customerFilter,
    currentPage,
    pageSize,
    isQueryDelayed,
    safeQuery,
    exportPageSize,
  ])

  // Fetch data when filters change
  useEffect(() => {
    getMetricsFromOrderItems()
  }, [getMetricsFromOrderItems, retryCount])

  // Update pagination when data changes
  useEffect(() => {
    if (allOrdersData.length > 0) {
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize
      const paginatedOrders = allOrdersData.slice(from, to)
      setOrders(paginatedOrders)
    }
  }, [allOrdersData, currentPage, pageSize])

  // Prepare data for the chart
  const prepareChartData = (orders: any[]) => {
    const dateMap = new Map()

    orders.forEach((order) => {
      if (!order.created_at) return

      try {
        const orderDate = new Date(order.created_at)
        if (!isValid(orderDate)) return

        const date = format(orderDate, "yyyy-MM-dd")

        if (!dateMap.has(date)) {
          dateMap.set(date, {
            date,
            orders: 0,
            quantity: 0,
            revenue: 0,
          })
        }

        const dateData = dateMap.get(date)
        dateData.orders += 1

        order.order_items.forEach((item: any) => {
          if (selectedProduct.length === 0 || selectedProduct.includes(item.product_id)) {
            dateData.quantity += item.quantity || 0
            dateData.revenue += (item.quantity || 0) * (Number.parseFloat(item.unit_price) || 0)
          }
        })
      } catch (error) {
        console.error("Error processing order date:", error)
      }
    })

    const chartData = Array.from(dateMap.values())
    chartData.sort((a, b) => {
      try {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      } catch (error) {
        return 0
      }
    })

    setChartData(chartData)
  }

  // Format date safely
  const formatDate = (date: Date | string | undefined, formatStr: string): string => {
    if (!date) return "N/A"

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date
      if (!isValid(dateObj)) return "Invalid Date"
      return format(dateObj, formatStr)
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Error"
    }
  }

  // Handle pagination
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const exportToCSV = async (exportCurrentPageOnly = false) => {
    if (totalOrderCount === 0) {
      alert("No data to export.")
      return
    }

    try {
      setExportLoading(true)
      setIsExportingCurrentPage(exportCurrentPageOnly)

      // If we're exporting the current page only, use the already loaded data
      if (exportCurrentPageOnly) {
        const currentPageData = orders
        const exportData = []

        currentPageData.forEach((order) => {
          const items = order.order_items
          if (items.length === 0) {
            exportData.push({
              "Order ID": order.id || "N/A",
              Date: order.created_at ? formatDate(new Date(order.created_at), "yyyy-MM-dd") : "N/A",
              Customer: order.profiles?.full_name || order.profiles?.email || "N/A",
              Status: order.status || "N/A",
              "Product Name": "N/A",
              "Article ID": "N/A",
              "Product Quantity": 0,
              "Unit Price": 0,
              "Item Total": 0,
              "Order Total": order.total_amount || 0,
              "Total Items": 0,
            })
          } else {
            items.forEach((item) => {
              exportData.push({
                "Order ID": order.id || "N/A",
                Date: order.created_at ? formatDate(new Date(order.created_at), "yyyy-MM-dd") : "N/A",
                Customer: order.profiles?.full_name || order.profiles?.email || "N/A",
                Status: order.status || "N/A",
                "Product Name": item.products?.name || "N/A",
                "Article ID": item.products?.article_id || "N/A",
                "Product Quantity": item.quantity || 0,
                "Unit Price": Number.parseFloat(item.unit_price) || 0,
                "Item Total": (item.quantity || 0) * (Number.parseFloat(item.unit_price) || 0),
                "Order Total": order.total_amount || 0,
                "Total Items": items.length,
              })
            })
          }
        })

        generateCSVDownload(exportData, true)
        return
      }

      // For full export, use all the data we've already loaded
      if (allOrdersData.length === totalOrderCount) {
        console.log("Using already loaded data for export")
        const exportData = []

        allOrdersData.forEach((order) => {
          const items = order.order_items
          if (items.length === 0) {
            exportData.push({
              "Order ID": order.id || "N/A",
              Date: order.created_at ? formatDate(new Date(order.created_at), "yyyy-MM-dd") : "N/A",
              Customer: order.profiles?.full_name || order.profiles?.email || "N/A",
              Status: order.status || "N/A",
              "Product Name": "N/A",
              "Article ID": "N/A",
              "Product Quantity": 0,
              "Unit Price": 0,
              "Item Total": 0,
              "Order Total": order.total_amount || 0,
              "Total Items": 0,
            })
          } else {
            items.forEach((item) => {
              exportData.push({
                "Order ID": order.id || "N/A",
                Date: order.created_at ? formatDate(new Date(order.created_at), "yyyy-MM-dd") : "N/A",
                Customer: order.profiles?.full_name || order.profiles?.email || "N/A",
                Status: order.status || "N/A",
                "Product Name": item.products?.name || "N/A",
                "Article ID": item.products?.article_id || "N/A",
                "Product Quantity": item.quantity || 0,
                "Unit Price": Number.parseFloat(item.unit_price) || 0,
                "Item Total": (item.quantity || 0) * (Number.parseFloat(item.unit_price) || 0),
                "Order Total": order.total_amount || 0,
                "Total Items": items.length,
              })
            })
          }
        })

        generateCSVDownload(exportData, false)
        return
      }

      // If we need to fetch data specifically for export
      const pageSize = exportPageSize
      const startDateFormatted = startDate ? startOfDay(startDate).toISOString() : undefined
      const endDateFormatted = endDate ? endOfDay(endDate).toISOString() : undefined

      const exportData = []
      let currentPage = 1
      const maxPages = Math.ceil(totalOrderCount / pageSize)
      let totalFetched = 0

      // Show progress notification
      alert(`Starting export of ${totalOrderCount} records. This may take some time for large datasets.`)

      while (currentPage <= maxPages) {
        const from = (currentPage - 1) * pageSize
        const to = from + pageSize - 1

        let ordersQuery = supabase
          .from("orders")
          .select(
            `
            id,
            created_at,
            status,
            customer_id,
            profiles:customer_id(email, full_name),
            order_items(
              id,
              quantity,
              unit_price,
              product_id,
              products(id, name, article_id)
            )
          `,
          )
          .order("created_at", { ascending: false })
          .range(from, to)

        // Apply filters
        if (startDateFormatted) {
          ordersQuery = ordersQuery.gte("created_at", startDateFormatted)
        }
        if (endDateFormatted) {
          ordersQuery = ordersQuery.lte("created_at", endDateFormatted)
        }
        if (selectedStatus.length > 0) {
          ordersQuery = ordersQuery.in("status", selectedStatus)
        }
        if (orderIdFilter) {
          ordersQuery = ordersQuery.ilike("id", `%${orderIdFilter}%`)
        }
        if (customerFilter) {
          ordersQuery = ordersQuery.or(
            `profiles.email.ilike.%${customerFilter}%,profiles.full_name.ilike.%${customerFilter}%`,
          )
        }

        const { data: batchOrders, error } = await ordersQuery

        if (error) {
          console.error("Error fetching orders for export:", error)
          alert("Failed to export data. Please try again.")
          break
        }

        if (!batchOrders || batchOrders.length === 0) break

        const processedOrders = batchOrders
          .map((order) => {
            let filteredItems = order.order_items || []

            if (selectedProduct.length > 0) {
              filteredItems = filteredItems.filter((item) => selectedProduct.includes(item.product_id))
            }

            const totalAmount = filteredItems.reduce(
              (sum, item) => sum + (item.quantity || 0) * (Number.parseFloat(item.unit_price) || 0),
              0,
            )

            return {
              ...order,
              order_items: filteredItems,
              total_amount: totalAmount,
            }
          })
          .filter((order) => order.order_items.length > 0)

        processedOrders.forEach((order) => {
          const items = order.order_items
          if (items.length === 0) {
            exportData.push({
              "Order ID": order.id || "N/A",
              Date: order.created_at ? formatDate(new Date(order.created_at), "yyyy-MM-dd") : "N/A",
              Customer: order.profiles?.full_name || order.profiles?.email || "N/A",
              Status: order.status || "N/A",
              "Product Name": "N/A",
              "Article ID": "N/A",
              "Product Quantity": 0,
              "Unit Price": 0,
              "Item Total": 0,
              "Order Total": order.total_amount || 0,
              "Total Items": 0,
            })
          } else {
            items.forEach((item) => {
              exportData.push({
                "Order ID": order.id || "N/A",
                Date: order.created_at ? formatDate(new Date(order.created_at), "yyyy-MM-dd") : "N/A",
                Customer: order.profiles?.full_name || order.profiles?.email || "N/A",
                Status: order.status || "N/A",
                "Product Name": item.products?.name || "N/A",
                "Article ID": item.products?.article_id || "N/A",
                "Product Quantity": item.quantity || 0,
                "Unit Price": Number.parseFloat(item.unit_price) || 0,
                "Item Total": (item.quantity || 0) * (Number.parseFloat(item.unit_price) || 0),
                "Order Total": order.total_amount || 0,
                "Total Items": items.length,
              })
            })
          }
        })

        totalFetched += processedOrders.length
        console.log(
          `Exported ${totalFetched} of approximately ${totalOrderCount} orders (${Math.round((totalFetched / totalOrderCount) * 100)}%)`,
        )

        currentPage++
      }

      generateCSVDownload(exportData, false)
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      alert("Failed to export data. Please try again.")
    } finally {
      setExportLoading(false)
    }
  }

  // Helper function to generate and trigger CSV download
  const generateCSVDownload = (exportData: any[], isCurrentPageOnly: boolean) => {
    if (exportData.length === 0) {
      alert("No matching data to export.")
      return
    }

    const headers = Object.keys(exportData[0] || {})
    const csvContent = [
      headers.join(","),
      ...exportData.map((row) => headers.map((header) => `"${row[header]}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    const pageInfo = isCurrentPageOnly ? `_page${currentPage}of${totalPages}` : "_complete"
    link.setAttribute("download", `order_analytics${pageInfo}_${formatDate(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log(`Export completed successfully with ${exportData.length} records`)
  }

  // Helper functions for export pagination
  const goToNextExportPage = () => {
    if (exportPage < exportTotalPages) {
      setExportPage(exportPage + 1)
    }
  }

  const goToPreviousExportPage = () => {
    if (exportPage > 1) {
      setExportPage(exportPage - 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-2" onClick={handleRefresh}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? formatDate(startDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? formatDate(endDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col space-y-2 flex-1">
            <label className="text-sm font-medium">Status (Optional)</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {selectedStatus.length === 0
                    ? "All Statuses"
                    : selectedStatus.length === 1
                      ? selectedStatus[0]
                      : `${selectedStatus.length} statuses selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start">
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between p-2 border-b">
                    <span className="text-sm font-medium">Select Status</span>
                    {selectedStatus.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStatus([])}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {["pending", "confirmed", "reminder", "out_for_delivery", "delivered", "cancelled"].map(
                      (status) => (
                        <label
                          key={status}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStatus.includes(status)}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleStatusChange(status)
                            }}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">
                            {status === "out_for_delivery" ? "Out for Delivery" : status}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col space-y-2 flex-1">
            <label className="text-sm font-medium">Product (Optional)</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {selectedProduct.length === 0
                    ? "All Products"
                    : selectedProduct.length === 1
                      ? products.find((p) => p.id === selectedProduct[0])?.name || "1 product selected"
                      : `${selectedProduct.length} products selected`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between p-2 border-b">
                    <span className="text-sm font-medium">Select Products</span>
                    {selectedProduct.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProduct([])}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <label className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProduct.length === 0}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleProductChange("all")
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">All Products</span>
                    </label>
                    {filteredProducts.map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProduct.includes(product.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleProductChange(product.id)
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {product.article_id ? `${product.article_id} - ` : ""}
                          {product.name}
                        </span>
                      </label>
                    ))}
                    {filteredProducts.length === 0 && searchTerm && (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No products found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleRefresh} variant="outline" className="gap-2" disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Export Controls - New Row */}

        <div className="flex flex-col gap-4 p-4 border rounded-md bg-gray-50">
          <h3 className="text-sm font-medium">Export Data</h3>
          <div className="flex justify-center">
            <Button
              onClick={() => exportToCSV(false)}
              className="gap-2 w-full md:w-auto"
              disabled={totalOrderCount === 0 || exportLoading}
            >
              {exportLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Exporting All Records...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export All Records ({totalOrderCount})
                </>
              )}
            </Button>
          </div>
        </div>

        {exportLoading && (
          <div className="mt-2 text-sm text-blue-600">
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Exporting data... This may take a few moments for large datasets.
            </div>
          </div>
        )}

        {/* Advanced filters panel */}
        {isFilterPanelOpen && (
          <div className="p-4 border rounded-md bg-gray-50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order ID</label>
                <Input
                  placeholder="Search by order ID"
                  value={orderIdFilter}
                  onChange={(e) => debouncedSetOrderIdFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <Input
                  placeholder="Search by customer name or email"
                  value={customerFilter}
                  onChange={(e) => debouncedSetCustomerFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <Badge key={index} variant="secondary" className="px-2 py-1">
                    {filter}
                  </Badge>
                ))}
              </div>
              <Button onClick={resetFilters} variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                <XCircle className="h-4 w-4 mr-1" />
                Reset All Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isQueryDelayed ? (
                <span className="inline-flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Preparing query...
                </span>
              ) : loading ? (
                <span className="inline-flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Calculating...
                </span>
              ) : (
                totalOrderCount.toLocaleString()
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Showing page {currentPage} of {totalPages || 1}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <span className="inline-flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Calculating...
                </span>
              ) : (
                totalQuantityAllOrders.toLocaleString()
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Showing page {currentPage} of {totalPages || 1}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <span className="inline-flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Calculating...
                </span>
              ) : (
                `₹${totalRevenueAllOrders.toFixed(2)}`
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Showing page {currentPage} of {totalPages || 1}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Table */}
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                  >
                    {order.id ? order.id.substring(0, 8) + "..." : "N/A"}
                    <span className="ml-1 text-xs text-gray-500">(View)</span>
                  </Link>
                </TableCell>
                <TableCell>{formatDate(order.created_at, "PPP")}</TableCell>
                <TableCell>{order.profiles?.full_name || order.profiles?.email}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{order.order_items.reduce((sum, item) => sum + (item.quantity || 0), 0)}</TableCell>
                <TableCell>{`₹${order.total_amount.toFixed(2)}`}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{Math.min((currentPage - 1) * pageSize + 1, totalOrderCount)}</span>{" "}
              to <span className="font-medium">{Math.min(currentPage * pageSize, totalOrderCount)}</span> of{" "}
              <span className="font-medium">{totalOrderCount}</span> records
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageSize(Math.max(10, pageSize - 10))}
                disabled={pageSize <= 10}
              >
                Show Less
              </Button>
              <span className="text-sm font-medium">{pageSize} per page</span>
              <Button variant="outline" size="sm" onClick={() => setPageSize(pageSize + 10)} disabled={pageSize >= 100}>
                Show More
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Button onClick={() => setCurrentPage(1)} variant="outline" size="sm" disabled={currentPage === 1}>
              <ChevronLeft className="h-3 w-3 mr-1" />
              First
            </Button>
            <Button onClick={goToPreviousPage} variant="outline" size="sm" disabled={currentPage === 1}>
              <ChevronLeft className="h-3 w-3" />
              Prev
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="mx-1 w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="mx-1">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mx-1 w-8 h-8 p-0"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button onClick={goToNextPage} variant="outline" size="sm" disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
            <Button
              onClick={() => setCurrentPage(totalPages)}
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
            >
              Last
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Analytics Chart</CardTitle>
            <CardDescription>Orders over time</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "revenue") {
                      return [`₹${Number(value).toFixed(2)}`, "Revenue"]
                    }
                    if (name === "orders") {
                      return [Number(value).toLocaleString(), "Orders"]
                    }
                    if (name === "quantity") {
                      return [Number(value).toLocaleString(), "Quantity"]
                    }
                    return [Number(value).toLocaleString(), name]
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  name="Orders"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="quantity"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  name="Quantity"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ffc658"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  name="Revenue (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
