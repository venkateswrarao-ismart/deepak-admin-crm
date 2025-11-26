"use client"
import Link from "next/link"
import { Plus, MoreHorizontal, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

type ReverseGRN = {
  id: string
  grnId: string
  vendorName: string
  returnDate: string
  status: string
  totalItems: number
  totalValue: number
  reason: string
}

export default function ReverseGRNClient({ reverseGRNs: initialData }: { reverseGRNs: ReverseGRN[] }) {
  const [reverseGRNs, setReverseGRNs] = useState<ReverseGRN[]>(initialData)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()

  // Function to get user ID directly from localStorage
  const getUserIdFromLocalStorage = () => {
    if (typeof window === "undefined") return null

    // Find the Supabase auth token key (it starts with 'sb-')
    const supabaseKey = Object.keys(localStorage).find((key) => key.startsWith("sb-") && key.endsWith("-auth-token"))

    if (!supabaseKey) return null

    try {
      const authData = JSON.parse(localStorage.getItem(supabaseKey) || "{}")
      return authData?.user?.id || null
    } catch (error) {
      console.error("Error parsing auth data from localStorage:", error)
      return null
    }
  }

  // Function to update status in the UI and database
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      // Get user ID directly from localStorage
      const userId = getUserIdFromLocalStorage()

      console.log("User ID from localStorage:", userId)

      if (!userId) {
        console.warn("No user ID found in localStorage, proceeding anyway")
        // Continue without user ID - we'll just not update the updated_by field
      }

      // Get the current status before updating
      const currentRGRN = reverseGRNs.find((rgrn) => rgrn.id === id)
      const previousStatus = currentRGRN?.status || "Pending"

      // Optimistically update the UI
      setReverseGRNs(
        reverseGRNs.map((rgrn) => {
          if (rgrn.id === id) {
            return { ...rgrn, status: newStatus }
          }
          return rgrn
        }),
      )

      // Fetch the reverse GRN items to know which products to update
      const { data: reverseGRNItems, error: itemsError } = await supabase
        .from("reverse_grn_items")
        .select(`
          id,
          article_id,
          returned_quantity,
          unit_price
        `)
        .eq("reverse_grn_id", id)

      if (itemsError) {
        console.error("Error fetching reverse GRN items:", itemsError)
        toast({
          variant: "destructive",
          title: "Error fetching items",
          description: itemsError.message,
        })
        return
      }

      console.log("Reverse GRN items:", reverseGRNItems)

      // Update the reverse GRN status
      const { error: statusError } = await supabase.from("reverse_grn").update({ status: newStatus }).eq("id", id)

      if (statusError) {
        setReverseGRNs(initialData)
        toast({
          variant: "destructive",
          title: "Error updating status",
          description: statusError.message,
        })
        console.error("Error updating reverse GRN status:", statusError)
        return
      }

      // Update product stock based on status change
      for (const item of reverseGRNItems || []) {
        // Get the current product
        const { data: products, error: productError } = await supabase
          .from("products")
          .select("id, stock")
          .eq("article_id", item.article_id)
          .limit(1)

        if (productError || !products || products.length === 0) {
          console.error("Error fetching product:", productError)
          continue
        }

        const product = products[0]
        let newStock = product.stock

        // If changing to Completed, reduce stock
        if (newStatus === "Completed" && previousStatus !== "Completed") {
          newStock = product.stock - item.returned_quantity
        }
        // If changing from Completed to Pending, restore stock
        else if (newStatus === "Pending" && previousStatus === "Completed") {
          newStock = product.stock + item.returned_quantity
        }

        console.log(`Updating product ${product.id} stock from ${product.stock} to ${newStock}`)

        // Update the product stock
        const updateData: any = { stock: newStock }

        // Only add updated_by if we have a userId
        if (userId) {
          updateData.updated_by = userId
        }

        const { error: stockError } = await supabase.from("products").update(updateData).eq("id", product.id)

        if (stockError) {
          console.error("Error updating product stock:", stockError)
        }
      }

      toast({
        title: "Status updated",
        description: `Return #${id} status changed to ${newStatus}`,
      })

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "An unexpected error occurred",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reverse GRN (Returns)</h1>
          <p className="text-muted-foreground">Manage returns and corrections to received goods</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/reverse-grn/new">
            <Plus className="mr-2 h-4 w-4" />
            New Return
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Returns List</CardTitle>
          <CardDescription>View and manage all product returns</CardDescription>
        </CardHeader>
        <CardContent>
          {reverseGRNs.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No reverse GRN records found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>GRN Reference</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reverseGRNs.map((rgrn) => (
                  <TableRow key={rgrn.id}>
                    <TableCell className="font-medium">{rgrn.id}</TableCell>
                    <TableCell>{rgrn.grnId}</TableCell>
                    <TableCell>{rgrn.vendorName}</TableCell>
                    <TableCell>{rgrn.returnDate}</TableCell>
                    <TableCell>
                      <Badge variant={rgrn.status === "Completed" ? "success" : "outline"}>{rgrn.status}</Badge>
                    </TableCell>
                    <TableCell>{rgrn.totalItems}</TableCell>
                    <TableCell>₹{rgrn.totalValue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/reverse-grn/${rgrn.id}`}>View</Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateStatus(rgrn.id, "Pending")} className="cursor-pointer">
                              <span
                                className={
                                  rgrn.status === "Pending" ? "font-bold flex items-center" : "flex items-center"
                                }
                              >
                                {rgrn.status === "Pending" && <Check className="mr-2 h-4 w-4" />}
                                Pending
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatus(rgrn.id, "Completed")}
                              className="cursor-pointer"
                            >
                              <span
                                className={
                                  rgrn.status === "Completed" ? "font-bold flex items-center" : "flex items-center"
                                }
                              >
                                {rgrn.status === "Completed" && <Check className="mr-2 h-4 w-4" />}
                                Completed
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
