"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { CalendarPlus, ClipboardCheck, Search, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function CycleCountsPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCycleCount, setNewCycleCount] = useState({
    warehouseId: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
  })

  // Mock data for demonstration
  const cycleCounts = [
    {
      cycle_count_id: 1,
      warehouse_id: 1,
      warehouse_name: "Main Warehouse",
      start_date: "2023-05-15T09:00:00Z",
      end_date: "2023-05-15T17:00:00Z",
      status: "completed",
      created_by: "Admin User",
      created_at: "2023-05-10T10:30:00Z",
    },
    {
      cycle_count_id: 2,
      warehouse_id: 2,
      warehouse_name: "East Warehouse",
      start_date: "2023-05-20T09:00:00Z",
      end_date: null,
      status: "in-progress",
      created_by: "Admin User",
      created_at: "2023-05-15T14:45:00Z",
    },
    {
      cycle_count_id: 3,
      warehouse_id: 3,
      warehouse_name: "West Warehouse",
      start_date: "2023-05-25T09:00:00Z",
      end_date: null,
      status: "planned",
      created_by: "Admin User",
      created_at: "2023-05-18T09:15:00Z",
    },
    {
      cycle_count_id: 4,
      warehouse_id: 1,
      warehouse_name: "Main Warehouse",
      start_date: "2023-06-01T09:00:00Z",
      end_date: null,
      status: "planned",
      created_by: "Admin User",
      created_at: "2023-05-22T11:20:00Z",
    },
    {
      cycle_count_id: 5,
      warehouse_id: 2,
      warehouse_name: "East Warehouse",
      start_date: "2023-06-05T09:00:00Z",
      end_date: null,
      status: "planned",
      created_by: "Admin User",
      created_at: "2023-05-25T16:10:00Z",
    },
  ]

  const warehouses = [
    { id: "1", name: "Main Warehouse" },
    { id: "2", name: "East Warehouse" },
    { id: "3", name: "West Warehouse" },
  ]

  const handleCreateCycleCount = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setIsDialogOpen(false)
      alert("Cycle count scheduled successfully!")
    }, 1000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>
      case "in-progress":
        return <Badge variant="warning">In Progress</Badge>
      case "planned":
        return <Badge variant="secondary">Planned</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cycle Counts</h2>
          <p className="text-muted-foreground">Schedule and manage inventory cycle counts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <CalendarPlus className="h-4 w-4" />
                Schedule New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Cycle Count</DialogTitle>
                <DialogDescription>Create a new cycle count schedule for a specific warehouse</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="warehouse" className="text-right">
                    Warehouse
                  </Label>
                  <Select
                    value={newCycleCount.warehouseId}
                    onValueChange={(value) => setNewCycleCount({ ...newCycleCount, warehouseId: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start-date" className="text-right">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={newCycleCount.startDate}
                    onChange={(e) => setNewCycleCount({ ...newCycleCount, startDate: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCycleCount} disabled={loading}>
                  {loading ? "Scheduling..." : "Schedule Cycle Count"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cycle Count Schedules</CardTitle>
          <CardDescription>View and manage all cycle count activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search cycle counts..."
                className="pl-8 max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycleCounts.map((item) => (
                    <TableRow key={item.cycle_count_id}>
                      <TableCell className="font-medium">{item.cycle_count_id}</TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell>{new Date(item.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>{item.end_date ? new Date(item.end_date).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.created_by}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/inventory-reports/cycle-counts/${item.cycle_count_id}`}>
                            <ClipboardCheck className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
