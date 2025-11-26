"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Search } from "lucide-react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"

interface PurchaseOrder {
  id: string
  vendor_name: string | null
  vendor_id: string
  vendor_code: string | null
  po_status: string | null
  payment_terms: string
  created_at: string | null
}

export default function PurchaseOrdersContent() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [authData, setAuthData] = useState(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")

  // Function to update URL with search parameters
  const updateSearchParams = useCallback(
    (search: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) {
        params.set("search", search)
      } else {
        params.delete("search")
      }
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router],
  )

  // Handle search change
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value)
      updateSearchParams(value)
    },
    [updateSearchParams],
  )

  useEffect(() => {
    // Safely access localStorage only on the client side
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

  const allowedAdminIds = ["118de4f6-0322-4301-b521-7f46c50eb3cd", "d347bd21-e42b-4f63-ae12-b7589617b527","2d374b81-0fce-449a-a463-2b860e105eda","905cb410-5a83-409d-833a-5bc0d2fec983","00b89641-1870-4c9c-a110-b8f87a3c2d45"]

  const isAdmin = allowedAdminIds.includes(authData?.user?.id)

  // Function to fetch purchase orders
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const supabase = createSupabaseClient()
      const { data } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false })
      setPurchaseOrders(data || [])
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to delete a purchase order
  const deletePurchaseOrder = async (id: string) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from("purchase_orders").delete().eq("id", id)

      if (error) {
        throw error
      }

      // Remove the PO from the state
      setPurchaseOrders(purchaseOrders.filter((po) => po.id !== id))
      toast({
        title: "Purchase order deleted",
        description: "The purchase order has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting purchase order:", error)
      toast({
        title: "Error",
        description: "Failed to delete the purchase order. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Load purchase orders on component mount
  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  // Filter purchase orders based on search query
  const filteredPurchaseOrders = useMemo(() => {
    if (!searchQuery.trim()) {
      return purchaseOrders
    }

    const searchTerm = searchQuery.toLowerCase()
    return purchaseOrders.filter((po) => {
      return (
        po.id?.toLowerCase().includes(searchTerm) ||
        po.vendor_name?.toLowerCase().includes(searchTerm) ||
        po.vendor_id?.toLowerCase().includes(searchTerm) ||
        po.vendor_code?.toLowerCase().includes(searchTerm) ||
        po.payment_terms?.toLowerCase().includes(searchTerm) ||
        po.po_status?.toLowerCase().includes(searchTerm)
      )
    })
  }, [purchaseOrders, searchQuery])

  // Define table columns
  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: "id",
      header: "PO Number",
    },
    {
      accessorKey: "vendor_name",
      header: "Vendor",
      cell: ({ row }) => row.getValue("vendor_name") || row.getValue("vendor_id"),
    },
    {
      accessorKey: "payment_terms",
      header: "Payment Terms",
    },
    {
      accessorKey: "po_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("po_status") as string
        return (
          <Badge
            variant={
              status === "Approved"
                ? "default"
                : status === "Cancelled"
                  ? "destructive"
                  : status === "Completed"
                    ? "outline"
                    : "secondary"
            }
          >
            {status || "Draft"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Created Date",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return date ? new Date(date).toLocaleDateString() : "-"
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const po = row.original
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/purchase-orders/${po.id}`}>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-100"
              onClick={() => {
                setPoToDelete(po)
                setDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        {isAdmin && (
          <Link href="/dashboard/purchase-orders/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create PO
            </Button>
          </Link>
        )}
      </div>

      {/* Search Input */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by PO number, vendor, status..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        {searchQuery && (
          <Button variant="outline" size="sm" onClick={() => handleSearchChange("")}>
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4">Loading purchase orders...</div>
      ) : (
        <DataTable columns={columns} data={filteredPurchaseOrders} />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this purchase order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the purchase order
              {poToDelete?.id ? ` with ID ${poToDelete.id}` : ""} and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (poToDelete) {
                  deletePurchaseOrder(poToDelete.id)
                  setDeleteDialogOpen(false)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
