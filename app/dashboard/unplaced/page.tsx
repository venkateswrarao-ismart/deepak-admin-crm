"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { formatDate } from "@/lib/utils"

export default function Unplaced() {
  const [cartData, setCartData] = useState<any>([])

  async function getCarts() {
    const supabase = createClient()
  
    const { data: carts, error } = await supabase
      .from("carts")
      .select(
        `
        id,
        user_id,
        created_at,
        profiles:user_id(full_name, phone),
        cart_items(count)
      `
      )
      .order("created_at", { ascending: false })
  
    if (error) {
      console.error("Error fetching carts:", error)
      return []
    }
  
    if (carts) {
      // Filter carts where cart_items[0].count > 0
      const filtered = carts.filter(
        (cart) => cart.cart_items?.[0]?.count > 0
      )
  
      const formatted = filtered.map((cart) => ({
        ...cart,
        customer_name: cart.profiles?.full_name || "",
      }))
  
      setCartData(formatted)
    }
  
    return []
  }

  useEffect(() => {
    getCarts()
  }, [])

  const columns = [
    {
      accessorKey: "id",
      header: "Cart ID",
      cell: ({ row }) => {
        const id = row.getValue("id") as string
        const shortId = id ? id.slice(0, 8) : "—"
        return (
          <div className="font-mono text-sm bg-muted px-2 py-1 rounded-md w-fit">
            {shortId}
          </div>
        )
      },
    },
    {
      accessorKey: "customer_name", // use flattened field
      header: "Customer Name",
      cell: ({ row }) => {
        const fullName = row.getValue("customer_name") as string
        return fullName ? fullName.split(" ")[0] : "—"
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        try {
          return formatDate(row.getValue("created_at"))
        } catch {
          return "—"
        }
      },
    },
    {
      accessorKey: "view",
      header: "View",
      cell: ({ row }) => (
        <Link href={`/dashboard/unplaced/view/${row.original.id}`}>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            View
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Unplaced Orders</h1>
      </div>

      <Card>
        <CardHeader className="p-2">
          <CardTitle></CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <DataTable
            columns={columns}
            data={cartData}
            searchColumn="customer_name" // now searching works!
            searchPlaceholder="Search by customer name..."
          />
        </CardContent>
      </Card>
    </div>
  )
}
