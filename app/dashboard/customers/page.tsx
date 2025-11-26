"use client"

import type React from "react"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/data-table"
import { Mail, Phone, Search, Users, UserCheck, UserX } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"

// Define types for the API response
interface Customer {
  email: any
  isActive: unknown
  id: string
  full_name: string | null
  profile_email: string | null
  phone: string | null
  last_sign_in_at: string | null
  role: string
  total_count?: number
  created_at?: string
}

interface PaginationInfo {
  total: number
}

interface ApiResponse {
  activeCustomers: Customer[]
  pagination: PaginationInfo
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [inactiveCount, setInactiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  const search = searchParams.get("search") || ""
  const filter = searchParams.get("filter") || "all"
  const [activeUserIds, setActiveUserIds] = useState<string[]>([])
  const [lastActiveMap, setLastActiveMap] = useState<Record<string, string>>({})
  const [totalCustomerCount, setTotalCustomerCount] = useState(0)
  const [activeCustomers, setActiveCustomers] = useState<Customer[]>([])
  const [filteredCount, setFilteredCount] = useState(0)

  // Fetch all customers and active customers data
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch active customers from our API
        console.log("Fetching active customers from API...")
        const activeResponse = await fetch("/api/active-users")

        if (!activeResponse.ok) {
          throw new Error(`Server returned ${activeResponse.status}: ${activeResponse.statusText}`)
        }

        const activeData: ApiResponse = await activeResponse.json()
        console.log("Active customers data:", activeData)

        // Store active customers
        const activeCustomersList = activeData.activeCustomers || []
        setActiveCustomers(activeCustomersList)

        // Extract active user IDs for filtering
        const activeIds = activeCustomersList.map((customer) => customer.id)
        setActiveUserIds(activeIds)
        setActiveCount(activeIds.length)

        // Create last active map for displaying last sign-in time
        const lastActive: Record<string, string> = {}
        activeCustomersList.forEach((customer) => {
          if (customer.last_sign_in_at) {
            lastActive[customer.id] = customer.last_sign_in_at
          }
        })
        setLastActiveMap(lastActive)

        // Fetch all customers from Supabase
        const supabase = createClientComponentClient()

        // Get all customers with role "customer"
        const {
          data: allCustomersData,
          count: totalCount,
          error: customersError,
        } = await supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .eq("role", "customer")
          .order("created_at", { ascending: false })

        if (customersError) throw customersError

        console.log("All customers count:", totalCount)
        setTotalCustomerCount(totalCount || 0)

        // Process all customers to include active status
        const processedCustomers = (allCustomersData || []).map((customer) => {
          const isActive = activeIds.includes(customer.id)
          return {
            ...customer,
            isActive,
            last_sign_in_at: lastActive[customer.id] || null,
          }
        })

        setAllCustomers(processedCustomers)

        // Calculate inactive count
        setInactiveCount((totalCount || 0) - activeIds.length)

        // Apply filtering based on the current filter
        applyFiltering(processedCustomers, activeCustomersList, search, filter)
      } catch (error) {
        console.error("Error fetching data:", error)

        // Fallback to direct Supabase queries if API fails
        try {
          const supabase = createClientComponentClient()

          // Get all customers
          const {
            data: profiles,
            count: totalCount,
            error: profilesError,
          } = await supabase.from("profiles").select("*", { count: "exact" }).eq("role", "customer")

          if (profilesError) throw profilesError

          setTotalCustomerCount(totalCount || 0)

          // Get active users from auth.users
          const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

          if (authError) throw authError

          // Calculate the date 2 days ago
          const twoDaysAgo = new Date()
          twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

          // Filter for users active in the last 2 days
          const activeUsers = authData.users.filter(
            (user) => user.last_sign_in_at && new Date(user.last_sign_in_at) >= twoDaysAgo,
          )

          // Extract active user IDs
          const activeIds = activeUsers.map((user) => user.id)
          setActiveUserIds(activeIds)
          setActiveCount(activeIds.length)

          // Create last active map
          const lastActive: Record<string, string> = {}
          authData.users.forEach((user) => {
            if (user.last_sign_in_at) {
              lastActive[user.id] = user.last_sign_in_at
            }
          })
          setLastActiveMap(lastActive)

          // Process all customers to include active status
          const processedCustomers = (profiles || []).map((customer) => {
            const isActive = activeIds.includes(customer.id)
            return {
              ...customer,
              isActive,
              last_sign_in_at: lastActive[customer.id] || null,
            }
          })

          setAllCustomers(processedCustomers)

          // Calculate inactive count
          setInactiveCount((totalCount || 0) - activeIds.length)

          // Apply filtering based on the current filter
          applyFiltering(processedCustomers, [], search, filter)
        } catch (fallbackError) {
          console.error("Fallback approach failed:", fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [search, filter])

  // Function to apply filtering based on search and filter
  const applyFiltering = (allCustomers: Customer[], activeCustomers: Customer[], search: string, filter: string) => {
    let filteredData: Customer[] = []

    // First apply the filter (all, active, inactive)
    if (filter === "active") {
      // For active filter, use the active customers from API if available
      if (activeCustomers.length > 0) {
        filteredData = [...activeCustomers]
      } else {
        filteredData = allCustomers.filter((customer) => customer.isActive)
      }
    } else if (filter === "inactive") {
      filteredData = allCustomers.filter((customer) => !customer.isActive)
    } else {
      // For "all" filter, use all customers
      filteredData = [...allCustomers]
    }

    // Then apply search if provided
    if (search) {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter(
        (customer) =>
          (customer.full_name && customer.full_name.toLowerCase().includes(searchLower)) ||
          (customer.profile_email && customer.profile_email.toLowerCase().includes(searchLower)) ||
          (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
          (customer.phone && customer.phone.toLowerCase().includes(searchLower)),
      )
    }

    // Update state with filtered data
    setCustomers(filteredData)
    setFilteredCount(filteredData.length)
  }

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  // Format time ago for last active
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Never"

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`
      }
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    } else {
      return formatDate(dateString)
    }
  }

  const columns = [
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }: { row: any }) => {
        const customer = row.original
        return (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
              {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <div className="font-medium">{customer.full_name || "Unnamed Customer"}</div>
              <div className="text-xs text-muted-foreground">ID: {customer.id.substring(0, 8)}...</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }: { row: any }) => {
        // Handle both email and profile_email (from API)
        const email = row.getValue("email") || row.original.profile_email
        return email ? (
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No email</span>
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
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }: { row: any }) => {
        // Determine if the customer is active
        const isActive =
          filter === "active" || // If we're in active filter, all are active
          (row.original.hasOwnProperty("isActive")
            ? row.original.isActive
            : // Use the isActive property if it exists
              activeUserIds.includes(row.original.id)) // Otherwise check against active IDs

        return isActive ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Inactive
          </Badge>
        )
      },
    },
    {
      accessorKey: "last_sign_in_at",
      header: "Last Active",
      cell: ({ row }: { row: any }) => formatTimeAgo(row.getValue("last_sign_in_at")),
    },
    {
      accessorKey: "created_at",
      header: "Registered On",
      cell: ({ row }: { row: any }) => formatDate(row.getValue("created_at")),
    },
    {
      id: "actions",
      cell: ({ row }: { row: any }) => {
        return (
          <div className="text-right">
            <Link href={`/dashboard/customers/${row.original.id}`}>
              <Button variant="outline" size="sm">
                View
              </Button>
            </Link>
          </div>
        )
      },
    },
  ]

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const searchValue = formData.get("search") as string

    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) {
      params.set("search", searchValue)
    } else {
      params.delete("search")
    }

    router.push(`/dashboard/customers?${params.toString()}`)
  }

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value !== "all") {
      params.set("filter", value)
    } else {
      params.delete("filter")
    }
    router.push(`/dashboard/customers?${params.toString()}`)
  }

  // Get the filter label for display
  const getFilterLabel = () => {
    switch (filter) {
      case "active":
        return "Active"
      case "inactive":
        return "Inactive"
      default:
        return "All"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customers</h1>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email or phone..."
              name="search"
              defaultValue={search}
              className="w-full sm:w-80"
            />
          </form>

          <div className="w-full sm:w-auto">
            <Badge variant="outline" className="bg-muted/50 text-sm">
              {getFilterLabel()} View
            </Badge>
            {search && (
              <Badge variant="outline" className="ml-2 bg-muted/50 text-sm">
                Search: "{search}"
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className={`cursor-pointer transition-all hover:border-primary/50 ${filter === "all" ? "border-2 border-primary bg-primary/5" : ""}`}
            onClick={() => handleFilterChange("all")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{totalCustomerCount}</div>
              <p className="text-xs text-muted-foreground mt-1">All registered customer accounts</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-green-500/50 ${filter === "active" ? "border-2 border-green-500 bg-green-50" : ""}`}
            onClick={() => handleFilterChange("active")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{activeCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Active in the last 48 hours</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-red-500/50 ${filter === "inactive" ? "border-2 border-red-500 bg-red-50" : ""}`}
            onClick={() => handleFilterChange("inactive")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Inactive Customers</CardTitle>
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <UserX className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{inactiveCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Not active in the last 48 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtered Results Card */}
        {/* <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <ListFilter className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtered Results</p>
                <h3 className="text-xl font-bold">
                  {filteredCount} {filteredCount === 1 ? "Customer" : "Customers"}
                </h3>
              </div>
            </div>
            <div>
              <Badge variant="outline" className="bg-muted/50">
                {getFilterLabel()} View
              </Badge>
              {search && (
                <Badge variant="outline" className="ml-2 bg-muted/50">
                  Search: "{search}"
                </Badge>
              )}
            </div>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>
              {filter === "all" && "All Customers"}
              {filter === "active" && "Active Customers"}
              {filter === "inactive" && "Inactive Customers"}
            </CardTitle>
            <CardDescription>
              {filter === "all" && "Manage all your customer accounts and view their details."}
              {filter === "active" && "Customers who have been active in the last 48 hours."}
              {filter === "inactive" && "Customers who haven't been active for more than 48 hours."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={customers}
              isLoading={loading}
              onCountChange={(count) => {
                setFilteredCount(count)
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
