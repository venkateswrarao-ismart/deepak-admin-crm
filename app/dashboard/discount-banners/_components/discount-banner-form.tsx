"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BannerImageUpload } from "../../banners/_components/banner-image-upload"
import { useToast } from "@/components/ui/use-toast"
import type { Database } from "@/types/supabase"

type DiscountBanner = Database["public"]["Tables"]["discount_banners"]["Row"]

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  image_url: z.string().min(1, "Image is required"),
  link_url: z.string().optional(),
  priority: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
  discount_percentage: z.coerce.number().min(0, "Minimum is 0").max(100, "Maximum is 100"),
})

type FormValues = z.infer<typeof formSchema>

interface DiscountBannerFormProps {
  banner?: DiscountBanner
}

export function DiscountBannerForm({ banner }: DiscountBannerFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: banner?.title || "",
      image_url: banner?.image_url || "",
      link_url: banner?.link_url || "",
      priority: banner?.priority || 0,
      is_active: banner?.is_active !== false,
      start_date: banner?.start_date ? new Date(banner.start_date) : null,
      end_date: banner?.end_date ? new Date(banner.end_date) : null,
      discount_percentage: banner?.discount_percentage || 0,
    },
  })

  const handleImageUploaded = (url: string) => {
    form.setValue("image_url", url)
  }

  const handleImageRemoved = () => {
    form.setValue("image_url", "")
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      if (banner) {
        const { error } = await supabase
          .from("discount_banners")
          .update({
            title: values.title,
            image_url: values.image_url,
            link_url: values.link_url || null,
            priority: values.priority,
            is_active: values.is_active,
            start_date: values.start_date ? values.start_date.toISOString() : null,
            end_date: values.end_date ? values.end_date.toISOString() : null,
            discount_percentage: values.discount_percentage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", banner.id)

        if (error) throw error

        toast({
          title: "Discount Banner Updated",
          description: "The banner has been successfully updated.",
          variant: "success",
        })
      } else {
        const { error } = await supabase.from("discount_banners").insert({
          title: values.title,
          image_url: values.image_url,
          link_url: values.link_url || null,
          priority: values.priority,
          is_active: values.is_active,
          start_date: values.start_date ? values.start_date.toISOString() : null,
          end_date: values.end_date ? values.end_date.toISOString() : null,
          discount_percentage: values.discount_percentage,
        })

        if (error) throw error

        toast({
          title: "Discount Banner Created",
          description: "The banner has been successfully created.",
          variant: "success",
        })
      }

      router.push("/dashboard/discount-banners")
      router.refresh()
    } catch (error) {
      console.error("Error saving banner:", error)
      toast({
        title: "Error",
        description: "Failed to save banner. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{banner ? "Edit Discount Banner" : "Create Discount Banner"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter banner title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <FormControl>
                    <BannerImageUpload
                      onImageUploaded={handleImageUploaded}
                      onImageRemoved={handleImageRemoved}
                      existingImageUrl={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/offer" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormDescription>Higher numbers appear first</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discount_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Percentage</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" max="100" {...field} />
                  </FormControl>
                  <FormDescription>Value between 0 and 100</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>Enable or disable the banner</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {banner ? "Update Banner" : "Create Banner"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
