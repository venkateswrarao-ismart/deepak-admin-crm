"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { DateRange } from "react-day-picker"
import { addDays, format, subDays } from "date-fns"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { Phone, Search, UserCog, BarChart2, Trophy, AlertTriangle, Calendar as CalendarIcon, Filter, X, Download } from "lucide-react"

type PerformanceData = {
  executive_id: string
  executive_name: string
  total_orders: number
  total_amount: number
  performance: 'high' | 'medium' | 'low'
  manager_name: string
  top_products: {
    product_id: string
    product_name: string
    total_quantity: number
    total_amount: number
  }[]
}

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export default function SalesExecutivesPage() {
  const [executives, setExecutives] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedExecutive, setSelectedExecutive] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [performanceLoading, setPerformanceLoading] = useState(true)
  const [filteredPerformanceData, setFilteredPerformanceData] = useState<PerformanceData[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [products, setProducts] = useState<{id: string, name: string}[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const search = searchParams.get("search") || ""

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      let query = supabase
        .from("sales_executives")
        .select("*, sales_managers(name)", { count: "exact" })
        .order("created_at", { ascending: false })

      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      const { data, count, error } = await query

      if (error) {
        console.error("Error fetching executives:", error)
      } else {
        setExecutives(data || [])
        setCount(count || 0)
      }

      setLoading(false)
    }

    fetchData()
  }, [search])

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name", { ascending: true })

      if (error) {
        console.error("Error fetching products:", error)
      } else {
        setProducts(data || [])
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setPerformanceLoading(true)
      try {
        // Fetch all orders in batches
        const allOrders: any[] = []
        const pageSize = 1000
        let from = 0
        let to = pageSize - 1
        let hasMore = true

        while (hasMore) {
          const { data: batch, error } = await supabase
            .from("orders")
            .select(
              `
                id,
                sales_executive_id,
                total_amount,
                created_at,
                status,
                sales_executive:sales_executive_id(name, manager_id),
                sales_manager:sales_manager_id(name)
              `
            )
            .order("created_at", { ascending: false })
            .range(from, to)

          if (error) throw error

          if (batch.length > 0) {
            allOrders.push(...batch)
            from += pageSize
            to += pageSize
          } else {
            hasMore = false
          }
        }

        // Fetch all order items
        const allOrderItems: any[] = []
        from = 0
        to = pageSize - 1
        hasMore = true

        while (hasMore) {
          const { data: batch, error } = await supabase
            .from("order_items")
            .select(
              `
                id,
                order_id,
                product_id,
                quantity,
                unit_price,
                product:product_id(name)
              `
            )
            .range(from, to)

          if (error) throw error

          if (batch.length > 0) {
            allOrderItems.push(...batch)
            from += pageSize
            to += pageSize
          } else {
            hasMore = false
          }
        }

        // Fetch all executives
        const { data: allExecutives, error: execError } = await supabase
          .from("sales_executives")
          .select("id, name, manager_id, sales_managers(name)")

        if (execError) throw execError

        // Initialize map
        const executiveMap = new Map<string, PerformanceData>()
        const executiveProductsMap = new Map<string, Map<string, {quantity: number, amount: number, name: string}>>()

        allExecutives?.forEach(exec => {
          executiveMap.set(exec.id, {
            executive_id: exec.id,
            executive_name: exec.name || "Unnamed",
            total_orders: 0,
            total_amount: 0,
            performance: 'low',
            manager_name: exec.sales_managers?.name || "No manager",
            top_products: []
          })
          executiveProductsMap.set(exec.id, new Map())
        })

        // Aggregate orders
        allOrders?.forEach(order => {
          if (order.sales_executive_id) {
            const execData = executiveMap.get(order.sales_executive_id)
            if (execData) {
              execData.total_orders += 1
              execData.total_amount += order.total_amount || 0
            }
          }
        })

        // Aggregate order items by executive and product
        allOrderItems?.forEach(item => {
          const order = allOrders.find(o => o.id === item.order_id)
          if (order?.sales_executive_id && item.product_id) {
            const productMap = executiveProductsMap.get(order.sales_executive_id)
            if (productMap) {
              const current = productMap.get(item.product_id) || {quantity: 0, amount: 0, name: item.product?.name || 'Unknown'}
              productMap.set(item.product_id, {
                quantity: current.quantity + item.quantity,
                amount: current.amount + (item.quantity * item.unit_price),
                name: item.product?.name || 'Unknown'
              })
            }
          }
        })

        // Convert product maps to top products arrays
        executiveProductsMap.forEach((productMap, executiveId) => {
          const execData = executiveMap.get(executiveId)
          if (execData) {
            const productsArray = Array.from(productMap.entries()).map(([product_id, data]) => ({
              product_id,
              product_name: data.name,
              total_quantity: data.quantity,
              total_amount: data.amount
            }))
            execData.top_products = productsArray.sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 5)
          }
        })

        const allPerformance = Array.from(executiveMap.values())

        // Calculate performance tiers based on percentiles
        if (allPerformance.length > 0) {
          // Sort by total_orders descending
          const sortedByOrders = [...allPerformance].sort((a, b) => b.total_orders - a.total_orders)
          
          // Determine thresholds (top 20% = high, next 30% = medium, bottom 50% = low)
          const highThresholdIndex = Math.floor(sortedByOrders.length * 0.2)
          const mediumThresholdIndex = Math.floor(sortedByOrders.length * 0.5)
          
          sortedByOrders.forEach((exec, index) => {
            if (index <= highThresholdIndex) {
              exec.performance = 'high'
            } else if (index <= mediumThresholdIndex) {
              exec.performance = 'medium'
            } else {
              exec.performance = 'low'
            }
          })
        }

        setPerformanceData(allPerformance)
        setFilteredPerformanceData(allPerformance) // Initialize filtered data with all data
      } catch (error) {
        console.error("Error fetching performance data:", error)
      } finally {
        setPerformanceLoading(false)
      }
    }

    fetchPerformanceData()
  }, [])

  const applyFilters = async () => {
    setPerformanceLoading(true)
    try {
      let query = supabase
        .from("orders")
        .select(
          `
            id,
            sales_executive_id,
            total_amount,
            created_at,
            status,
            sales_executive:sales_executive_id(name, manager_id),
            sales_manager:sales_manager_id(name),
            order_items(
              id,
              product_id,
              quantity,
              unit_price,
              product:product_id(name)
            )
          `
        )

      // Apply date filter
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString())
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data: filteredOrders, error } = await query

      if (error) throw error

      // Recalculate performance data with filtered orders
      const executiveMap = new Map<string, PerformanceData>()
      const executiveProductsMap = new Map<string, Map<string, {quantity: number, amount: number, name: string}>>()

      // Initialize with all executives
      executives.forEach(exec => {
        executiveMap.set(exec.id, {
          executive_id: exec.id,
          executive_name: exec.name || "Unnamed",
          total_orders: 0,
          total_amount: 0,
          performance: 'low',
          manager_name: exec.sales_managers?.name || "No manager",
          top_products: []
        })
        executiveProductsMap.set(exec.id, new Map())
      })

      // Aggregate filtered orders and order items
      filteredOrders?.forEach(order => {
        if (order.sales_executive_id) {
          const execData = executiveMap.get(order.sales_executive_id)
          if (execData) {
            execData.total_orders += 1
            execData.total_amount += order.total_amount || 0
          }

          // Process order items for product filtering
          if (order.order_items && Array.isArray(order.order_items)) {
            order.order_items.forEach((item: any) => {
              const productMap = executiveProductsMap.get(order.sales_executive_id)
              if (productMap) {
                const current = productMap.get(item.product_id) || {quantity: 0, amount: 0, name: item.product?.name || 'Unknown'}
                productMap.set(item.product_id, {
                  quantity: current.quantity + item.quantity,
                  amount: current.amount + (item.quantity * item.unit_price),
                  name: item.product?.name || 'Unknown'
                })
              }
            })
          }
        }
      })

      // Convert product maps to top products arrays
      executiveProductsMap.forEach((productMap, executiveId) => {
        const execData = executiveMap.get(executiveId)
        if (execData) {
          let productsArray = Array.from(productMap.entries()).map(([product_id, data]) => ({
            product_id,
            product_name: data.name,
            total_quantity: data.quantity,
            total_amount: data.amount
          }))

          // Apply product filter if specified
          if (productFilter !== 'all') {
            productsArray = productsArray.filter(p => p.product_id === productFilter)
          }

          execData.top_products = productsArray.sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 5)
        }
      })

      // Filter executives if product filter is applied
      let filteredPerformance = Array.from(executiveMap.values())
      if (productFilter !== 'all') {
        filteredPerformance = filteredPerformance.filter(exec => 
          exec.top_products.some(p => p.product_id === productFilter)
        )
      }

      // Recalculate performance tiers for filtered data
      if (filteredPerformance.length > 0) {
        const sortedByOrders = [...filteredPerformance]
        const highThresholdIndex = Math.floor(sortedByOrders.length * 0.2)
        const mediumThresholdIndex = Math.floor(sortedByOrders.length * 0.5)
        
        sortedByOrders.forEach((exec, index) => {
          if (index <= highThresholdIndex) {
            exec.performance = 'high'
          } else if (index <= mediumThresholdIndex) {
            exec.performance = 'medium'
          } else {
            exec.performance = 'low'
          }
        })
      }

      setFilteredPerformanceData(filteredPerformance)
    } catch (error) {
      console.error("Error applying filters:", error)
    } finally {
      setPerformanceLoading(false)
      setShowFilters(false)
    }
  }

  const resetFilters = () => {
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date(),
    })
    setStatusFilter('all')
    setProductFilter('all')
    setFilteredPerformanceData(performanceData)
  }



const downloadFilteredOrders = async () => {
  try {
    setPerformanceLoading(true)

    let query = supabase
      .from("orders")
      .select(
        `
          id,
          total_amount,
          status,
          created_at,
          delivery_address,
          comments,
          sales_agent_name,
          sales_agent_phone,
          sales_executive:sales_executive_id(name),
          customer:customer_id(
            full_name,
            phone,
            shop_name
          ),
          order_items(
            product_id,
            quantity,
            unit_price,
            product:product_id(name)
          )
        `
      )
      .order("created_at", { ascending: false })

    if (dateRange?.from) {
      query = query.gte('created_at', dateRange.from.toISOString())
    }
    if (dateRange?.to) {
      query = query.lte('created_at', dateRange.to.toISOString())
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const allOrders: any[] = []
    const pageSize = 1000
    let from = 0
    let to = pageSize - 1
    let hasMore = true

    while (hasMore) {
      const { data: batch, error } = await query.range(from, to)
      if (error) throw error

      if (batch && batch.length > 0) {
        allOrders.push(...batch)
        from += pageSize
        to += pageSize
      } else {
        hasMore = false
      }
    }

    let filteredOrders = allOrders
    if (productFilter !== 'all') {
      filteredOrders = allOrders.filter(order =>
        order.order_items?.some((item: any) => item.product_id === productFilter)
      )
    }

    const excelData = filteredOrders.map(order => ({
      'Order ID': order.id,
      'Date': format(new Date(order.created_at), 'dd-MMM-yyyy HH:mm'),
      'Customer Name': order.customer?.full_name || 'N/A',
      'Customer Phone': order.customer?.phone || 'N/A',
      'Shop Name': order.customer?.shop_name || 'N/A',
      'Status': order.status,
      'Sales Executive': order.sales_executive?.name || 'N/A',
      'Sales Agent Name': order.sales_agent_name || 'N/A',
      'Sales Agent Phone': order.sales_agent_phone || 'N/A',
      'Delivery Address': order.delivery_address || 'N/A',
      'Comments': order.comments || '',
      'Total Amount': order.total_amount,
      'Products': order.order_items?.map((item: any) =>
        `${item.product?.name || 'Unknown'} (${item.quantity} x ₹${item.unit_price})`
      ).join(', ') || 'No items',
      'Total Items': order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders")

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    let filename = `Orders_Export_${format(new Date(), 'yyyyMMdd_HHmm')}`
    if (dateRange?.from) {
      filename += `_from_${format(dateRange.from, 'yyyyMMdd')}`
    }
    if (dateRange?.to) {
      filename += `_to_${format(dateRange.to, 'yyyyMMdd')}`
    }
    if (statusFilter !== 'all') {
      filename += `_${statusFilter}`
    }
    if (productFilter !== 'all') {
      const productName = products.find(p => p.id === productFilter)?.name || 'product'
      filename += `_${productName.replace(/[^a-z0-9]/gi, '_')}`
    }
    filename += '.xlsx'

    saveAs(data, filename)
  } catch (error) {
    console.error("Error exporting orders:", error)
    alert("Failed to export orders. Please try again.")
  } finally {
    setPerformanceLoading(false)
  }
}



  const handleDelete = async () => {
    if (!selectedExecutive) return
    const { error } = await supabase
      .from("sales_executives")
      .delete()
      .eq("id", selectedExecutive.id)

    if (error) {
      console.error("Failed to delete executive:", error)
    } else {
      setExecutives((prev) => prev.filter((e) => e.id !== selectedExecutive.id))
      setCount((prev) => prev - 1)
      setPerformanceData(prev => prev.filter(e => e.executive_id !== selectedExecutive.id))
      setFilteredPerformanceData(prev => prev.filter(e => e.executive_id !== selectedExecutive.id))
    }

    setShowDeleteDialog(false)
    setSelectedExecutive(null)
  }


  
  const getOrdersUrl = (executiveId: string) => {
    const params = new URLSearchParams()
    params.set('executive', executiveId)
    if (dateRange?.from) {
      params.set('from', dateRange.from.toISOString())
    }
    if (dateRange?.to) {
      params.set('to', dateRange.to.toISOString())
    }
    if (statusFilter !== 'all') {
      params.set('status', statusFilter)
    }
    if (productFilter !== 'all') {
      params.set('product', productFilter)
    }
    return `/dashboard/orders?${params.toString()}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const performanceColors = {
    high: "#22c55e",
    medium: "#f59e0b",
    low: "#ef4444"
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: any }) => {
        const exec = row.original
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
              {exec.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <div className="font-medium">{exec.name || "Unnamed"}</div>
              <div className="text-xs text-muted-foreground">ID: {exec.id.substring(0, 8)}...</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }: { row: any }) => {
        const phone = row.getValue("phone")
        return phone ? (
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{phone}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No phone</span>
        )
      },
    },
    {
      accessorKey: "sales_managers.name",
      header: "Manager",
      cell: ({ row }: { row: any }) => {
        const manager = row.original.sales_managers
        return manager?.name ? (
          <span>{manager.name}</span>
        ) : (
          <span className="text-muted-foreground">No manager</span>
        )
      },
    },
    {
      accessorKey: "performance",
      header: "Performance",
      cell: ({ row }: { row: any }) => {
        const execId = row.original.id
        const performance = filteredPerformanceData.find(e => e.executive_id === execId)?.performance || 'low'
        
        return (
          <Badge 
            variant="outline" 
            className={
              performance === 'high' ? 'bg-green-100 text-green-800 border-green-200' :
              performance === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              'bg-red-100 text-red-800 border-red-200'
            }
          >
            {performance === 'high' && <Trophy className="h-3 w-3 mr-1" />}
            {performance === 'medium' && <BarChart2 className="h-3 w-3 mr-1" />}
            {performance === 'low' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {performance.charAt(0).toUpperCase() + performance.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }: { row: any }) => formatDate(row.getValue("created_at")),
    },
    {
      id: "actions",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/dashboard/sales-executive/${row.original.id}`}>
            <Button variant="outline" size="sm">View</Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setSelectedExecutive(row.original)
              setShowDeleteDialog(true)
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sales Executives</h1>
        <Link href="/dashboard/sales-executive/new">
          <Button>Add Sales Executive</Button>
        </Link>
      </div>

      <Tabs defaultValue="performance">
        <TabsList>
        
          <TabsTrigger value="performance">Performance Dashboard</TabsTrigger>
            <TabsTrigger value="list">Executives List</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executives</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">Executives registered in the system</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <form
                className="flex-1"
                onSubmit={(e) => {
                  e.preventDefault()
                  const form = e.currentTarget
                  const query = new FormData(form).get("search")?.toString()
                  if (query !== undefined) {
                    router.push(`/dashboard/sales-executive?search=${query}`)
                  }
                }}
              >
                <Input
                  placeholder="Search Executives by name or phone..."
                  name="search"
                  defaultValue={search}
                  className="max-w-sm"
                />
              </form>
            </div>

            <Card className="p-4">
              <CardHeader>
                <CardTitle>Executives List</CardTitle>
                <CardDescription>Manage your sales executives and view their details.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={columns} data={executives} isLoading={loading} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
  <h2 className="text-2xl font-bold">Performance Analytics</h2>
  <div className="flex gap-2">
    <Button 
      variant="outline" 
      onClick={downloadFilteredOrders}
      disabled={performanceLoading}
    >
      <Download className="h-4 w-4 mr-2" />
      Export Orders
    </Button>
    <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
      <Filter className="h-4 w-4 mr-2" />
      Filters
    </Button>
    <Button variant="outline" onClick={resetFilters}>
      <X className="h-4 w-4 mr-2" />
      Reset
    </Button>
  </div>
</div>

            {showFilters && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date Range</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date"
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                              dateRange.to ? (
                                <>
                                  {format(dateRange.from, "LLL dd, y")} -{" "}
                                  {format(dateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(dateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Popover>
  <PopoverTrigger asChild>
    <Button
      id="date"
      variant={"outline"}
      className="w-full justify-start text-left font-normal"
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {dateRange?.from ? (
        dateRange.to ? (
          <>
            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
          </>
        ) : (
          format(dateRange.from, "LLL dd, y")
        )
      ) : (
        <span>Pick a date range</span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">From:</label>
        <input
          type="date"
          value={dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const fromDate = e.target.value ? new Date(e.target.value) : undefined
            setDateRange(prev => ({ ...prev, from: fromDate }))
          }}
          className="border px-3 py-2 rounded-md"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">To:</label>
        <input
          type="date"
          value={dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const toDate = e.target.value ? new Date(e.target.value) : undefined
            setDateRange(prev => ({ ...prev, to: toDate }))
          }}
          className="border px-3 py-2 rounded-md"
        />
      </div>
    </div>
  </PopoverContent>
</Popover>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Order Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="out_for_delivery">Out For Delivery</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Product</label>
                      <Select value={productFilter} onValueChange={setProductFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button onClick={applyFilters} className="w-full">
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Executive Performance</CardTitle>
                <CardDescription>
                  {dateRange?.from && dateRange?.to && (
                    <span className="block">
                      Showing data from {format(dateRange.from, "MMM d, yyyy")} to {format(dateRange.to, "MMM d, yyyy")}
                      {statusFilter !== 'all' && ` (Status: ${statusFilter})`}
                      {productFilter !== 'all' && ` (Product: ${products.find(p => p.id === productFilter)?.name || 'Unknown'})`}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {performanceLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>Loading performance data...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Orders by Executive</h3>
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={filteredPerformanceData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis 
                              dataKey="executive_name" 
                              type="category" 
                              width={150}
                              tick={{ fontSize: 12 }}
                              interval={0}
                            />
                            <Tooltip 
                              formatter={(value, name, props) => {
                                if (name === 'Total Orders') {
                                  return [value, `${props.payload.executive_name}'s Orders`]
                                }
                                return [value, name]
                              }}
                            />
                            <Legend />
                            <Bar dataKey="total_orders" name="Total Orders">
                              {filteredPerformanceData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={performanceColors[entry.performance]} 
                                 onClick={() => router.push(getOrdersUrl(entry.executive_id))}
                                  style={{ cursor: 'pointer' }}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Revenue by Executive</h3>
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={filteredPerformanceData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis 
                              dataKey="executive_name" 
                              type="category" 
                              width={150}
                              tick={{ fontSize: 12 }}
                              interval={0}
                            />
                            <Tooltip 
                              formatter={(value, name, props) => {
                                if (name === 'Total Revenue') {
                                  return [`₹${value}`, `${props.payload.executive_name}'s Revenue`]
                                }
                                return [value, name]
                              }}
                            />
                            <Legend />
                            <Bar dataKey="total_amount" name="Total Revenue">
                              {filteredPerformanceData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={performanceColors[entry.performance]} 
                                  onClick={() => router.push(`/dashboard/sales-executive/${entry.executive_id}`)}
                                  style={{ cursor: 'pointer' }}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Top Performers</h3>
                      <Trophy className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="mt-2 space-y-2">
                      {filteredPerformanceData
                        .filter(e => e.performance === 'high')
                     
                        .slice(0, 3)
                        .map(exec => (
                          <div 
                            key={exec.executive_id} 
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => router.push(`/dashboard/sales-executive/${exec.executive_id}`)}
                          >
                            <span>{exec.executive_name}</span>
                            <span className="font-medium">₹{exec.total_amount.toLocaleString()}</span>
                            <span className="text-sm text-muted-foreground">{exec.total_orders} orders</span>
                          </div>
                        ))}
                      {filteredPerformanceData.filter(e => e.performance === 'high').length === 0 && (
                        <p className="text-sm text-muted-foreground">No top performers</p>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Average Performers</h3>
                      <BarChart2 className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="mt-2 space-y-2">
                      {filteredPerformanceData
                       
                        .slice(0, 3)
                        .map(exec => (
                          <div 
                            key={exec.executive_id} 
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => router.push(`/dashboard/sales-executive/${exec.executive_id}`)}
                          >
                            <span>{exec.executive_name}</span>
                            <span className="font-medium">₹{exec.total_amount.toLocaleString()}</span>
                            <span className="text-sm text-muted-foreground">{exec.total_orders} orders</span>
                          </div>
                        ))}
                      {filteredPerformanceData.filter(e => e.performance === 'medium').length === 0 && (
                        <p className="text-sm text-muted-foreground">No average performers</p>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Needs Improvement</h3>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="mt-2 space-y-2">
                      {filteredPerformanceData
                        .filter(e => e.performance === 'low')
                     
                        .slice(0, 3)
                        .map(exec => (
                          <div 
                            key={exec.executive_id} 
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => router.push(`/dashboard/sales-executive/${exec.executive_id}`)}
                          >
                            <span>{exec.executive_name}</span>
                            <span className="font-medium">₹{exec.total_amount.toLocaleString()}</span>
                            <span className="text-sm text-muted-foreground">{exec.total_orders} orders</span>
                          </div>
                        ))}
                      {filteredPerformanceData.filter(e => e.performance === 'low').length === 0 && (
                        <p className="text-sm text-muted-foreground">All executives performing well</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products by Executive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredPerformanceData
               
                    .slice(0, 3)
                    .map(exec => (
                      <div key={exec.executive_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{exec.executive_name}</h3>
                          <Badge 
                            variant="outline" 
                            className={
                              exec.performance === 'high' ? 'bg-green-100 text-green-800 border-green-200' :
                              exec.performance === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            }
                          >
                            {exec.performance.charAt(0).toUpperCase() + exec.performance.slice(1)}
                          </Badge>
                        </div>
                        <div className="mt-4 space-y-3">
                          {exec.top_products.length > 0 ? (
                            exec.top_products.map((product, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                  <p className="font-medium">{product.product_name}</p>
                                  <p className="text-sm text-muted-foreground">ID: {product?.product_id?.substring(0, 8)}...</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{product.total_quantity} sold</p>
                                  <p className="text-sm text-muted-foreground">₹{product?.total_amount?.toLocaleString()}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No product data available</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Executive</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete <strong>{selectedExecutive?.name}</strong>?</p>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
