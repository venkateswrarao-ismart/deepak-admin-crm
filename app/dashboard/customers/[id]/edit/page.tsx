import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound, redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CustomerEditPageProps {
  params: {
    id: string
  }
}

export default async function CustomerEditPage({ params }: CustomerEditPageProps) {
  const supabase = createSupabaseServerClient()

  // Fetch the current customer data
  const { data: customer, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .eq("role", "customer")
    .single()

  if (error || !customer) {
    notFound()
  }

  async function updateCustomer(formData: FormData) {
    "use server"

    const supabase = createSupabaseServerClient()
    const full_name = formData.get("full_name") as string
    const shop_name = formData.get("shop_name") as string
    const phone = formData.get("phone") as string

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name,
        shop_name,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (error) {
      console.error("Error updating customer:", error)
      throw error
    }

    redirect(`/dashboard/customers/${params.id}`)
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
          <h1 className="text-3xl font-bold">Edit Customer</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
          <CardDescription>Update the customer's name, shop, and phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateCustomer} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Customer Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  defaultValue={customer.full_name || ""}
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <Label htmlFor="shop_name">Shop Name</Label>
                <Input
                  id="shop_name"
                  name="shop_name"
                  type="text"
                  defaultValue={customer.shop_name || ""}
                  placeholder="Enter shop name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="text"
                  defaultValue={customer.phone || ""}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href={`/dashboard/customers/${params.id}`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
