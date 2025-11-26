"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { StockItem } from "./page"

// Client component for interactivity
export function SOHReportClient({ initialStockData }: { initialStockData: StockItem[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")

  // Get unique categories and locations for filters
  const categories = Array.from(new Set(initialStockData.map((item) => item.category)))
  const locations = Array.from(new Set(initialStockData.map((item) => item.location.split(" - ")[0])))

  // Filter the data based on search term and filters
  const filteredData = initialStockData.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.article_id && item.article_id.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter

    const matchesLocation =
      locationFilter === "all" || item.location.toLowerCase().includes(locationFilter.toLowerCase())

    return matchesSearch && matchesCategory && matchesLocation
  })

  // Export function
  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Article ID", "Name", "Opening Qty", "Current Qty", "Location", "Reorder Level", "Status"]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((item) =>
        [
          item.article_id,
          `"${item.name}"`, // Quote names to handle commas
          item.openingQuantity,
          item.quantity,
          `"${item.location}"`,
          item.reorderLevel,
          item.status,
        ].join(","),
      ),
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `stock_on_hand_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
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
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
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

      <Card>
        <CardHeader>
          <CardTitle>Stock On Hand Report</CardTitle>
          <CardDescription>
            Current inventory levels for all items as of {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Opening Qty</TableHead>
                <TableHead>Current Qty</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reorder Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.article_id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.openingQuantity}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.reorderLevel}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          item.status === "In Stock"
                            ? "bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20"
                            : item.status === "Low Stock"
                              ? "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20"
                              : "bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/10"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No stock items found matching your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
