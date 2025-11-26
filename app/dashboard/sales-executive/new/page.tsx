"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

export default function AddSalesExecutivePage() {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [managerId, setManagerId] = useState<string>("")
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const fetchManagers = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("sales_managers").select("id, name").order("name")

      if (error) {
        toast({ title: "Error fetching managers", description: error.message, variant: "destructive" })
      } else {
        setManagers(data || [])
      }
    }

    fetchManagers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.from("sales_executives").insert([
      {
        name: fullName,
        phone,
        manager_id: managerId,
      },
    ])

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      toast({ title: "Success", description: "Sales Executive added." })
      router.push("/dashboard/sales-executive")
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10">
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Add New Sales Executive</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <Label>Sales Manager</Label>
              <Select value={managerId} onValueChange={setManagerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Executive"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
