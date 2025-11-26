"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import type { Database } from "@/types/supabase"

type StoreConfig = Database["public"]["Tables"]["store_configurations"]["Row"]

const formSchema = z.object({
  minimum_order_value: z.coerce.number().min(0, "Minimum order value cannot be negative").default(0),
  minimum_order_enabled: z.boolean().default(false),
})

interface MinimumOrderFormProps {
  initialData: Partial<StoreConfig>
  userId: string
}

export function MinimumOrderForm({ initialData, userId }: MinimumOrderFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      minimum_order_value: initialData.minimum_order_value || 0,
      minimum_order_enabled: initialData.minimum_order_enabled || false,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("store_configurations").upsert({
        id: initialData.id,
        minimum_order_value: values.minimum_order_value,
        minimum_order_enabled: values.minimum_order_enabled,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }

      toast({
        title: "Settings updated",
        description: "Minimum order settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating minimum order settings:", error)
      toast({
        title: "Error",
        description: "Failed to update minimum order settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="minimum_order_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Order Value (₹)</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormDescription>
                The minimum amount (in ₹) that customers must order to complete checkout
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minimum_order_enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Minimum Order Requirement</FormLabel>
                <FormDescription>
                  When enabled, customers cannot checkout if their order total is below the minimum value
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </Form>
  )
}
