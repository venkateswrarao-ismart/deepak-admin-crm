"use client"

import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { formatDate } from "@/lib/utils"
import { useEffect, useState } from "react"

interface CartViewPageProps {
  params: {
    id: string
  }
}

// Utility to format number into currency
function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`
}

export default function CartViewPage({ params }: CartViewPageProps) {
  const [cartItemss, setCartItems] = useState<any>([])

  async function getCartWithItems(cartId: string) {
    const supabase = createClientComponentClient()

    // Fetch the cart with customer info
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select(`
        id,
        created_at,
        user_id,
        profiles ( full_name, phone )
      `)
      .eq("id", cartId)
      .single()

    if (cartError || !cart) {
      console.error("Error fetching cart:", cartError)
      return null
    }

    // Fetch cart items with product info
    const { data: cartItems, error: itemsError } = await supabase
      .from("cart_items")
      .select(`
        id,
        quantity,
        created_at,
        products:product_id (
          name,
          price,
          selling_price,
          gst_percentage
        )
      `)
      .eq("cart_id", cartId)

    if (itemsError) {
      console.error("Error fetching cart items:", itemsError)
      return { ...cart, cartItems: [] }
    }

    setCartItems({ ...cart, cartItems: cartItems || [] })
    return { ...cart, cartItems: cartItems || [] }
  }

  useEffect(() => {
    getCartWithItems(params.id)
  }, [])

  return (
    <div className="space-y-6 p-8">
      {/* Back button and heading */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/unplaced">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Unplaced Order Details</h1>
      </div>

      {/* Customer Information */}
      <Card className="p-2">
        <CardHeader>
          <CardTitle>Customer Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm text-muted-foreground font-semibold">Full Name</h3>
            <p>{cartItemss.profiles?.full_name || "—"}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Phone</h3>
            <p>{cartItemss.profiles?.phone || "—"}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Cart ID</h3>
            <p className="font-mono text-sm">{cartItemss?.id?.slice(0, 8)}...</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">Created At</h3>
            <p>{formatDate(cartItemss.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cart Items Table */}
      <Card className="p-2">
        <CardHeader className="flex flex-row items-center gap-2">
          <Package className="h-5 w-5" />
          <CardTitle>Items in this Unplaced Order</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead className="text-right">GST %</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartItemss?.cartItems?.length > 0 ? (
                <>
                  {cartItemss?.cartItems?.map((item: any) => {
                    const price = item.products?.selling_price || item.products?.price || 0
                    const gstPercentage = item.products?.gst_percentage || 0
                    const quantity = item.quantity || 0
                    const baseTotal = price * quantity
                    const gstAmount = (gstPercentage !== 0) ? (baseTotal * gstPercentage) / 100 : 0
                    const total = baseTotal

                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.products?.name || "Unknown Product"}</TableCell>
                        <TableCell className="text-right">{quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(price)}</TableCell>
                        <TableCell className="text-right">{gstPercentage}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                      </TableRow>
                    )
                  })}
                  {/* Grand Total Row */}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">
                      Grand Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(
                        cartItemss.cartItems.reduce((acc: number, item: any) => {
                          const price = item.products?.selling_price || item.products?.price || 0
                          const gstPercentage = item.products?.gst_percentage || 0
                          const quantity = item.quantity || 0
                          const baseTotal = price * quantity
                          const gstAmount = (gstPercentage !== 0) ? (baseTotal * gstPercentage) / 100 : 0
                          return acc + baseTotal + gstAmount
                        }, 0)
                      )}
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No items in this cart.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
