import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BannerForm } from "../_components/banner-form"
import { createClient } from "@/lib/supabase/server"

interface EditBannerPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditBannerPageProps): Promise<Metadata> {
  return {
    title: "Edit Banner",
    description: "Edit an existing promotional banner",
  }
}

export default async function EditBannerPage({ params }: EditBannerPageProps) {
  const supabase = createClient()
  const { data: banner, error } = await supabase.from("banners").select("*").eq("id", params.id).single()

  if (error || !banner) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Banner</h1>
        <p className="text-muted-foreground">Update an existing promotional banner</p>
      </div>
      <BannerForm banner={banner} />
    </div>
  )
}
