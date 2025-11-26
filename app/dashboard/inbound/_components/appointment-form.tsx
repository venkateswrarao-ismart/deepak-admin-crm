"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AppointmentFormProps {
  purchaseOrders: { id: string; label: string }[]
  preselectedPO?: string
}

export function AppointmentForm({ purchaseOrders, preselectedPO }: AppointmentFormProps) {
  const [poId, setPoId] = useState(preselectedPO || "")
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [expectedTime, setExpectedTime] = useState("")
  const [vehicleDetails, setVehicleDetails] = useState("")
  const [driverName, setDriverName] = useState("")
  const [driverContact, setDriverContact] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!poId || !appointmentDate || !expectedTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Create expected arrival time by combining date and time
      const [hours, minutes] = expectedTime.split(":")
      const expectedArrival = new Date(appointmentDate)
      expectedArrival.setHours(Number.parseInt(hours), Number.parseInt(minutes))

      const { error } = await supabase.from("inbound_appointments").insert({
        po_id: poId,
        appointment_date: appointmentDate.toISOString(),
        expected_arrival_time: expectedArrival.toISOString(),
        vehicle_details: vehicleDetails,
        driver_name: driverName,
        driver_contact: driverContact,
        status: "Scheduled",
        notes,
      })

      if (error) throw error

      toast({
        title: "Appointment scheduled",
        description: "The inbound appointment has been scheduled successfully.",
      })

      // Update PO status to Approved if it's not already
      await supabase
        .from("purchase_orders")
        .update({ inbound_status: "Approved" })
        .eq("id", poId)
        .is("inbound_status", null)

      router.push(`/dashboard/inbound/${poId}`)
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
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="po">Purchase Order</Label>
            <Select value={poId} onValueChange={setPoId} disabled={!!preselectedPO}>
              <SelectTrigger>
                <SelectValue placeholder="Select a purchase order" />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment-date">Appointment Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="appointment-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {appointmentDate ? format(appointmentDate, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={appointmentDate}
                    onSelect={(date) => {
                      setAppointmentDate(date)
                      setCalendarOpen(false)
                    }}
                    initialFocus
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      return date < today
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected-time">Expected Arrival Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expected-time"
                  type="time"
                  value={expectedTime}
                  onChange={(e) => setExpectedTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle-details">Vehicle Details</Label>
            <Input
              id="vehicle-details"
              value={vehicleDetails}
              onChange={(e) => setVehicleDetails(e.target.value)}
              placeholder="Vehicle number, type, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driver-name">Driver Name</Label>
              <Input id="driver-name" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver-contact">Driver Contact</Label>
              <Input id="driver-contact" value={driverContact} onChange={(e) => setDriverContact(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional information..."
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/inbound")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Scheduling..." : "Schedule Appointment"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
