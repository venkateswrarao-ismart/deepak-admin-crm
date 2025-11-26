"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Eye, Edit, Trash2 } from "lucide-react"
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

interface Vendor {
  id: string
  name: string
  contact_number: string | null
  email: string | null
  vendor_code: string | null
  is_active: boolean | null
  vendor_type: string | null
}

const columns: ColumnDef<Vendor>[] = [
  {
    accessorKey: "vendor_code",
    header: "Vendor Code",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "contact_number",
    header: "Contact",
    cell: ({ row }) => row.getValue("contact_number") || "-",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue("email") || "-",
  },
  {
    accessorKey: "vendor_type",
    header: "Vendor Type",
    cell: ({ row }) => row.getValue("vendor_type") || "-",
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active")
      return <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const vendor = row.original
      return (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/vendors/view/${vendor.id}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
          </Link>
          <Link href={`/dashboard/vendors/${vendor.id}`}>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-100 flex items-center gap-1"
            onClick={(e) => {
              e.preventDefault()
              setVendorToDelete(vendor)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      )
    },
  },
]

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null)

  useEffect(() => {
    async function fetchVendors() {
      try {
        const supabase = createSupabaseClient()
        const { data } = await supabase.from("vendors").select("*").order("name")
        setVendors(data || [])
      } catch (error) {
        console.error("Error fetching vendors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])

  async function deleteVendor(id: string) {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from("vendors").delete().eq("id", id)

      if (error) {
        throw error
      }

      // Remove the vendor from the state
      setVendors(vendors.filter((vendor) => vendor.id !== id))
      toast({
        title: "Vendor deleted",
        description: "The vendor has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting vendor:", error)
      toast({
        title: "Error",
        description: "Failed to delete the vendor. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vendors</h1>
        <Link href="/dashboard/vendors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading vendors...</div>
      ) : (
        <DataTable columns={columns} data={vendors} searchColumn="name" searchPlaceholder="Search vendors..." />
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vendor "
              {vendorToDelete?.name || "Unnamed Vendor"}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (vendorToDelete) {
                  deleteVendor(vendorToDelete.id)
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
