import type { Metadata } from "next"
import { BannerForm } from "../_components/banner-form"

export const metadata: Metadata = {
  title: "Create New Banner",
  description: "Create a new promotional banner",
}

export default function NewBannerPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Banner</h1>
        <p className="text-muted-foreground">Add a new promotional banner to your application</p>
      </div>
      <BannerForm />
    </div>
  )
}
