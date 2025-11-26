import type { Metadata } from "next"
import Link from "next/link"
import { format } from "date-fns"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Coupon Management",
  description: "Manage discount coupons for your application",
}

export default async function CouponsPage() {
  const supabase = createClient()
  const { data: coupons, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching coupons:", error)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupon Management</h1>
          <p className="text-muted-foreground">Manage discount coupons for your application</p>
        </div>
        <Link href="/dashboard/coupons/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Coupon
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>View and manage all discount coupons</CardDescription>
        </CardHeader>
        <CardContent>
          {coupons && coupons.length > 0 ? (
            <div className="grid gap-6">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="flex flex-col md:flex-row gap-4 border rounded-lg p-4">
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{coupon.code}</h3>
                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <Badge variant={coupon.is_active ? "default" : "outline"}>
                          {coupon.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="secondary">
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}% off`
                            : `₹${coupon.discount_value} off`}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                      {coupon.description && <div>{coupon.description}</div>}
                      {coupon.minimum_order_amount > 0 && (
                        <div>Min Order: ₹{coupon.minimum_order_amount.toFixed(2)}</div>
                      )}
                      <div>
                        Valid:{" "}
                        {format(new Date(coupon.start_date), "MMM d, yyyy")}{" "}
                        to{" "}
                        {coupon.end_date ? format(new Date(coupon.end_date), "MMM d, yyyy") : "No expiry"}
                      </div>
                      <div>
                        Uses: {coupon.current_uses}
                        {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                      </div>
                      <div>Created: {format(new Date(coupon.created_at), "MMM d, yyyy")}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/coupons/${coupon.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/dashboard/coupons/${coupon.id}/delete`}>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No coupons found</p>
              <Link href="/dashboard/coupons/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Coupon
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
