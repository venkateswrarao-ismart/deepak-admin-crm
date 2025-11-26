"use client"

import { useState } from "react"
import { Check, Download, FileSpreadsheet, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function VarianceReportPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItem, setSelectedItem] = useState(null)
  const [remarks, setRemarks] = useState("")
  const [varianceData, setVarianceData] = useState([
    {
      id: 1,
      articleId: "10005",
      articleName: "Product E",
      systemQty: 50,
      physicalQty: 45,
      variance: -5,
      remarks: "",
      status: "Open",
      date: "2023-04-05",
      warehouse: "Main Warehouse",
      checkedBy: "John Doe",
    },
    {
      id: 2,
      articleId: "10012",
      articleName: "Product F",
      systemQty: 25,
      physicalQty: 28,
      variance: 3,
      remarks: "Found additional items in receiving area",
      status: "Resolved",
      date: "2023-04-04",
      warehouse: "East Warehouse",
      checkedBy: "Jane Smith",
    },
    {
      id: 3,
      articleId: "10008",
      articleName: "Product H",
      systemQty: 100,
      physicalQty: 98,
      variance: -2,
      remarks: "",
      status: "Open",
      date: "2023-04-03",
      warehouse: "Main Warehouse",
      checkedBy: "Mike Johnson",
    },
    {
      id: 4,
      articleId: "10015",
      articleName: "Product I",
      systemQty: 75,
      physicalQty: 70,
      variance: -5,
      remarks: "Items damaged during handling",
      status: "Resolved",
      date: "2023-04-02",
      warehouse: "West Warehouse",
      checkedBy: "John Doe",
    },
    {
      id: 5,
      articleId: "10023",
      articleName: "Product J",
      systemQty: 30,
      physicalQty: 35,
      variance: 5,
      remarks: "",
      status: "Open",
      date: "2023-04-01",
      warehouse: "East Warehouse",
      checkedBy: "Jane Smith",
    },
  ])

  const filteredData = varianceData.filter(
    (item) =>
      item.articleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.articleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.warehouse.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addRemarks = () => {
    if (selectedItem && remarks) {
      const updatedData = varianceData.map((item) => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            remarks: remarks,
            status: "Resolved",
          }
        }
        return item
      })
      setVarianceData(updatedData)
      setSelectedItem(null)
      setRemarks("")
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Article ID",
      "Name",
      "System Qty",
      "Physical Qty",
      "Variance",
      "Remarks",
      "Status",
      "Date",
      "Warehouse",
      "Checked By",
    ]
    const csvData = filteredData.map((item) => [
      item.articleId,
      item.articleName,
      item.systemQty,
      item.physicalQty,
      item.variance,
      item.remarks,
      item.status,
      item.date,
      item.warehouse,
      item.checkedBy,
    ])

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Variance_Report_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by article ID or name..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              <SelectItem value="main">Main Warehouse</SelectItem>
              <SelectItem value="east">East Warehouse</SelectItem>
              <SelectItem value="west">West Warehouse</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Variances</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Variance Report</CardTitle>
              <CardDescription>Discrepancies between system and physical inventory counts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>System Qty</TableHead>
                    <TableHead>Physical Qty</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.articleId}</TableCell>
                      <TableCell>{item.articleName}</TableCell>
                      <TableCell>{item.systemQty}</TableCell>
                      <TableCell>{item.physicalQty}</TableCell>
                      <TableCell className={item.variance < 0 ? "text-red-600" : "text-green-600"}>
                        {item.variance > 0 ? `+${item.variance}` : item.variance}
                      </TableCell>
                      <TableCell>{item.warehouse}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            item.status === "Resolved"
                              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                              : "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20"
                          }`}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === "Open" ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                                Add Remarks
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Add Variance Remarks</DialogTitle>
                                <DialogDescription>
                                  Provide details about the variance for {selectedItem?.articleName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="variance" className="text-right">
                                    Variance
                                  </Label>
                                  <div
                                    className={`col-span-3 font-medium ${selectedItem?.variance < 0 ? "text-red-600" : "text-green-600"}`}
                                  >
                                    {selectedItem?.variance > 0 ? `+${selectedItem?.variance}` : selectedItem?.variance}
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                  <Label htmlFor="remarks" className="text-right pt-2">
                                    Remarks
                                  </Label>
                                  <Textarea
                                    id="remarks"
                                    placeholder="Enter explanation for the variance..."
                                    className="col-span-3"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                                  <X className="mr-2 h-4 w-4" />
                                  Cancel
                                </Button>
                                <Button onClick={addRemarks}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Resolve
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="open">
          <Card>
            <CardHeader>
              <CardTitle>Open Variances</CardTitle>
              <CardDescription>Unresolved inventory discrepancies that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>System Qty</TableHead>
                    <TableHead>Physical Qty</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData
                    .filter((item) => item.status === "Open")
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.articleId}</TableCell>
                        <TableCell>{item.articleName}</TableCell>
                        <TableCell>{item.systemQty}</TableCell>
                        <TableCell>{item.physicalQty}</TableCell>
                        <TableCell className={item.variance < 0 ? "text-red-600" : "text-green-600"}>
                          {item.variance > 0 ? `+${item.variance}` : item.variance}
                        </TableCell>
                        <TableCell>{item.warehouse}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                                Add Remarks
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Add Variance Remarks</DialogTitle>
                                <DialogDescription>
                                  Provide details about the variance for {selectedItem?.articleName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="variance" className="text-right">
                                    Variance
                                  </Label>
                                  <div
                                    className={`col-span-3 font-medium ${selectedItem?.variance < 0 ? "text-red-600" : "text-green-600"}`}
                                  >
                                    {selectedItem?.variance > 0 ? `+${selectedItem?.variance}` : selectedItem?.variance}
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                  <Label htmlFor="remarks" className="text-right pt-2">
                                    Remarks
                                  </Label>
                                  <Textarea
                                    id="remarks"
                                    placeholder="Enter explanation for the variance..."
                                    className="col-span-3"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                                  <X className="mr-2 h-4 w-4" />
                                  Cancel
                                </Button>
                                <Button onClick={addRemarks}>
                                  <Check className="mr-2 h-4 w-4" />
                                  Resolve
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="resolved">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Variances</CardTitle>
              <CardDescription>Inventory discrepancies that have been addressed</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>System Qty</TableHead>
                    <TableHead>Physical Qty</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData
                    .filter((item) => item.status === "Resolved")
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.articleId}</TableCell>
                        <TableCell>{item.articleName}</TableCell>
                        <TableCell>{item.systemQty}</TableCell>
                        <TableCell>{item.physicalQty}</TableCell>
                        <TableCell className={item.variance < 0 ? "text-red-600" : "text-green-600"}>
                          {item.variance > 0 ? `+${item.variance}` : item.variance}
                        </TableCell>
                        <TableCell>{item.remarks}</TableCell>
                        <TableCell>{item.warehouse}</TableCell>
                        <TableCell>{item.date}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
