"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface GRN {
  id: string
  po_id: string
  received_date: string | null
  status: string | null
  vendor_name?: string
  created_at: string | null
}

const columns: ColumnDef<GRN>[] = [
  {
    accessorKey: "id",
    header: "GRN ID",
  },
  {
    accessorKey: "po_id",
    header: "PO Number",
  },
  {
    accessorKey: "vendor_name",
    header: "Vendor",
    cell: ({ row }) => row.getValue("vendor_name") || "Unknown",
  },
  {
    accessorKey: "received_date",
    header: "Receipt Date",
    cell: ({ row }) => {
      const date = row.getValue("received_date") as string
      return date ? new Date(date).toLocaleDateString() : "-"
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "Received" ? "default" : status === "Partially Received" ? "outline" : "secondary"}>
          {status || "Pending"}
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
    cell: ({ row }) => {
      const grn = row.original
      return (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/grn/${grn.id}`}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
        </div>
      )
    },
  },
]

export default function GRNPage() {
  const [grns, setGrns] = useState<GRN[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [authData, setAuthData] = useState(null)

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

   const allowedAdminIds = [
         
          "d347bd21-e42b-4f63-ae12-b7589617b527"
        ]

        const isAdmin = allowedAdminIds.includes(authData?.user?.id)

  useEffect(() => {
    async function fetchGRNs() {
      try {
        setLoading(true)
        setError(null)
        const supabase = createSupabaseClient()

        console.log("Checking if goods_receipt_notes table exists...")

        // First, check if the table exists by trying to get its count
        const { count, error: countError } = await supabase
          .from("goods_receipt_notes")
          .select("*", { count: "exact", head: true })

        if (countError) {
          console.error("Error checking goods_receipt_notes table:", countError)
          setError("The goods_receipt_notes table may not exist or you don't have access to it.")
          setLoading(false)
          return
        }

        console.log(`Found ${count} records in goods_receipt_notes table`)

        if (count === 0) {
          // No GRNs found, return empty array
          setGrns([])
          setLoading(false)
          return
        }

        // Fetch the GRN data
        const { data: grnData, error: grnError } = await supabase
          .from("goods_receipt_notes")
          .select("*")
          .order("created_at", { ascending: false })

        if (grnError) {
          console.error("Error fetching GRNs:", grnError)
          setError(grnError.message)
          setLoading(false)
          return
        }

        if (!grnData || grnData.length === 0) {
          setGrns([])
          setLoading(false)
          return
        }

        // Create a map of PO IDs to fetch vendor information
        const poIds = [...new Set(grnData.map((grn) => grn.po_id))]

        // Fetch purchase orders for these GRNs
        const { data: poData, error: poError } = await supabase
          .from("purchase_orders")
          .select("id, vendor_id, vendor_name, vendors(name)")
          .in("id", poIds)

        if (poError) {
          console.error("Error fetching purchase orders:", poError)
          // Continue with what we have
        }

        // Create a map of PO ID to vendor name
        const poVendorMap = new Map()
        if (poData) {
          poData.forEach((po) => {
            // Try to get vendor name from the relation first, then fallback to vendor_name field
            const vendorName = po.vendors?.name || po.vendor_name || "Unknown"
            poVendorMap.set(po.id, vendorName)
          })
        }

        // Map GRN data with vendor names
        const formattedGRNs = grnData.map((grn) => ({
          ...grn,
          vendor_name: poVendorMap.get(grn.po_id) || "Unknown",
        }))

        setGrns(formattedGRNs)
      } catch (error: any) {
        console.error("Exception in fetchGRNs:", error)
        setError(error.message || "Failed to load GRN data")
      } finally {
        setLoading(false)
      }
    }

    fetchGRNs()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Goods Receipt Notes</h1>
       {isAdmin && <Link href="/dashboard/grn/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create GRN
          </Button>
        </Link>}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={grns}
        searchColumn="po_id"
        searchPlaceholder="Search by PO number..."
        isLoading={loading}
        emptyMessage="No goods receipt notes found. Create your first GRN by clicking the 'Create GRN' button."
      />
    </div>
  )
}
