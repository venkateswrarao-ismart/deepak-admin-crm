import type { Metadata } from "next"
import Link from "next/link"
import { format } from "date-fns"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Discount Banners",
  description: "Manage discount-based promotional banners",
}

export default async function DiscountBannersPage() {
  const supabase = createClient()
  const { data: discountBanners, error } = await supabase
    .from("discount_banners")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching discount banners:", error)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discount Banners</h1>
          <p className="text-muted-foreground">Manage discount-based promotional banners</p>
        </div>
        <Link href="/dashboard/discount-banners/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Discount Banner
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Discount Banners</CardTitle>
          <CardDescription>View and manage banners that promote discounts</CardDescription>
        </CardHeader>
        <CardContent>
          {discountBanners && discountBanners.length > 0 ? (
            <div className="grid gap-6">
              {discountBanners.map((banner) => (
                <div key={banner.id} className="flex flex-col md:flex-row gap-4 border rounded-lg p-4">
                  <div className="w-full md:w-1/4 aspect-[16/9] relative rounded-md overflow-hidden">
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{banner.title}</h3>
                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                        <Badge variant={banner.is_active ? "default" : "outline"}>
                          {banner.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="secondary">Priority: {banner.priority}</Badge>
                        <Badge variant="secondary">Discount: {banner.discount_percentage}%</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                      {banner.position && <div>Position: {banner.position}</div>}
                      {banner.link_url && (
                        <div className="truncate">
                          Link: <span className="underline">{banner.link_url}</span>
                        </div>
                      )}
                      <div>
                        Date Range:{" "}
                        {banner.start_date ? format(new Date(banner.start_date), "MMM d, yyyy") : "No start date"} to{" "}
                        {banner.end_date ? format(new Date(banner.end_date), "MMM d, yyyy") : "No end date"}
                      </div>
                      <div>Created: {format(new Date(banner.created_at), "MMM d, yyyy")}</div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/discount-banners/${banner.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/dashboard/discount-banners/${banner.id}/delete`}>
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
              <p className="text-muted-foreground mb-4">No discount banners found</p>
              <Link href="/dashboard/discount-banners/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Discount Banner
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
