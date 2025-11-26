import type { Metadata } from "next"
import { DiscountBannerForm } from "../_components/discount-banner-form"

export const metadata: Metadata = {
  title: "Create New Discount Banner",
  description: "Create a new discount promotional banner",
}

export default function NewDiscountBannerPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Discount Banner</h1>
        <p className="text-muted-foreground">Add a new discount banner to highlight offers and promotions</p>
      </div>
      <DiscountBannerForm />
    </div>
  )
}
