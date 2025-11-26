"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, RefreshCw, FileText, Download } from "lucide-react"

export default function VarianceReportPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterWarehouse, setFilterWarehouse] = useState("all")
  const [selectedVariance, setSelectedVariance] = useState<any>(null)
  const [remarks, setRemarks] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Mock data for demonstration
  const varianceReports = [
    {
      variance_id: 1,
      article_id: "10001234",
      article_name: "Premium Cotton T-Shirt",
      warehouse_id: 1,
      warehouse_name: "Main Warehouse",
      system_qty: 120,
      physical_qty: 118,
      variance: -2,
      remarks: "Minor discrepancy, possibly due to returns processing",
      checked_by: "Admin User",
      report_date: "2023-05-15",
      cycle_count_id: 1,
    },
    {
      variance_id: 2,
      article_id: "10001235",
      article_name: "Slim Fit Jeans",
      warehouse_id: 2,
      warehouse_name: "East Warehouse",
      system_qty: 45,
      physical_qty: 40,
      variance: -5,
      remarks: "Significant variance, investigation needed",
      checked_by: "Admin User",
      report_date: "2023-05-20",
      cycle_count_id: 2,
    },
    {
      variance_id: 3,
      article_id: "10001236",
      article_name: "Leather Belt",
      warehouse_id: 1,
      warehouse_name: "Main Warehouse",
      system_qty: 30,
      physical_qty: 32,
      variance: 2,
      remarks: "Extra items found during count",
      checked_by: "Admin User",
      report_date: "2023-05-15",
      cycle_count_id: 1,
    },
    {
      variance_id: 4,
      article_id: "10001237",
      article_name: "Wool Sweater",
      warehouse_id: 3,
      warehouse_name: "West Warehouse",
      system_qty: 15,
      physical_qty: 10,
      variance: -5,
      remarks: null,
      checked_by: "Admin User",
      report_date: "2023-05-25",
      cycle_count_id: 3,
    },
    {
      variance_id: 5,
      article_id: "10001238",
      article_name: "Running Shoes",
      warehouse_id: 2,
      warehouse_name: "East Warehouse",
      system_qty: 60,
      physical_qty: 60,
      variance: 0,
      remarks: "No variance detected",
      checked_by: "Admin User",
      report_date: "2023-05-20",
      cycle_count_id: 2,
    },
  ]

  const warehouses = [
    { id: "all", name: "All Warehouses" },
    { id: "1", name: "Main Warehouse" },
    { id: "2", name: "East Warehouse" },
    { id: "3", name: "West Warehouse" },
  ]

  const handleExportReport = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      alert("Variance report exported successfully!")
    }, 1000)
  }

  const openRemarksDialog = (variance: any) => {
    setSelectedVariance(variance)
    setRemarks(variance.remarks || "")
    setIsDialogOpen(true)
  }

  const handleSaveRemarks = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setIsDialogOpen(false)
      alert("Remarks saved successfully!")
    }, 1000)
  }

  const getVarianceBadge = (variance: number) => {
    if (variance === 0) return <Badge variant="outline">No Variance</Badge>
    if (variance > 0) return <Badge variant="success">+{variance}</Badge>
    return <Badge variant="destructive">{variance}</Badge>
  }

  const filteredReports =
    filterWarehouse === "all"
      ? varianceReports
      : varianceReports.filter((report) => report.warehouse_id.toString() === filterWarehouse)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Variance Reports</h2>
          <p className="text-muted-foreground">Track and analyze inventory discrepancies</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Variances</TabsTrigger>
          <TabsTrigger value="positive">Positive Variances</TabsTrigger>
          <TabsTrigger value="negative">Negative Variances</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Inventory Variances</CardTitle>
                <CardDescription>View and manage discrepancies between system and physical counts</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1" onClick={handleExportReport}>
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search articles..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Warehouse" />
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

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article ID</TableHead>
                        <TableHead>Article Name</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>System Qty</TableHead>
                        <TableHead>Physical Qty</TableHead>
                        <TableHead>Variance</TableHead>
                        <TableHead>Report Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((item) => (
                        <TableRow key={item.variance_id}>
                          <TableCell className="font-medium">{item.article_id}</TableCell>
                          <TableCell>{item.article_name}</TableCell>
                          <TableCell>{item.warehouse_name}</TableCell>
                          <TableCell>{item.system_qty}</TableCell>
                          <TableCell>{item.physical_qty}</TableCell>
                          <TableCell>{getVarianceBadge(item.variance)}</TableCell>
                          <TableCell>{item.report_date}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openRemarksDialog(item)}>
                              <FileText className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="positive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Positive Variances</CardTitle>
              <CardDescription>Items where physical count exceeds system count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article ID</TableHead>
                      <TableHead>Article Name</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>System Qty</TableHead>
                      <TableHead>Physical Qty</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Report Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {varianceReports
                      .filter((item) => item.variance > 0)
                      .map((item) => (
                        <TableRow key={item.variance_id}>
                          <TableCell className="font-medium">{item.article_id}</TableCell>
                          <TableCell>{item.article_name}</TableCell>
                          <TableCell>{item.warehouse_name}</TableCell>
                          <TableCell>{item.system_qty}</TableCell>
                          <TableCell>{item.physical_qty}</TableCell>
                          <TableCell>{getVarianceBadge(item.variance)}</TableCell>
                          <TableCell>{item.report_date}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negative" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Negative Variances</CardTitle>
              <CardDescription>Items where system count exceeds physical count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article ID</TableHead>
                      <TableHead>Article Name</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>System Qty</TableHead>
                      <TableHead>Physical Qty</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Report Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {varianceReports
                      .filter((item) => item.variance < 0)
                      .map((item) => (
                        <TableRow key={item.variance_id}>
                          <TableCell className="font-medium">{item.article_id}</TableCell>
                          <TableCell>{item.article_name}</TableCell>
                          <TableCell>{item.warehouse_name}</TableCell>
                          <TableCell>{item.system_qty}</TableCell>
                          <TableCell>{item.physical_qty}</TableCell>
                          <TableCell>{getVarianceBadge(item.variance)}</TableCell>
                          <TableCell>{item.report_date}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Variance Remarks</DialogTitle>
            <DialogDescription>Add or update remarks for this inventory variance</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="article-id" className="text-right">
                Article
              </Label>
              <Input id="article-id" value={selectedVariance?.article_name || ""} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="variance" className="text-right">
                Variance
              </Label>
              <Input id="variance" value={selectedVariance?.variance || ""} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="remarks" className="text-right pt-2">
                Remarks
              </Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks about this variance..."
                className="col-span-3"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRemarks} disabled={loading}>
              {loading ? "Saving..." : "Save Remarks"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
