"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, TrendingUp, AlertTriangle, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface FastMovingProductsTableProps {
  data: any[]
}

export function FastMovingProductsTable({ data }: FastMovingProductsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="w-[100px]">Article ID</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Quantity Sold</TableHead>
            <TableHead className="text-right">Total Sales</TableHead>
            <TableHead className="text-right">Current Stock</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/products/${product.id}`} className="flex items-center gap-2 hover:underline">
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
                  </Link>
                </TableCell>
                <TableCell>{product.article_id || "N/A"}</TableCell>
                <TableCell>{product.category_name || "Uncategorized"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-medium">{product.totalQuantity}</span>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">₹{product.totalSales.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className={product.stock < product.totalQuantity / 2 ? "text-red-500 font-medium" : ""}>
                      {product.stock}
                    </span>
                    {product.stock < product.totalQuantity / 2 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                </TableCell>
                <TableCell className="text-right">{getStockStatus(product.stock, product.totalQuantity)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                No products found for the selected period
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function getStockStatus(currentStock: number, soldQuantity: number) {
  // If stock is less than 25% of what was sold, it's critical
  if (currentStock < soldQuantity * 0.25) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        <span>Critical</span>
      </Badge>
    )
  }

  // If stock is less than 50% of what was sold, it's low
  if (currentStock < soldQuantity * 0.5) {
    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        <span>Low</span>
      </Badge>
    )
  }

  // Otherwise, it's adequate
  return (
    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
      <ArrowUpRight className="h-3 w-3" />
      <span>Adequate</span>
    </Badge>
  )
}
