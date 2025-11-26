import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { DiscountBannerForm } from "../_components/discount-banner-form"
import { createClient } from "@/lib/supabase/server"

interface EditDiscountBannerPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditDiscountBannerPageProps): Promise<Metadata> {
  return {
    title: "Edit Discount Banner",
    description: "Edit an existing discount promotional banner",
  }
}

export default async function EditDiscountBannerPage({ params }: EditDiscountBannerPageProps) {
  const supabase = createClient()
  const { data: banner, error } = await supabase
    .from("discount_banners")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !banner) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Discount Banner</h1>
        <p className="text-muted-foreground">Update an existing discount promotional banner</p>
      </div>
      <DiscountBannerForm banner={banner} />
    </div>
  )
}
