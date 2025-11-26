import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface DeleteDiscountBannerPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params,
}: DeleteDiscountBannerPageProps): Promise<Metadata> {
  return {
    title: "Delete Discount Banner",
    description: "Delete an existing discount promotional banner",
  }
}

export default async function DeleteDiscountBannerPage({
  params,
}: DeleteDiscountBannerPageProps) {
  const supabase = createClient()
  const { data: banner, error } = await supabase
    .from("discount_banners")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !banner) {
    notFound()
  }

  async function deleteBanner() {
    "use server"

    const supabase = createClient()
    const { error } = await supabase
      .from("discount_banners")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Error deleting banner:", error)
      return { success: false, error: error.message }
    }

    redirect("/dashboard/discount-banners")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Delete Discount Banner</h1>
        <p className="text-muted-foreground">
          Permanently delete this discount promotional banner
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confirm Deletion</CardTitle>
          <CardDescription>
            Are you sure you want to delete the banner "{banner.title}"? This action
            cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <p>
              <strong>Title:</strong> {banner.title}
            </p>
            {banner.position && (
              <p>
                <strong>Position:</strong> {banner.position}
              </p>
            )}
            <p>
              <strong>Status:</strong> {banner.is_active ? "Active" : "Inactive"}
            </p>
            <p>
              <strong>Discount:</strong> {banner.discount_percentage}%
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/dashboard/discount-banners">
            <Button variant="outline">Cancel</Button>
          </Link>
          <form action={deleteBanner}>
            <Button variant="destructive" type="submit">
              Delete Banner
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
