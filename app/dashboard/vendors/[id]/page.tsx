import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { VendorForm } from "../_components/vendor-form"

interface VendorPageProps {
  params: {
    id: string
  }
}

export default async function VendorPage({ params }: VendorPageProps) {
  const supabase = createSupabaseServerClient()

  // If it's a new vendor
  if (params.id === "new") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Add Vendor</h1>
        <VendorForm />
      </div>
    )
  }

  // Fetch the vendor
  const { data: vendor } = await supabase.from("vendors").select("*").eq("id", params.id).single()

  if (!vendor) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Vendor</h1>
      <VendorForm vendor={vendor} />
    </div>
  )
}
