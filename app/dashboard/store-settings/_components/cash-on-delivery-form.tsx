"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import type { Database } from "@/types/supabase"

type StoreConfig = Database["public"]["Tables"]["store_configurations"]["Row"]

const formSchema = z.object({
  cashon_delivery_managing: z.boolean().default(true),
})

interface CashOnDeliveryFormProps {
  initialData: Partial<StoreConfig>
  userId: string
}

export function CashOnDeliveryForm({ initialData, userId }: CashOnDeliveryFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cashon_delivery_managing: initialData.cashon_delivery_managing !== false,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("store_configurations").upsert({
        id: initialData.id,
        cashon_delivery_managing: values.cashon_delivery_managing,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }

      toast({
        title: "Settings updated",
        description: "Cash on delivery settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating cash on delivery settings:", error)
      toast({
        title: "Error",
        description: "Failed to update cash on delivery settings. Please try again.",
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
          name="cashon_delivery_managing"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Cash on Delivery</FormLabel>
                <FormDescription>Allow customers to pay with cash upon delivery</FormDescription>
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
