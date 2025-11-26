"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, Package, AlertTriangle, Ban } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"

interface AgingStockTableProps {
  data: any[]
}

export function AgingStockTable({ data }: AgingStockTableProps) {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Never sold"
    return format(new Date(dateString), "MMM d, yyyy")
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="w-[100px]">Article ID</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Days Aging</TableHead>
            <TableHead className="text-right">Last Sale</TableHead>
            <TableHead className="text-right">Sales Qty</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {product.image_url ? (
                      <div className="relative h-8 w-8 rounded overflow-hidden border">
                        <Image
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <Package className="h-4 w-4" />
                      </div>
                    )}
                    <span className="truncate max-w-[200px]" title={product.name}>
                      {product.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{product.article_id || "N/A"}</TableCell>
                <TableCell>{product.category_name || "Uncategorized"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-medium">{product.ageDays}</span>
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatDate(product.lastSaleDate)}</TableCell>
                <TableCell className="text-right font-medium">{product.salesQuantity || 0}</TableCell>
                <TableCell className="text-right font-medium">{product.stock}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(product.inventoryValue)}</TableCell>
                <TableCell className="text-right">{getAgingStatus(product.ageDays)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                No products found for the selected period
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function getAgingStatus(ageDays: number) {
  // Using 15 days as the base period for aging calculations

  // If aging is more than 45 days (3x base period), it's critical
  if (ageDays > 45) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Ban className="h-3 w-3" />
        <span>Critical</span>
      </Badge>
    )
  }

  // If aging is more than 30 days (2x base period), it's concerning
  if (ageDays > 30) {
    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        <span>Concerning</span>
      </Badge>
    )
  }

  // If aging is more than 15 days (base period), it's moderate
  if (ageDays > 15) {
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>Moderate</span>
      </Badge>
    )
  }

  // If aging is 15 days or less, it's recent
  return (
    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
      <Clock className="h-3 w-3" />
      <span>Recent</span>
    </Badge>
  )
}
