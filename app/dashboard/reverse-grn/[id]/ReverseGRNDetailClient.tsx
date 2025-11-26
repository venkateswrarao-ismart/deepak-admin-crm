"use client"

import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ReverseGRNItem {
  id: string
  productId: string
  productName: string
  receivedQuantity: number
  returnQuantity: number
  unitPrice: number
  reason: string
}

interface ReverseGRNDetailClientProps {
  reverseGRN: any
  items: ReverseGRNItem[]
  vendorName: string
  vendorAddress: string
  vendorContact: string
  totalValue: number
  totalQuantity: number
}

export default function ReverseGRNDetailClient({
  reverseGRN,
  items,
  vendorName,
  vendorAddress,
  vendorContact,
  totalValue,
  totalQuantity,
}: ReverseGRNDetailClientProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/reverse-grn">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Return #{reverseGRN.id}</h1>
            <p className="text-muted-foreground">View details of this product return</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Return #{reverseGRN.id}</DialogTitle>
                <DialogDescription>Preview the return document before printing</DialogDescription>
              </DialogHeader>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => {
                    const printContent = document.getElementById("print-content")
                    const originalContents = document.body.innerHTML

                    if (printContent) {
                      document.body.innerHTML = printContent.innerHTML
                      window.print()
                      document.body.innerHTML = originalContents
                      // Re-render the component after printing
                      window.location.reload()
                    }
                  }}
                >
                  <Printer className="h-4 w-4" /> Print
                </Button>
              </div>

              <div
                id="print-content"
                className="p-3 bg-white text-base print:text-[12px] max-w-[210mm] mx-auto"
                style={{ lineHeight: 1.4 }}
              >
                <div className="flex border-b border-black p-1 mb-3">
                  <img
                    src="/ismart2-logo.png"
                    alt="Company Logo"
                    className="h-16 print:h-12 object-contain object-left mr-2"
                  />
                  <div className="flex flex-col gap-0.5 text-[12px] print:text-[10px]">
                    <div className="font-bold">ISMART SYSTEMS LLP</div>
                    <div>
                      <div className="font-semibold inline pr-1">Corporate Address:</div>
                      PLOT No.7, Y S RAO TOWERS, KAVURI HILLS (PHASE-1) MADHAPUR, HYDERABAD, Telangana - 500081
                    </div>
                    <div>
                      <div className="font-semibold inline pr-1">Warehouse Address:</div>
                      D.NO.12-44/4/A/1 SATHAMRAI, SHAMSHABAD, HYDERABAD, Telangana - 501218
                    </div>
                    <div>
                      <div className="font-semibold inline pr-1">GST:</div>
                      <div className="inline font-semibold">36AAJFI6467N1ZM</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mb-3">
                  <div className="text-[12px] print:text-[10px]">
                    <h2 className="font-bold">Product Return</h2>
                    <p>Return #: {reverseGRN.id}</p>
                    <p>Date: {formatDate(reverseGRN.return_date)}</p>
                    <p>GRN Ref: {reverseGRN.grn_id}</p>
                  </div>
                  <div className="text-[12px] print:text-[10px]">
                    <h2 className="font-bold">Vendor Details:</h2>
                    <p className="font-semibold">{vendorName}</p>
                    <p>{vendorAddress}</p>
                    <p>Phone: {vendorContact}</p>
                  </div>
                </div>

                <table className="w-full border-collapse mb-3 text-[11px] print:text-[10px] border border-black">
                  <thead>
                    <tr>
                      <th className="border border-black p-0.5 text-left">Sl No.</th>
                      <th className="border border-black p-0.5 text-left">Product</th>
                      <th className="border border-black p-0.5 text-center">Received Qty</th>
                      <th className="border border-black p-0.5 text-right">Return Qty</th>
                      <th className="border border-black p-0.5 text-right">Unit Price</th>
                      <th className="border border-black p-0.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="border-l border-r border-black p-0.5 text-center">{index + 1}</td>
                        <td className="border-l border-r border-black p-0.5 text-left font-medium">
                          {item.productName}
                        </td>
                        <td className="border-l border-r border-black p-0.5 text-center">{item.receivedQuantity}</td>
                        <td className="border-l border-r border-black p-0.5 text-right">{item.returnQuantity}</td>
                        <td className="border-l border-r border-black p-0.5 text-right">
                          ₹{item.unitPrice.toLocaleString()}
                        </td>
                        <td className="border-l border-r border-black p-0.5 text-right">
                          ₹{(item.returnQuantity * item.unitPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="border-l border-r border-t border-black p-0.5 text-right font-medium">
                        Total Items: {items.length}
                      </td>
                      <td className="border-l border-r border-t border-black p-0.5 text-right">{totalQuantity}</td>
                      <td className="border-l border-r border-t border-black p-0.5 text-right font-bold">Total:</td>
                      <td className="border-l border-r border-t border-black p-0.5 text-right font-bold">
                        ₹{totalValue.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="text-[11px] print:text-[10px]">
                  <p>
                    <strong>Return Reason:</strong> {reverseGRN.reason}
                  </p>
                  {reverseGRN.notes && (
                    <p>
                      <strong>Notes:</strong> {reverseGRN.notes}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-between text-[12px] print:text-[10px]">
                  <div>
                    <p className="font-bold">Authorized Signature</p>
                    <div className="mt-4 border-t border-black w-24"></div>
                  </div>
                  <div>
                    <p className="font-bold">Vendor Signature</p>
                    <div className="mt-4 border-t border-black w-24"></div>
                  </div>
                </div>

                <div className="mt-4 text-center text-[11px] print:text-[10px] text-gray-500">
                  <p>This is a computer generated document. No signature required.</p>
                  <p>Printed on: {new Date().toLocaleString()}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {/*<Button size="sm" asChild>
              <Link href={`/dashboard/reverse-grn/${params.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>*/}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Return Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Return ID</dt>
                <dd className="text-base">{reverseGRN.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">GRN Reference</dt>
                <dd className="text-base">{reverseGRN.grn_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Return Date</dt>
                <dd className="text-base">{formatDate(reverseGRN.return_date)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd className="text-base">
                  <Badge
                    variant={
                      reverseGRN.status === "Completed"
                        ? "success"
                        : reverseGRN.status === "Processing"
                          ? "default"
                          : "outline"
                    }
                  >
                    {reverseGRN.status}
                  </Badge>
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">Return Reason</dt>
                <dd className="text-base">{reverseGRN.reason}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                <dd className="text-base">{reverseGRN.notes || "N/A"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Vendor Name</dt>
                <dd className="text-base">{vendorName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                <dd className="text-base">{vendorAddress}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Contact</dt>
                <dd className="text-base">{vendorContact}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Returned Items</CardTitle>
          <CardDescription>Items being returned to the vendor</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">No items found for this return</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Received Qty</TableHead>
                  <TableHead>Return Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.receivedQuantity}</TableCell>
                    <TableCell>{item.returnQuantity}</TableCell>
                    <TableCell>₹{item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      ₹{(item.returnQuantity * item.unitPrice).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Total Items: {items.length} (Qty: {totalQuantity})
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">Total Value: ₹{totalValue.toLocaleString()}</p>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Return History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <div>
                <p className="font-medium">Return Created</p>
                <p className="text-sm text-muted-foreground">Initial return request submitted</p>
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(reverseGRN.created_at)}</p>
            </div>
            {reverseGRN.created_at !== reverseGRN.updated_at && (
              <div className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-medium">Status Updated</p>
                  <p className="text-sm text-muted-foreground">Status changed to {reverseGRN.status}</p>
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(reverseGRN.updated_at)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
