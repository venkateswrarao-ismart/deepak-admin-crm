"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { MinimumOrderForm } from "../_components/minimum-order-form"

export default function MinimumOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [storeConfig, setStoreConfig] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get auth data from localStorage using the Supabase key
    const authKey = "sb-sqpgtmpbfmtaivbfsjuy-auth-token"
    const storedAuth = localStorage.getItem(authKey)

    if (!storedAuth) {
      console.error("No authentication data found")
      router.push("/login")
      return
    }

    try {
      // Parse the auth data
      const authData = JSON.parse(storedAuth)

      // Extract user ID from the auth data
      if (authData && authData.user && authData.user.id) {
        setUserId(authData.user.id)

        // Fetch store configuration
        fetchStoreConfig(authData.user.id)
      } else {
        console.error("Invalid authentication data structure")
        router.push("/login")
      }
    } catch (error) {
      console.error("Error parsing authentication data:", error)
      router.push("/login")
    }
  }, [router])

  const fetchStoreConfig = async (userId: string) => {
    try {
      setLoading(true)

      // Fetch the current store configuration
      const { data: config, error } = await supabase
        .from("store_configurations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // If no configuration exists, create a default one
      if (error && error.code === "PGRST116") {
        const { data: newConfig, error: insertError } = await supabase
          .from("store_configurations")
          .insert({
            minimum_order_value: 0,
            minimum_order_enabled: false,
            updated_by: userId,
          })
          .select()
          .single()

        if (insertError) {
          console.error("Error creating default configuration:", insertError)
          return
        }

        setStoreConfig(
          newConfig || {
            id: "",
            minimum_order_value: 0,
            minimum_order_enabled: false,
          },
        )
      } else if (error) {
        console.error("Error fetching store configuration:", error)
      } else {
        setStoreConfig(config)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[250px]" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Minimum Order Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configure Minimum Order</CardTitle>
          <CardDescription>Set the minimum order value that customers must meet to place an order</CardDescription>
        </CardHeader>
        <CardContent>
          {storeConfig && userId && <MinimumOrderForm initialData={storeConfig} userId={userId} />}
        </CardContent>
      </Card>
    </div>
  )
}
