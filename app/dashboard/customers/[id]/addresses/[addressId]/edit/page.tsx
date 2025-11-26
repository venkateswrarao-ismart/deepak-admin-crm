import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { AddressForm } from "@/app/dashboard/customers/_components/address-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface EditAddressPageProps {
  params: {
    id: string
    addressId: string
  }
}

export default async function EditAddressPage({ params }: EditAddressPageProps) {
  const supabase = createSupabaseServerClient()

  // Verify the customer exists
  const { data: customer, error: customerError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", params.id)
    .eq("role", "customer")
    .single()

  if (customerError || !customer) {
    notFound()
  }

  // Fetch the address
  const { data: address, error: addressError } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("id", params.addressId)
    .eq("user_id", params.id)
    .single()

  if (addressError || !address) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/customers/${params.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Address</h1>
        </div>
      </div>

      <div className="max-w-3xl">
        <AddressForm userId={params.id} address={address} mode="edit" />
      </div>
    </div>
  )
}
