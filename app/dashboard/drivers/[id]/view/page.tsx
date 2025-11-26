"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Driver {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  vehicle_id: number | null
}

export default function DriverDetailsPage({ params }: { params: { id: string } }) {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchDriver() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, vehicle_id")
          .eq("id", params.id)
          .eq("role", "driver")
          .single()

        if (error) {
          console.error("Error fetching driver:", error)
          return
        }

        setDriver(data as Driver)
      } catch (error) {
        console.error("Error fetching driver:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDriver()
  }, [supabase, params.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/drivers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Drivers
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading driver details...</div>
          ) : driver ? (
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {driver.full_name || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {driver.email || "N/A"}
              </p>
              <p>
                <strong>Phone:</strong> {driver.phone || "N/A"}
              </p>
              <p>
                <strong>Vehicle ID:</strong> {driver.vehicle_id || "N/A"}
              </p>
            </div>
          ) : (
            <div>Driver not found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
