"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

interface ShopOwnerRegistration {
  id: string
  user_id: string
  merchant_segment: string
  merchant_sub_segment: string | null
  shop_name: string
  shop_display_name: string | null
  shop_phone: string
  shop_email: string | null
  shop_website: string | null
  shop_gstin: string | null
  owner_name: string
  owner_phone: string | null
  owner_email: string | null
  sales_officer_id: string | null
  rejection_reason: string | null
  submitted_at: string
  approved_at: string | null
  approved_by: string | null
  status: "pending" | "under_review" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Pending
        </Badge>
      )
    case "under_review":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Under Review
        </Badge>
      )
    case "approved":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Approved
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Rejected
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function ShopOwnersPage() {
  const [registrations, setRegistrations] = useState<ShopOwnerRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [salesOfficers, setSalesOfficers] = useState<Record<string, string>>({})

  const columns: ColumnDef<ShopOwnerRegistration>[] = [
    {
      accessorKey: "shop_name",
      header: "Shop Name",
    },
    {
      accessorKey: "owner_name",
      header: "Owner Name",
    },
    {
      accessorKey: "merchant_segment",
      header: "Segment",
    },
    {
      accessorKey: "shop_phone",
      header: "Contact",
    },
    {
      accessorKey: "sales_officer_id",
      header: "Sales Officer",
      cell: ({ row }) => {
        const salesOfficerId = row.getValue("sales_officer_id") as string | null
        return salesOfficerId ? salesOfficers[salesOfficerId] || "Unknown" : "Not Assigned"
      },
    },
    {
      accessorKey: "submitted_at",
      header: "Submitted On",
      cell: ({ row }) => {
        const date = new Date(row.getValue("submitted_at"))
        return date.toLocaleDateString()
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const registration = row.original
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/shop-owners/${registration.id}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                Review
              </Button>
            </Link>
          </div>
        )
      },
    },
  ]

  useEffect(() => {
    async function fetchRegistrations() {
      try {
        const supabase = createSupabaseClient()

        // Fetch shop owner registrations
        const { data, error } = await supabase
          .from("shop_owner_registrations")
          .select("*")
          .order("submitted_at", { ascending: false })

        if (error) throw error

        // Fetch sales officers
        const { data: officers } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", data?.filter((r) => r.sales_officer_id).map((r) => r.sales_officer_id) || [])

        // Create a map of sales officer IDs to names
        const officersMap: Record<string, string> = {}
        officers?.forEach((officer) => {
          officersMap[officer.id] = officer.full_name || "Unknown"
        })

        setSalesOfficers(officersMap)
        setRegistrations(data || [])
      } catch (error) {
        console.error("Error fetching shop owner registrations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shop Owner Registrations</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-700 font-medium">Pending</div>
          <div className="text-2xl font-bold">{registrations.filter((r) => r.status === "pending").length}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-700 font-medium">Under Review</div>
          <div className="text-2xl font-bold">{registrations.filter((r) => r.status === "under_review").length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-700 font-medium">Approved</div>
          <div className="text-2xl font-bold">{registrations.filter((r) => r.status === "approved").length}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-700 font-medium">Rejected</div>
          <div className="text-2xl font-bold">{registrations.filter((r) => r.status === "rejected").length}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading registrations...</div>
      ) : (
        <DataTable
          columns={columns}
          data={registrations}
          searchColumn="shop_name"
          searchPlaceholder="Search by shop name..."
        />
      )}
    </div>
  )
}
