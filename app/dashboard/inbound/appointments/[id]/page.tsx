import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface AppointmentPageProps {
  params: {
    id: string
  }
}

export default async function AppointmentPage({ params }: AppointmentPageProps) {
  const supabase = createSupabaseServerClient()

  try {
    // Fetch the appointment with related PO data
    const { data: appointment, error } = await supabase
      .from("inbound_appointments")
      .select(`
        *,
        purchase_orders:po_id (
          id,
          vendor_id,
          vendors:vendor_id (
            name
          )
        )
      `)
      .eq("id", params.id)
      .single()

    if (error || !appointment) {
      console.error("Error fetching appointment:", error)
      notFound()
    }

    // Format date for display
    const formatDate = (dateString?: string | null) => {
      if (!dateString) return "N/A"
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    }

    // Format time for display
    const formatTime = (dateString?: string | null) => {
      if (!dateString) return "N/A"
      return new Date(dateString).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/inbound/${appointment.po_id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Appointment Details</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Appointment for PO: {appointment.po_id}</CardTitle>
              <Badge
                variant={
                  appointment.status === "Completed"
                    ? "default"
                    : appointment.status === "Cancelled"
                      ? "destructive"
                      : appointment.status === "Arrived"
                        ? "outline"
                        : "secondary"
                }
              >
                {appointment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Vendor</h3>
                <p className="text-lg">{appointment.purchase_orders?.vendors?.name || "Unknown Vendor"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Appointment Date</h3>
                <p className="text-lg">{formatDate(appointment.appointment_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Expected Arrival Time</h3>
                <p className="text-lg">{formatTime(appointment.expected_arrival_time)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created On</h3>
                <p className="text-lg">{formatDate(appointment.created_at)}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Vehicle & Driver Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Vehicle Details</h3>
                  <p className="text-lg">{appointment.vehicle_details || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Driver Name</h3>
                  <p className="text-lg">{appointment.driver_name || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Driver Contact</h3>
                  <p className="text-lg">{appointment.driver_contact || "Not provided"}</p>
                </div>
              </div>
            </div>

            {appointment.notes && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <p className="text-muted-foreground">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t">
            <Link href={`/dashboard/inbound/${appointment.po_id}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Purchase Order
              </Button>
            </Link>
            <div className="flex gap-2">
              {appointment.status === "Scheduled" && (
                <form
                  action={async () => {
                    "use server"
                    const supabase = createSupabaseServerClient()
                    await supabase.from("inbound_appointments").update({ status: "Arrived" }).eq("id", appointment.id)
                  }}
                >
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Mark as Arrived
                  </Button>
                </form>
              )}
              {appointment.status === "Arrived" && (
                <form
                  action={async () => {
                    "use server"
                    const supabase = createSupabaseServerClient()
                    await supabase.from("inbound_appointments").update({ status: "Completed" }).eq("id", appointment.id)
                  }}
                >
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Mark as Completed
                  </Button>
                </form>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error in appointment detail page:", error)
    notFound()
  }
}
