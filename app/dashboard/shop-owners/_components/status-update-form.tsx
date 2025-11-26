"use client"

import type React from "react"

import { useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react"

interface StatusUpdateFormProps {
  registrationId: string
  currentStatus: string
  rejectionReason?: string | null
}

export function StatusUpdateForm({ registrationId, currentStatus, rejectionReason }: StatusUpdateFormProps) {
  const [status, setStatus] = useState<string>(currentStatus)
  const [reason, setReason] = useState<string>(rejectionReason || "")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData: any = {
        status,
      }

      // Only include rejection reason if status is rejected
      if (status === "rejected") {
        updateData.rejection_reason = reason
      } else {
        updateData.rejection_reason = null
      }

      // Add approved_at timestamp if status is approved
      if (status === "approved") {
        updateData.approved_at = new Date().toISOString()

        // In a real application, you would get the current user's ID
        // updateData.approved_by = currentUserId
      }

      const { error } = await supabase.from("shop_owner_registrations").update(updateData).eq("id", registrationId)

      if (error) throw error

      toast({
        title: "Status updated",
        description: `Registration status has been updated to ${status}.`,
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Registration Status</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <RadioGroup value={status} onValueChange={setStatus} className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pending" id="pending" />
              <Label htmlFor="pending" className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                Pending
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="under_review" id="under_review" />
              <Label htmlFor="under_review" className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4 text-blue-500" />
                Under Review
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="approved" id="approved" />
              <Label htmlFor="approved" className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Approved
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rejected" id="rejected" />
              <Label htmlFor="rejected" className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                Rejected
              </Label>
            </div>
          </RadioGroup>

          {status === "rejected" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for rejection"
                required={status === "rejected"}
                rows={4}
              />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Status"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
