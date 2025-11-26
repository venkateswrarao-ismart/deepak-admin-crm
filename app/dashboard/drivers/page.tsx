"use client"

import { CardDescription } from "@/components/ui/card"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table"

interface Driver {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  vehicle_id: number | null
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchDrivers() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, vehicle_id")
          .eq("role", "driver")

        if (error) {
          console.error("Error fetching drivers:", error)
          return
        }

        setDrivers(data as Driver[])
      } catch (error) {
        console.error("Error fetching drivers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDrivers()
  }, [supabase])

  const columns = [
    {
      accessorKey: "full_name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "vehicle_id",
      header: "Vehicle ID",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const driver = row.original
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/drivers/${driver.id}/view`}>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Drivers</h1>
        <Link href="/dashboard/drivers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver List</CardTitle>
          <CardDescription>Manage your delivery drivers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading drivers...</div>
          ) : (
            <DataTable
              columns={columns}
              data={drivers}
              searchColumn="full_name"
              searchPlaceholder="Search drivers..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
