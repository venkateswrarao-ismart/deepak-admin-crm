"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

interface AddressFormProps {
  userId: string
  address?: {
    id: string
    user_id: string
    address_type: string | null
    is_default: boolean | null
    name: string | null
    address_line1: string | null
    address_line2: string | null
    city: string | null
    state: string | null
    postal_code: string | null
    country: string | null
    phone: string | null
    landmark: string | null
    latitude: number | null
    longitude: number | null
  }
  mode: "create" | "edit"
}

export function AddressForm({ userId, address, mode }: AddressFormProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: address?.name || "",
    address_type: address?.address_type || "home",
    address_line1: address?.address_line1 || "",
    address_line2: address?.address_line2 || "",
    city: address?.city || "",
    state: address?.state || "",
    postal_code: address?.postal_code || "",
    country: address?.country || "India",
    phone: address?.phone || "",
    landmark: address?.landmark || "",
    is_default: address?.is_default || false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // If setting as default, first unset all other defaults
      if (formData.is_default) {
        await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", userId)
      }

      if (mode === "create") {
        // Create new address
        const { error } = await supabase.from("user_addresses").insert({
          user_id: userId,
          ...formData,
        })

        if (error) throw error
        toast({
          title: "Address created",
          description: "The address has been successfully created.",
        })
      } else {
        // Update existing address
        const { error } = await supabase
          .from("user_addresses")
          .update(formData)
          .eq("id", address?.id as string)

        if (error) throw error
        toast({
          title: "Address updated",
          description: "The address has been successfully updated.",
        })
      }

      // Redirect back to customer detail page
      router.push(`/dashboard/customers/${userId}`)
      router.refresh()
    } catch (error) {
      console.error("Error saving address:", error)
      toast({
        title: "Error",
        description: "There was a problem saving the address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Add New Address" : "Edit Address"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Address Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Home, Office, etc."
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_type">Address Type</Label>
              <Select
                value={formData.address_type}
                onValueChange={(value) => handleSelectChange("address_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select address type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line1">Address Line 1</Label>
            <Input
              id="address_line1"
              name="address_line1"
              placeholder="Street address, P.O. box, company name"
              value={formData.address_line1}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
            <Input
              id="address_line2"
              name="address_line2"
              placeholder="Apartment, suite, unit, building, floor, etc."
              value={formData.address_line2}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="City" value={formData.city} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                placeholder="State/Province/Region"
                value={formData.state}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                name="postal_code"
                placeholder="ZIP/Postal Code"
                value={formData.postal_code}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="Phone number for this address"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark">Landmark (Optional)</Label>
            <Textarea
              id="landmark"
              name="landmark"
              placeholder="Nearby landmark to help locate the address"
              value={formData.landmark}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => handleCheckboxChange("is_default", checked as boolean)}
            />
            <Label htmlFor="is_default">Set as default address</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/customers/${userId}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : mode === "create" ? "Add Address" : "Update Address"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
