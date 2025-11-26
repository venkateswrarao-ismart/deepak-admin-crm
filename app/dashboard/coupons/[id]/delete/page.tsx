import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DeleteCouponPageProps {
  params: { id: string }
}

export default async function DeleteCouponPage({ params }: DeleteCouponPageProps) {
  const supabase = createClient()
  const { id } = params

  // Fetch the coupon to confirm deletion
  const { data: coupon, error: fetchError } = await supabase
    .from("coupons")
    .select("id, code")
    .eq("id", id)
    .single()

  if (fetchError || !coupon) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Coupon Not Found</h1>
        <p className="text-muted-foreground mb-4">The coupon you're trying to delete doesn't exist.</p>
        <Link href="/dashboard/coupons">
          <Button>Back to Coupons</Button>
        </Link>
      </div>
    )
  }

  async function handleDelete() {
    "use server"

    const supabase = createClient()

    const { error } = await supabase.from("coupons").delete().eq("id", id)

    if (error) {
      throw new Error("Failed to delete coupon: " + error.message)
    }

    redirect("/dashboard/coupons")
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-4">Delete Coupon</h1>
      <p className="mb-6">
        Are you sure you want to delete coupon <strong>{coupon.code}</strong>? This action cannot be undone.
      </p>
      <form action={handleDelete} className="flex gap-4">
        <Button type="submit" variant="destructive">
          Yes, Delete
        </Button>
        <Link href="/dashboard/coupons">
          <Button variant="outline">Cancel</Button>
        </Link>
      </form>
    </div>
  )
}
