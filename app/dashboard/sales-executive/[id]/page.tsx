"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export default function SalesManagerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [manager, setManager] = useState({
    name: "",

    phone: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("sales_executives")
        .select("*")
        .eq("id", params.id)
        .single()

      if (error || !data) {
        toast({ title: "Error", description: "Executive not found", variant: "destructive" })
        router.replace("/dashboard/sales-executive")
        return
      }

      setManager({
        name: data.name || "",
      
        phone: data.phone || "",
      })
      setLoading(false)
    }

    fetchData()
  }, [params.id, supabase, router])

  const handleChange = (field: string, value: string) => {
    setManager((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from("sales_executives")
      .update({
        name: manager.name,
     
        phone: manager.phone,
      })
      .eq("id", params.id)

    setSaving(false)

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Updated", description: "Executive details saved." })
      router.push("/dashboard/sales-executive")
    }
  }

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Sales Executive Details</h1>

      <Card className="p-4">
        <CardHeader>
          <CardTitle>Edit Executive Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={manager.name} onChange={(e) => handleChange("name", e.target.value)} />
          </div>
      
          <div>
            <Label>Phone</Label>
            <Input value={manager.phone} onChange={(e) => handleChange("phone", e.target.value)} />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
