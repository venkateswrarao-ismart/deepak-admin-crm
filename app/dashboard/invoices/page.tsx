"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

interface Invoice {
  id: string
  po_id: string
  vendor_id: string
  vendor_name: string
  invoice_number: string
  invoice_date: string
  total_amount: number
  status: string
  payment_date: string | null
}

const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoice_number",
    header: "Invoice #",
  },
  {
    accessorKey: "po_id",
    header: "PO Number",
  },
  {
    accessorKey: "vendor_name",
    header: "Vendor",
  },
  {
    accessorKey: "invoice_date",
    header: "Invoice Date",
    cell: ({ row }) => {
      const date = row.getValue("invoice_date") as string
      return date ? new Date(date).toLocaleDateString() : "-"
    },
  },
  {
    accessorKey: "total_amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("total_amount") as number
      return `₹${amount.toFixed(2)}`
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "Paid"
              ? "default"
              : status === "Disputed"
                ? "destructive"
                : status === "Verified"
                  ? "outline"
                  : "secondary"
          }
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "payment_date",
    header: "Payment Date",
    cell: ({ row }) => {
      const date = row.getValue("payment_date") as string
      return date ? new Date(date).toLocaleDateString() : "-"
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const invoice = row.original
      return (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/invoices/${invoice.id}`}>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              View
            </Button>
          </Link>
        </div>
      )
    },
  },
]

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const supabase = createSupabaseClient()
        const { data } = await supabase
          .from("vendor_invoices")
          .select(`
            *,
            vendors:vendor_id (name)
          `)
          .order("invoice_date", { ascending: false })

        if (data) {
          const formattedInvoices = data.map((invoice) => ({
            ...invoice,
            vendor_name: invoice.vendors?.name || "Unknown",
          }))
          setInvoices(formattedInvoices)
        }
      } catch (error) {
        console.error("Error fetching invoices:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vendor Invoices</h1>
        <Link href="/dashboard/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Invoice
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading invoices...</div>
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          searchColumn="invoice_number"
          searchPlaceholder="Search by invoice number..."
        />
      )}
    </div>
  )
}
