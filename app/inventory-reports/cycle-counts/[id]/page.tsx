"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import { ArrowLeft, Save, Download, ClipboardCheck, Search } from "lucide-react"
import Link from "next/link"

export default function CycleCountDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)

  // Mock data for demonstration
  const cycleCount = {
    cycle_count_id: Number.parseInt(params.id),
    warehouse_id: 1,
    warehouse_name: "Main Warehouse",
    start_date: "2023-05-15T09:00:00Z",
    end_date: null,
    status: "in-progress",
    created_by: "Admin User",
    created_at: "2023-05-10T10:30:00Z",
  }

  const cycleCountItems = [
    {
      count_item_id: 1,
      cycle_count_id: Number.parseInt(params.id),
      article_id: "10001234",
      article_name: "Premium Cotton T-Shirt",
      expected_quantity: 120,
      counted_quantity: 118,
      variance: -2,
      remarks: null,
      counted_by: null,
    },
    {
      count_item_id: 2,
      cycle_count_id: Number.parseInt(params.id),
      article_id: "10001235",
      article_name: "Slim Fit Jeans",
      expected_quantity: 45,
      counted_quantity: null,
      variance: null,
      remarks: null,
      counted_by: null,
    },
    {
      count_item_id: 3,
      cycle_count_id: Number.parseInt(params.id),
      article_id: "10001236",
      article_name: "Leather Belt",
      expected_quantity: 30,
      counted_quantity: 32,
      variance: 2,
      remarks: "Extra items found during count",
      counted_by: "Admin User",
    },
    {
      count_item_id: 4,
      cycle_count_id: Number.parseInt(params.id),
      article_id: "10001237",
      article_name: "Wool Sweater",
      expected_quantity: 15,
      counted_quantity: null,
      variance: null,
      remarks: null,
      counted_by: null,
    },
    {
      count_item_id: 5,
      cycle_count_id: Number.parseInt(params.id),
      article_id: "10001238",
      article_name: "Running Shoes",
      expected_quantity: 60,
      counted_quantity: null,
      variance: null,
      remarks: null,
      counted_by: null,
    },
  ]

  const handleCompleteCycleCount = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setIsCompleteDialogOpen(false)
      alert("Cycle count completed successfully!")
    }, 1000)
  }

  const handleExportReport = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      alert("Cycle count report exported successfully!")
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

  const getVarianceBadge = (variance: number | null) => {
    if (variance === null) return <Badge variant="outline">Not Counted</Badge>
    if (variance === 0) return <Badge variant="outline">No Variance</Badge>
    if (variance > 0) return <Badge variant="success">+{variance}</Badge>
    return <Badge variant="destructive">{variance}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/inventory-reports/cycle-counts">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Cycle Count #{cycleCount.cycle_count_id}</h2>
            <p className="text-muted-foreground">
              {cycleCount.warehouse_name} - {new Date(cycleCount.start_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={handleExportReport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          {cycleCount.status !== "completed" && (
            <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <ClipboardCheck className="h-4 w-4" />
                  Complete Count
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Cycle Count</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to mark this cycle count as completed? This will generate variance reports for
                    all counted items.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCompleteCycleCount} disabled={loading}>
                    {loading ? "Processing..." : "Complete Cycle Count"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cycle Count Details</CardTitle>
              <CardDescription>Status: {getStatusBadge(cycleCount.status)}</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Created by: {cycleCount.created_by} on {new Date(cycleCount.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                className="pl-8 max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article ID</TableHead>
                    <TableHead>Article Name</TableHead>
                    <TableHead>Expected Qty</TableHead>
                    <TableHead>Counted Qty</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Counted By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycleCountItems.map((item) => (
                    <TableRow key={item.count_item_id}>
                      <TableCell className="font-medium">{item.article_id}</TableCell>
                      <TableCell>{item.article_name}</TableCell>
                      <TableCell>{item.expected_quantity}</TableCell>
                      <TableCell>
                        {item.counted_quantity !== null ? (
                          item.counted_quantity
                        ) : (
                          <Input type="number" placeholder="Enter count" className="w-24" min="0" />
                        )}
                      </TableCell>
                      <TableCell>{getVarianceBadge(item.variance)}</TableCell>
                      <TableCell>{item.remarks || "-"}</TableCell>
                      <TableCell>{item.counted_by || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {cycleCountItems.filter((item) => item.counted_quantity !== null).length} of {cycleCountItems.length} items
            counted
          </div>
          <Button disabled={cycleCount.status === "completed"}>
            <Save className="h-4 w-4 mr-2" />
            Save Counts
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
