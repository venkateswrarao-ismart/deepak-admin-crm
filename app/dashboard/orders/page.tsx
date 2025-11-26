"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Search, Eye, Filter, Download } from "lucide-react"
import Link from "next/link"
import { format, startOfDay, endOfDay } from "date-fns"
import type { Database } from "@/types/supabase"
import * as XLSX from "xlsx"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import type { StoredAuthData } from "@/types/auth"
import { useToast } from "@/components/ui/use-toast"

type Order = {
  id: string
  customer_id: string
  delivery_boy_id: string | null
  status: "pending" | "confirmed" | "reminder" | "out_for_delivery" | "delivered" | "cancelled"
  total_amount: number
  delivery_address: string
  created_at: string
  updated_at: string
  sales_agent_name: string | null
  sales_agent_phone: string | null
  comments: string | null
  customer: {
    full_name: string | null
    phone: string | null
  } | null
  delivery_boy: {
    full_name: string | null
    phone: string | null
  } | null
  sales_executive: {
    name: string | null
    phone: string | null
    manager: {
      name: string | null
      phone: string | null
    } | null
  } | null
  sales_manager: {
    name: string | null
    phone: string | null
  } | null
  order_items: {
    id: string
    product_id: string
    quantity: number
    unit_price: number
    product: {
      name: string
    } | null
  }[]
}

type SalesExecutive = {
  id: string
  name: string | null
  phone: string | null
}

type SalesManager = {
  id: string
  name: string | null
  phone: string | null
}

export default function OrdersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string[]>(
    searchParams.get("status") ? searchParams.get("status")!.split(",") : [],
  )
  const [dateFilter, setDateFilter] = useState<string | null>(searchParams.get("date") || "")
  const [searchTerm, setSearchTerm] = useState<string | null>(searchParams.get("search") || "")
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [salesExecutives, setSalesExecutives] = useState<SalesExecutive[]>([])
  const [salesManagers, setSalesManagers] = useState<SalesManager[]>([])
  const [executiveFilter, setExecutiveFilter] = useState<string | null>(searchParams.get("executive") || "")
  const [managerFilter, setManagerFilter] = useState<string | null>(searchParams.get("manager") || "")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [totalAmount, setTotalAmount] = useState<number>(0)

  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    reminder: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  })

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchParams.get("search") || "")
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
    "Order ID": true,
    Date: true,
    Time: true,
    "Customer Name": true,
    "Customer Phone": true,
    Status: true,
    "Total Amount": true,
    "Delivery Address": true,
    "Delivery Person": true,
    "Delivery Person Phone": true,
    "Sales Executive": true,
    "Sales Executive Phone": true,
    "Sales Manager": true,
    "Sales Manager Phone": true,
    "Total Items": true,
    Products: true,
    "Last Updated": true,
    Comments: true,
  })

  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()

  // Get auth data from localStorage
  const [authData, setAuthData] = useState<StoredAuthData | null>(null)

  useEffect(() => {
    try {
      const authDataString = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      if (authDataString) {
        const parsedAuthData = JSON.parse(authDataString)
        setAuthData(parsedAuthData)
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
  }, [])

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // Fetch sales executives
        const { data: executives, error: execError } = await supabase.from("sales_executives").select("id, name, phone")

        if (execError) throw execError

        // Fetch sales managers
        const { data: managers, error: managerError } = await supabase.from("sales_managers").select("id, name, phone")

        if (managerError) throw managerError

        if (executives) setSalesExecutives(executives)
        if (managers) setSalesManagers(managers)
      } catch (error) {
        console.error("Error fetching sales data:", error)
      }
    }

    fetchSalesData()
  }, [supabase])

  useEffect(() => {
    const fromParam = searchParams.get("from")
    const toParam = searchParams.get("to")

    if (fromParam && toParam) {
      const fromDate = new Date(fromParam)
      const toDate = new Date(toParam)

      // Validate dates before setting
      if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
        setDateRange({ from: fromDate, to: toDate })
      }
    }
  }, [searchParams])

  useEffect(() => {
    const fetchAllOrders = async () => {
      const pageSize = 1000
      let allOrders: any[] = []
      let from = 0
      let to = pageSize - 1
      let done = false

      while (!done) {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            customer:customer_id(full_name, phone)
          `)
          .range(from, to)

        if (error) throw error

        if (data && data.length > 0) {
          allOrders = allOrders.concat(data)
          from += pageSize
          to += pageSize
        } else {
          done = true
        }
      }

      return allOrders
    }

    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        let query = supabase.from("orders").select(
          `
              *,
              customer:customer_id(full_name, phone),
              delivery_boy:delivery_boy_id(full_name, phone),
              sales_executive:sales_executive_id(name, phone, manager:manager_id(name, phone)),
              sales_manager:sales_manager_id(name, phone),
            
              comments
            `,
          { count: "exact" },
        )

        // Apply filters
        if (statusFilter.length > 0) {
          query = query.in("status", statusFilter)
        }

        if (dateFilter) {
          const today = new Date()
          let startDate: Date

          switch (dateFilter) {
            case "today":
              startDate = new Date(today.setHours(0, 0, 0, 0))
              query = query.gte("created_at", startDate.toISOString())
              break
            case "yesterday":
              startDate = new Date(today)
              startDate.setDate(startDate.getDate() - 1)
              startDate.setHours(0, 0, 0, 0)
              const endDate = new Date(startDate)
              endDate.setHours(23, 59, 59, 999)
              query = query.gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString())
              break
            case "last7days":
              startDate = new Date(today)
              startDate.setDate(startDate.getDate() - 7)
              query = query.gte("created_at", startDate.toISOString())
              break
            case "last30days":
              startDate = new Date(today)
              startDate.setDate(startDate.getDate() - 30)
              query = query.gte("created_at", startDate.toISOString())
              break
          }
        } else if (dateRange?.from && dateRange?.to) {
          const fromDate = startOfDay(dateRange.from)
          const toDate = endOfDay(dateRange.to)
          query = query.gte("created_at", fromDate.toISOString()).lte("created_at", toDate.toISOString())
        }

        if (executiveFilter) {
          query = query.eq("sales_executive_id", executiveFilter)
        }

        if (managerFilter) {
          query = query.eq("sales_manager_id", managerFilter)
        }

        if (searchTerm) {
          const allOrders = await fetchAllOrders()
          const filteredIds = allOrders
            .filter(
              (order) =>
                order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .map((order) => order.id)

          if (filteredIds.length > 0) {
            query = query.in("id", filteredIds)
          } else {
            // No matches, ensure empty result
            query = query.eq("id", "00000000-0000-0000-0000-000000000000")
          }
        }

        // Pagination
        const from = pageIndex * pageSize
        const to = from + pageSize - 1

        const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to)

        if (error) throw error

        setOrders(data as unknown as Order[])
        setTotalCount(count || 0)

        // Calculate total amount
        if (data) {
          const sum = data.reduce((acc, order) => acc + order.total_amount, 0)
          setTotalAmount(sum)
        }
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [supabase, statusFilter, dateFilter, executiveFilter, managerFilter, pageIndex, pageSize, searchTerm, dateRange])

  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        const { data, error } = await supabase.rpc("get_order_status_stats")

        if (error) throw error

        if (data) {
          const stats = {
            total: data.reduce((sum, item) => sum + Number(item.count), 0),
            pending: Number(data.find((item) => item.status === "pending")?.count || 0),
            confirmed: Number(data.find((item) => item.status === "confirmed")?.count || 0),
            reminder: Number(data.find((item) => item.status === "reminder")?.count || 0),
            out_for_delivery: Number(data.find((item) => item.status === "out_for_delivery")?.count || 0),
            delivered: Number(data.find((item) => item.status === "delivered")?.count || 0),
            cancelled: Number(data.find((item) => item.status === "cancelled")?.count || 0),
          }

          setOrderStats(stats)
        }
      } catch (error) {
        console.error("Error fetching order statistics:", error)
      }
    }

    fetchOrderStats()
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setPageIndex(0)
      setSearchTerm(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  useEffect(() => {
    // Initialize searchTerm from URL on first load
    const urlSearchTerm = searchParams.get("search")
    if (urlSearchTerm && !searchTerm) {
      setSearchTerm(urlSearchTerm)
      setDebouncedSearchTerm(urlSearchTerm)
    }
  }, [searchParams])

  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams()

    if (statusFilter.length > 0) params.set("status", statusFilter.join(","))
    if (dateFilter) params.set("date", dateFilter)
    if (executiveFilter) params.set("executive", executiveFilter)
    if (managerFilter) params.set("manager", managerFilter)
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm)
    else params.delete("search")

    router.replace(`?${params.toString()}`, { scroll: false })
  }, [statusFilter, dateFilter, executiveFilter, managerFilter, debouncedSearchTerm, router])

  useEffect(() => {
    updateUrlParams()
  }, [updateUrlParams])

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    setDateFilter(null) // Clear the predefined date filter when custom range is selected
    setPageIndex(0)
  }

  const resetFilters = () => {
    setStatusFilter([])
    setDateFilter(null)
    setDateRange(undefined)
    setExecutiveFilter(null)
    setManagerFilter(null)
    setSearchTerm("")
    setPageIndex(0)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter((prev) => {
      const newStatus = prev.includes(value) ? prev.filter((status) => status !== value) : [...prev, value]
      setPageIndex(0)
      return newStatus
    })
  }

  const toggleAllColumns = (checked: boolean) => {
    const newSelectedColumns = { ...selectedColumns }
    Object.keys(newSelectedColumns).forEach((key) => {
      newSelectedColumns[key] = checked
    })
    setSelectedColumns(newSelectedColumns)
  }


const handleExportToExcel = async () => {
  try {
    setIsLoading(true)

    toast({
      title: "Export Started",
      description: "Preparing to export all filtered records. This may take a moment for large datasets.",
      duration: 5000,
    })

    let allExportData = []
    let hasMore = true
    let page = 0
    const batchSize = 1000

    while (hasMore) {
      let query = supabase.from("orders").select(`
        id,
        customer_id,
        delivery_boy_id,
        status,
        total_amount,
        delivery_address,
        created_at,
        updated_at,
        sales_agent_name,
        sales_agent_phone,
        comments,
        customer:customer_id(full_name, phone),
        delivery_boy:delivery_boy_id(full_name, phone),
        sales_executive:sales_executive_id(name, phone),
        sales_manager:sales_manager_id(name, phone),
        order_items(id, product_id, quantity, unit_price, product:product_id(name))
      `)

      if (statusFilter.length > 0) {
        query = query.in("status", statusFilter)
      }

      if (dateFilter) {
        const today = new Date()
        let startDate: Date

        switch (dateFilter) {
          case "today":
            startDate = new Date(today.setHours(0, 0, 0, 0))
            query = query.gte("created_at", startDate.toISOString())
            break
          case "yesterday":
            startDate = new Date(today)
            startDate.setDate(startDate.getDate() - 1)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(startDate)
            endDate.setHours(23, 59, 59, 999)
            query = query.gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString())
            break
          case "last7days":
            startDate = new Date(today)
            startDate.setDate(startDate.getDate() - 7)
            query = query.gte("created_at", startDate.toISOString())
            break
          case "last30days":
            startDate = new Date(today)
            startDate.setDate(startDate.getDate() - 30)
            query = query.gte("created_at", startDate.toISOString())
            break
        }
      } else if (dateRange?.from && dateRange?.to) {
        const fromDate = startOfDay(dateRange.from)
        const toDate = endOfDay(dateRange.to)
        query = query.gte("created_at", fromDate.toISOString()).lte("created_at", toDate.toISOString())
      }

      if (executiveFilter) {
        query = query.eq("sales_executive_id", executiveFilter)
      }

      if (managerFilter) {
        query = query.eq("sales_manager_id", managerFilter)
      }

      // ✅ Safe and correct searchTerm handling
      if (searchTerm) {
        const matchedOrderIds = new Set<string>()

        // Match delivery_address
        const { data: addressMatches, error: addressError } = await supabase
          .from("orders")
          .select("id")
          .ilike("delivery_address", `%${searchTerm}%`)

        if (addressError) throw addressError
        addressMatches?.forEach((order) => matchedOrderIds.add(order.id))

        // If searchTerm is valid UUID, match order id
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (uuidRegex.test(searchTerm)) {
          matchedOrderIds.add(searchTerm)
        }

        // Match customer full_name
        const { data: matchingCustomers, error: customerError } = await supabase
          .from("profiles")
          .select("id")
          .ilike("full_name", `%${searchTerm}%`)

        if (customerError) throw customerError

        if (matchingCustomers?.length) {
          const customerIds = matchingCustomers.map((c) => c.id)
          const { data: customerOrders, error: customerOrdersError } = await supabase
            .from("orders")
            .select("id")
            .in("customer_id", customerIds)

          if (customerOrdersError) throw customerOrdersError
          customerOrders?.forEach((order) => matchedOrderIds.add(order.id))
        }

        if (matchedOrderIds.size > 0) {
          query = query.in("id", Array.from(matchedOrderIds))
        } else {
          hasMore = false
          break
        }
      }

      const from = page * batchSize
      const to = from + batchSize - 1

      query = query.order("created_at", { ascending: false }).range(from, to)

      const { data, error } = await query
      if (error) throw error

      if (!data || data.length === 0) {
        hasMore = false
      } else {
        allExportData = [...allExportData, ...data]
        if (data.length < batchSize) {
          hasMore = false
        } else {
          page++
          if (page % 5 === 0) {
            toast({
              title: "Export Progress",
              description: `Fetched ${allExportData.length} records so far...`,
              duration: 3000,
            })
          }
        }
      }
    }

    if (allExportData.length === 0) {
      toast({
        title: "No Data",
        description: "No data to export based on your current filters.",
        variant: "destructive",
      })
      setIsLoading(false)
      setShowExportModal(false)
      return
    }

    toast({
      title: "Processing Data",
      description: `Preparing ${allExportData.length} records for export...`,
      duration: 3000,
    })

    const excelData = allExportData.map((order) => {
      const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0)
      const productNames = order.order_items
        .map((item) => `${item.product?.name || "Unknown"} (${item.quantity})`)
        .join(", ")

      const rowData: Record<string, any> = {}

      if (selectedColumns["Order ID"]) rowData["Order ID"] = order.id
      if (selectedColumns["Date"]) rowData["Date"] = format(new Date(order.created_at), "MMM dd, yyyy")
      if (selectedColumns["Time"]) rowData["Time"] = format(new Date(order.created_at), "hh:mm a")
      if (selectedColumns["Customer Name"]) rowData["Customer Name"] = order.customer?.full_name || "Unknown"
      if (selectedColumns["Customer Phone"]) rowData["Customer Phone"] = order.customer?.phone || "N/A"
      if (selectedColumns["Status"]) rowData["Status"] = order.status.charAt(0).toUpperCase() + order.status.slice(1)
      if (selectedColumns["Total Amount"]) rowData["Total Amount"] = `${order.total_amount}`
      if (selectedColumns["Delivery Address"]) rowData["Delivery Address"] = order.delivery_address
      if (selectedColumns["Delivery Person"]) rowData["Delivery Person"] = order.delivery_boy?.full_name || "Not Assigned"
      if (selectedColumns["Delivery Person Phone"]) rowData["Delivery Person Phone"] = order.delivery_boy?.phone || "N/A"
      if (selectedColumns["Sales Executive"]) rowData["Sales Executive"] = order.sales_executive?.name || "N/A"
      if (selectedColumns["Sales Executive Phone"]) rowData["Sales Executive Phone"] = order.sales_executive?.phone || "N/A"
      if (selectedColumns["Sales Manager"]) rowData["Sales Manager"] = order.sales_manager?.name || "N/A"
      if (selectedColumns["Sales Manager Phone"]) rowData["Sales Manager Phone"] = order.sales_manager?.phone || "N/A"
      if (selectedColumns["Total Items"]) rowData["Total Items"] = totalItems
      if (selectedColumns["Products"]) rowData["Products"] = productNames
      if (selectedColumns["Last Updated"]) rowData["Last Updated"] = format(new Date(order.updated_at), "MMM dd, yyyy hh:mm a")
      if (selectedColumns["Comments"]) rowData["Comments"] = order.comments || "N/A"

      return rowData
    })

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders")

    const maxWidth = 50
    const colWidths = {}

    if (excelData.length > 0) {
      const firstRow = excelData[0]
      Object.keys(firstRow).forEach((key) => {
        colWidths[key] = Math.min(Math.max(key.length, 10), maxWidth)
        for (let i = 0; i < Math.min(20, excelData.length); i++) {
          const content = String(excelData[i][key] || "")
          colWidths[key] = Math.min(Math.max(colWidths[key], content.length * 0.9), maxWidth)
        }
      })
    }

    worksheet["!cols"] = Object.keys(colWidths).map((key) => ({ wch: colWidths[key] }))

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const data_blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    const fileName = `orders_export_${format(new Date(), "yyyy-MM-dd")}.xlsx`
    const url = window.URL.createObjectURL(data_blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()

    toast({
      title: "Export Complete",
      description: `Successfully exported ${allExportData.length} records.`,
      variant: "default",
    })

    setIsLoading(false)
    setShowExportModal(false)
  } catch (error) {
    console.error("Error exporting orders:", error)
    toast({
      title: "Export Failed",
      description: "Failed to export orders. Please try again or contact support.",
      variant: "destructive",
      duration: 5000,
    })
    setIsLoading(false)
  }  
}

  const columns = [
    {
      accessorKey: "serialNo",
      header: "No.",
      cell: ({ row }) => {
        return totalCount - (pageIndex * pageSize + row.index)
      },
    },
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => {
        const id = row.getValue("id") as string
        return <span className="font-medium">{id.slice(0, 8)}...</span>
      },
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original.customer
        return customer?.full_name || "Unknown"
      },
    },
    {
      accessorKey: "total_amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("total_amount"))
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "INR",
        }).format(amount)
        return formatted
      },
    },
    {
      accessorKey: "comments",
      header: "Comments",
      cell: ({ row }) => {
        const comments = row.original.comments
        return comments || "-"
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge
            className={
              status === "pending"
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                : status === "confirmed"
                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                  : status === "reminder"
                    ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-100"
                    : status === "out_for_delivery"
                      ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                      : status === "delivered"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-red-100 text-red-800 hover:bg-red-100"
            }
          >
            {status === "out_for_delivery" ? "Out for Delivery" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "sales_executive",
      header: "Sales Executive",
      cell: ({ row }) => {
        const executive = row.original.sales_executive
        return executive?.name ? `${executive.name} (${executive.phone || "-"})` : "-"
      },
    },
    {
      accessorKey: "sales_manager",
      header: "Sales Manager",
      cell: ({ row }) => {
        const manager = row.original.sales_manager
        return manager?.name ? `${manager.name} (${manager.phone || "-"})` : "-"
      },
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return format(date, "MMM dd, yyyy")
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const id = row.original.id
        // Get current search params
        const currentParams = new URLSearchParams()
        if (statusFilter.length > 0) currentParams.set("status", statusFilter.join(","))
        if (dateFilter) currentParams.set("date", dateFilter)
        if (executiveFilter) currentParams.set("executive", executiveFilter)
        if (managerFilter) currentParams.set("manager", managerFilter)
        if (searchTerm) currentParams.set("search", searchTerm)
        return (
          <div className="flex items-center justify-end gap-2">
            <Link href={`/dashboard/orders/${id}?${currentParams.toString()}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
          </div>
        )
      },
    },
  ]

  if (!authData) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Orders</h1>
          {(authData.user.id === "fb384eb0-432a-4fe1-aff4-5a196d6dca4a" ||
            authData.user.id === "67e10586-72fc-4daa-9488-d62dae229332" ||
            authData.user.id === "905cb410-5a83-409d-833a-5bc0d2fec983" ||
            authData.user.id === "01b13ee8-6293-4161-ba87-983de8a2f241") && (
            <div className="text-lg font-semibold">
              Total Amount:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "INR",
              }).format(totalAmount)}
            </div>
          )}
        </div>

        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Select Columns to Export</h3>

              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    className="mr-2 h-4 w-4"
                    checked={Object.values(selectedColumns).every((v) => v)}
                    onChange={(e) => toggleAllColumns(e.target.checked)}
                  />
                  <label htmlFor="select-all" className="font-medium">
                    Select All
                  </label>
                </div>
                <div className="border-t my-2"></div>
              </div>

              <div className="max-h-60 overflow-y-auto grid grid-cols-1 gap-2">
                {Object.keys(selectedColumns).map((column) => (
                  <div key={column} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`column-${column}`}
                      className="mr-2 h-4 w-4"
                      checked={selectedColumns[column]}
                      onChange={(e) => {
                        setSelectedColumns({
                          ...selectedColumns,
                          [column]: e.target.checked,
                        })
                      }}
                    />
                    <label htmlFor={`column-${column}`}>{column}</label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowExportModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleExportToExcel}
                  disabled={isLoading || !Object.values(selectedColumns).some((v) => v)}
                >
                  {isLoading ? "Exporting..." : "Export"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          <Card
            className={`bg-gray-50 border-gray-200 ${statusFilter.length === 0 && !dateFilter && !dateRange ? "ring-2 ring-gray-400" : ""}`}
          >
            <CardContent
              className="pt-6 flex flex-col items-center cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                resetFilters()
              }}
            >
              <div className="rounded-full bg-gray-100 p-3 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-600"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <h3 className="text-3xl font-bold mt-2">{orderStats.total}</h3>
            </CardContent>
          </Card>

          <Card
            className={`bg-yellow-50 border-yellow-200 ${statusFilter.includes("pending") ? "ring-2 ring-yellow-400" : ""}`}
          >
            <CardContent
              className="pt-6 flex flex-col items-center cursor-pointer hover:bg-yellow-100 transition-colors"
              onClick={() => {
                setStatusFilter(["pending"])
                setPageIndex(0)
              }}
            >
              <div className="rounded-full bg-yellow-100 p-3 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-yellow-600"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-yellow-800">Pending</p>
              <h3 className="text-3xl font-bold mt-2 text-yellow-800">{orderStats.pending}</h3>
            </CardContent>
          </Card>

          <Card
            className={`bg-blue-50 border-blue-200 ${statusFilter.includes("confirmed") ? "ring-2 ring-blue-400" : ""}`}
          >
            <CardContent
              className="pt-6 flex flex-col items-center cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => {
                setStatusFilter(["confirmed"])
                setPageIndex(0)
              }}
            >
              <div className="rounded-full bg-blue-100 p-3 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-blue-800">Confirmed</p>
              <h3 className="text-3xl font-bold mt-2 text-blue-800">{orderStats.confirmed}</h3>
            </CardContent>
          </Card>

          <Card
            className={`bg-indigo-50 border-indigo-200 ${statusFilter.includes("reminder") ? "ring-2 ring-indigo-400" : ""}`}
          >
            <CardContent
              className="pt-6 flex flex-col items-center cursor-pointer hover:bg-indigo-100 transition-colors"
              onClick={() => {
                setStatusFilter(["reminder"])
                setPageIndex(0)
              }}
            >
              <div className="rounded-full bg-indigo-100 p-3 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-indigo-600"
                >
                  <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"></path>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <path d="M9 9h.01"></path>
                  <path d="M15 9h.01"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-indigo-800">Reminder</p>
              <h3 className="text-3xl font-bold mt-2 text-indigo-800">{orderStats.reminder}</h3>
            </CardContent>
          </Card>

          <Card
            className={`bg-purple-50 border-purple-200 ${
              statusFilter.includes("out_for_delivery") ? "ring-2 ring-purple-400" : ""
            }`}
          >
            <CardContent
              className="pt-6 flex flex-col items-center cursor-pointer hover:bg-purple-100 transition-colors"
              onClick={() => {
                setStatusFilter(["out_for_delivery"])
                setPageIndex(0)
              }}
            >
              <div className="rounded-full bg-purple-100 p-3 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-600"
                >
                  <path d="M3 3v18h18"></path>
                  <path d="m16 16-4-4-4 4"></path>
                  <path d="M16 10V4H4v12h6"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-purple-800">Out for Delivery</p>
              <h3 className="text-3xl font-bold mt-2 text-purple-800">{orderStats.out_for_delivery}</h3>
            </CardContent>
          </Card>

          <Card
            className={`bg-green-50 border-green-200 ${statusFilter.includes("delivered") ? "ring-2 ring-green-400" : ""}`}
          >
            <CardContent
              className="pt-6 flex flex-col items-center cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => {
                setStatusFilter(["delivered"])
                setPageIndex(0)
              }}
            >
              <div className="rounded-full bg-green-100 p-3 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-600"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p className="text-sm font-medium text-green-800">Delivered</p>
              <h3 className="text-3xl font-bold mt-2 text-green-800">{orderStats.delivered}</h3>
            </CardContent>
          </Card>

          <Card
            className={`bg-red-50 border-red-200 ${statusFilter.includes("cancelled") ? "ring-2 ring-red-400" : ""}`}
          >
            <CardContent
              className="pt-6 flex flex-col items-center cursor-pointer hover:bg-red-100 transition-colors"
              onClick={() => {
                setStatusFilter(["cancelled"])
                setPageIndex(0)
              }}
            >
              <div className="rounded-full bg-red-100 p-3 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-600"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" x2="9" y1="9" y2="15"></line>
                  <line x1="9" x2="15" y1="9" y2="15"></line>
                </svg>
              </div>
              <p className="text-sm font-medium text-red-800">Cancelled</p>
              <h3 className="text-3xl font-bold mt-2 text-red-800">{orderStats.cancelled}</h3>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="w-full">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search orders by ID, customer name or address..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                  }}
                />
              </div>
            </CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setShowExportModal(true)}
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                    {statusFilter.length === 0
                      ? "All Statuses"
                      : statusFilter.length === 1
                        ? statusFilter[0].charAt(0).toUpperCase() + statusFilter[0].slice(1)
                        : `${statusFilter.length} statuses selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                  <div className="p-2 space-y-1">
                    <div className="flex items-center justify-between p-2 border-b">
                      <span className="text-sm font-medium">Select Status</span>
                      {statusFilter.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStatusFilter([])}
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
                              checked={statusFilter.includes(status)}
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="date-filter">Filter by Date</Label>
              <Select
                value={dateFilter || "all"}
                onValueChange={(value) => {
                  setPageIndex(0)
                  setDateFilter(value === "all" ? null : value)
                  setDateRange(undefined) // Clear calendar range when selecting predefined filter
                }}
              >
                <SelectTrigger id="date-filter" className="w-[180px]">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="date-range">Custom Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range"
                    variant="outline"
                    className="w-full md:w-[220px] justify-start text-left font-normal h-10"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM dd, yyyy")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="text-sm font-medium">Select Date Range</h3>
                  </div>
                  <div className="p-3">
                    <style jsx global>{`
                      /* Custom styles for the calendar */
                      .rdp {
                        --rdp-cell-size: 40px;
                        margin: 0;
                      }
                      .rdp-months {
                        display: flex;
                        justify-content: center;
                      }
                      .rdp-month {
                        margin: 0 1rem;
                      }
                      .rdp-table {
                        margin: 0;
                        max-width: 100%;
                      }
                      .rdp-caption {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 0;
                        text-align: left;
                      }
                      .rdp-caption_label {
                        font-size: 1rem;
                        font-weight: 500;
                        margin: 0;
                      }
                      .rdp-nav {
                        display: flex;
                        align-items: center;
                      }
                      .rdp-nav_button {
                        width: 28px;
                        height: 28px;
                        padding: 0;
                        background: none;
                        border: none;
                        cursor: pointer;
                      }
                      .rdp-head_cell {
                        font-size: 0.875rem;
                        font-weight: 500;
                        text-align: center;
                        padding: 0.5rem 0;
                        width: var(--rdp-cell-size);
                      }
                      .rdp-cell {
                        padding: 0;
                        text-align: center;
                        width: var(--rdp-cell-size);
                        height: var(--rdp-cell-size);
                      }
                      .rdp-day {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 100%;
                        height: 100%;
                        border-radius: 9999px;
                        font-size: 0.875rem;
                      }
                      .rdp-day_selected {
                        background-color: #3b82f6;
                        color: white;
                      }
                      .rdp-day_selected:hover {
                        background-color: #2563eb;
                      }
                      .rdp-day_range_start,
                      .rdp-day_range_end {
                        background-color: #3b82f6;
                        color: white;
                      }
                      .rdp-day_range_middle {
                        background-color: #dbeafe;
                      }
                    `}</style>

                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateRangeSelect}
                      numberOfMonths={2}
                      className="p-3"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                        day_selected:
                          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border-t border-gray-200">
                    <Button variant="outline" size="sm" onClick={() => setDateRange(undefined)} className="text-xs h-8">
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => document.body.click()} // Close the popover
                      className="text-xs h-8"
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="executive-filter">Filter by Sales Executive</Label>
              <Select
                value={executiveFilter || "all"}
                onValueChange={(value) => {
                  setPageIndex(0)
                  setExecutiveFilter(value === "all" ? null : value)
                }}
              >
                <SelectTrigger id="executive-filter" className="w-[180px]">
                  <SelectValue placeholder="All Executives" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Executives</SelectItem>
                  {salesExecutives.map((exec) => (
                    <SelectItem key={exec.id} value={exec.id}>
                      {exec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="manager-filter">Filter by Sales Manager</Label>
              <Select
                value={managerFilter || "all"}
                onValueChange={(value) => {
                  setPageIndex(0)
                  setManagerFilter(value === "all" ? null : value)
                }}
              >
                <SelectTrigger id="manager-filter" className="w-[180px]">
                  <SelectValue placeholder="All Managers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  {salesManagers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={orders}
            isLoading={isLoading}
            emptyMessage="No orders found. Try adjusting your filters."
            serverSide={true}
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalCount={totalCount}
            pageCount={Math.ceil(totalCount / pageSize)}
            onPaginationChange={(newPageIndex, newPageSize) => {
              setPageIndex(newPageIndex)
              setPageSize(newPageSize)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
