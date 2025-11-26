"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PurchaseOrder {
  id: string
  vendor_name: string | null
  vendor_id: string
  po_status: string | null
  inbound_status: string | null
  payment_terms: string
  created_at: string | null
}

interface Appointment {
  id: string
  po_id: string
  appointment_date: string
  expected_arrival_time: string
  status: string
  vendor_name: string
}

const poColumns: ColumnDef<PurchaseOrder>[] = [
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
    accessorKey: "po_status",
    header: "PO Status",
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
    accessorKey: "inbound_status",
    header: "Inbound Status",
    cell: ({ row }) => {
      const status = row.getValue("inbound_status") as string
      return (
        <Badge
          variant={
            status === "Delivered"
              ? "default"
              : status === "Cancelled"
                ? "destructive"
                : status === "Dispatched"
                  ? "outline"
                  : "secondary"
          }
        >
          {status || "Created"}
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
      const po = row.original
      return (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/inbound/${po.id}`}>
            <Button variant="ghost" size="sm">
              Manage
            </Button>
          </Link>
        </div>
      )
    },
  },
]

const appointmentColumns: ColumnDef<Appointment>[] = [
  {
    accessorKey: "po_id",
    header: "PO Number",
  },
  {
    accessorKey: "vendor_name",
    header: "Vendor",
  },
  {
    accessorKey: "appointment_date",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("appointment_date") as string
      return date ? new Date(date).toLocaleDateString() : "-"
    },
  },
  {
    accessorKey: "expected_arrival_time",
    header: "Expected Arrival",
    cell: ({ row }) => {
      const time = row.getValue("expected_arrival_time") as string
      return time ? new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"
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
            status === "Completed"
              ? "default"
              : status === "Cancelled"
                ? "destructive"
                : status === "Arrived"
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
    id: "actions",
    cell: ({ row }) => {
      const appointment = row.original
      return (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/inbound/appointments/${appointment.id}`}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
        </div>
      )
    },
  },
]

export default function InboundPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pos")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const supabase = createSupabaseClient()

        // Fetch POs
        const { data: poData } = await supabase
          .from("purchase_orders")
          .select("*, vendors(name)")
          .order("created_at", { ascending: false })

        if (poData) {
          const formattedPOs = poData.map((po) => ({
            ...po,
            vendor_name: po.vendors?.name,
          }))
          setPurchaseOrders(formattedPOs)
        }

        // Fetch appointments
        const { data: appointmentData } = await supabase
          .from("inbound_appointments")
          .select("*, purchase_orders(vendor_id, vendors(name))")
          .order("appointment_date", { ascending: false })

        if (appointmentData) {
          const formattedAppointments = appointmentData.map((app) => ({
            ...app,
            vendor_name: app.purchase_orders?.vendors?.name || "Unknown",
          }))
          setAppointments(formattedAppointments)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inbound Management</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/inbound/appointments/new">
            <Button variant="outline" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Schedule Appointment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchaseOrders.filter((po) => po.inbound_status === "Dispatched").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                appointments.filter((app) => {
                  const today = new Date().toDateString()
                  const appDate = new Date(app.appointment_date).toDateString()
                  return appDate === today && app.status !== "Cancelled"
                }).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchaseOrders.filter((po) => po.inbound_status === "Delivered").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pos" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
          <TabsTrigger value="appointments">Scheduled Appointments</TabsTrigger>
        </TabsList>
        <TabsContent value="pos" className="mt-4">
          {loading ? (
            <div className="text-center py-4">Loading purchase orders...</div>
          ) : (
            <DataTable
              columns={poColumns}
              data={purchaseOrders}
              searchColumn="id"
              searchPlaceholder="Search by PO number..."
            />
          )}
        </TabsContent>
        <TabsContent value="appointments" className="mt-4">
          {loading ? (
            <div className="text-center py-4">Loading appointments...</div>
          ) : (
            <DataTable
              columns={appointmentColumns}
              data={appointments}
              searchColumn="po_id"
              searchPlaceholder="Search by PO number..."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
