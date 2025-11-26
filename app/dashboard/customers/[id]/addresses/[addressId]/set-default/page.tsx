"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

interface SetDefaultAddressPageProps {
  params: {
    id: string
    addressId: string
  }
}

export default function SetDefaultAddressPage({ params }: SetDefaultAddressPageProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [address, setAddress] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const { data, error } = await supabase
          .from("user_addresses")
          .select("*")
          .eq("id", params.addressId)
          .eq("user_id", params.id)
          .single()

        if (error) throw error
        setAddress(data)
      } catch (error) {
        console.error("Error fetching address:", error)
        toast({
          title: "Error",
          description: "Could not load address information.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAddress()
  }, [supabase, params.id, params.addressId])

  const handleSetDefault = async () => {
    setIsSubmitting(true)
    try {
      // First, unset all default addresses for this user
      const { error: updateError } = await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", params.id)

      if (updateError) throw updateError

      // Then set this address as default
      const { error } = await supabase
        .from("user_addresses")
        .update({ is_default: true })
        .eq("id", params.addressId)
        .eq("user_id", params.id)

      if (error) throw error

      toast({
        title: "Default address updated",
        description: "The address has been set as the default.",
      })

      router.push(`/dashboard/customers/${params.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error setting default address:", error)
      toast({
        title: "Error",
        description: "There was a problem updating the default address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/customers/${params.id}`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Set Default Address</h1>
          </div>
        </div>
        <div className="flex justify-center">
          <p>Loading address information...</p>
        </div>
      </div>
    )
  }

  if (!address) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/customers/${params.id}`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Set Default Address</h1>
          </div>
        </div>
        <div className="flex justify-center">
          <p>Address not found.</p>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold">Set Default Address</h1>
        </div>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Check className="h-5 w-5 mr-2 text-green-600" />
              Set as Default Address
            </CardTitle>
            <CardDescription>Make this the default address for the customer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4">
              <div className="font-medium">{address.name || "Unnamed Address"}</div>
              <div className="mt-2 text-sm text-gray-600">
                <p>{address.address_line1}</p>
                {address.address_line2 && <p>{address.address_line2}</p>}
                <p>{[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}</p>
                <p>{address.country}</p>
                {address.phone && <p>Phone: {address.phone}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href={`/dashboard/customers/${params.id}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSetDefault} disabled={isSubmitting}>
              {isSubmitting ? "Setting as Default..." : "Set as Default"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
