"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"
import { Plus, Search, Eye, X } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface PaymentTransaction {
  id: string
  transaction_type: string
  amount: number
  currency: string
  payment_method: string
  reference_number: string | null
  description: string | null
  status: string
  vendor_id: string | null
  payment_date: string
  processed_at: string | null
  created_at: string
  vendors?: {
    name: string
    contact_number: string | null
    email: string | null
    vendor_code: string | null
  }
}

interface PaymentTransactionsClientProps {
  transactions: PaymentTransaction[]
  searchParams: {
    search?: string
    status?: string
    type?: string
  }
}

export function PaymentTransactionsClient({ transactions, searchParams }: PaymentTransactionsClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(searchParams.search || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.status || "all")
  const [typeFilter, setTypeFilter] = useState(searchParams.type || "all")

  // Client-side filtering
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      !searchTerm ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.vendors?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
    const matchesType = typeFilter === "all" || transaction.transaction_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const handleApplyFilters = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set("search", searchTerm)
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (typeFilter !== "all") params.set("type", typeFilter)

    router.push(`/dashboard/payment-transactions?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTypeFilter("all")
    router.push("/dashboard/payment-transactions")
  }

  const columns: ColumnDef<PaymentTransaction>[] = [
    {
      accessorKey: "id",
      header: "Transaction ID",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/dashboard/payment-transactions/${row.original.id}`}
            className="font-medium text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>{row.original.id}</span>
            <Eye className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "transaction_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.transaction_type
        const typeColors = {
          to_vendor_payment: "bg-red-100 text-red-800",
          customer_payment: "bg-green-100 text-green-800",
          expense: "bg-orange-100 text-orange-800",
          income: "bg-blue-100 text-blue-800",
          refund: "bg-purple-100 text-purple-800",
          adjustment: "bg-gray-100 text-gray-800",
        }
        return (
          <Badge className={typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800"}>
            {type.replace("_", " ").toUpperCase()}
          </Badge>
        )
      },
    },
    {
      accessorKey: "vendors.name",
      header: "Vendor",
      cell: ({ row }) => {
        const vendor = row.original.vendors
        if (!vendor) return "N/A"
        return (
          <div>
            <div className="font-medium">{vendor.name}</div>
            {vendor.vendor_code && <div className="text-sm text-muted-foreground">{vendor.vendor_code}</div>}
          </div>
        )
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.amount, row.original.currency)}</span>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "Payment Method",
      cell: ({ row }) => <Badge variant="outline">{row.original.payment_method.replace("_", " ").toUpperCase()}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          completed: "bg-green-100 text-green-800",
          failed: "bg-red-100 text-red-800",
          cancelled: "bg-gray-100 text-gray-800",
          refunded: "bg-purple-100 text-purple-800",
        }
        return (
          <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
            {status.toUpperCase()}
          </Badge>
        )
      },
    },
    {
      accessorKey: "payment_date",
      header: "Payment Date",
      cell: ({ row }) => format(new Date(row.original.payment_date), "MMM dd, yyyy"),
    },
    {
      accessorKey: "reference_number",
      header: "Reference",
      cell: ({ row }) => row.original.reference_number || "-",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/payment-transactions/${row.original.id}`}>View Details</Link>
          </Button>
        </div>
      ),
    },
  ]

  // Calculate summary statistics
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const vendorPayments = filteredTransactions
    .filter((t) => t.transaction_type === "to_vendor_payment")
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const customerPayments = filteredTransactions
    .filter((t) => t.transaction_type === "customer_payment")
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const pendingCount = filteredTransactions.filter((t) => t.status === "pending").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Transactions</h1>
          <p className="text-muted-foreground">
            Manage and track all payment transactions between organization and vendors
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/payment-transactions/new">
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
     <Card>
  <CardHeader>
    <CardTitle>Filters</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      {/* Search input - takes 50% width on larger screens */}
      <div className="w-full sm:w-1/2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filter controls - take remaining space in a row */}
      <div className="w-full sm:w-1/2 flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="to_vendor_payment">To Vendor Payment</SelectItem>
            <SelectItem value="customer_payment">Customer Payment</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>

        {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full sm:w-auto"
            onClick={handleClearFilters}
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  </CardContent>
</Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>A list of all payment transactions in your system.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredTransactions} />
        </CardContent>
      </Card>
    </div>
  )
}
