"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

interface DeleteAddressPageProps {
  params: {
    id: string
    addressId: string
  }
}

export default function DeleteAddressPage({ params }: DeleteAddressPageProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from("user_addresses")
        .delete()
        .eq("id", params.addressId)
        .eq("user_id", params.id)

      if (error) throw error

      toast({
        title: "Address deleted",
        description: "The address has been successfully deleted.",
      })

      router.push(`/dashboard/customers/${params.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error deleting address:", error)
      toast({
        title: "Error",
        description: "There was a problem deleting the address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
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
          <h1 className="text-3xl font-bold">Delete Address</h1>
        </div>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirm Deletion
            </CardTitle>
            <CardDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Deleting this address will permanently remove it from the customer's profile. Any orders or other data
              associated with this address will remain, but the address details will be lost.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href={`/dashboard/customers/${params.id}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Address"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
