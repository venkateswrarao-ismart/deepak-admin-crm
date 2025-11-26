"use client"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { BannerImageUpload } from "./banner-image-upload"
import type { Database } from "@/types/supabase"
import { useToast } from "@/components/ui/use-toast"

type Banner = Database["public"]["Tables"]["banners"]["Row"]

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  image_url: z.string().min(1, "Banner image is required"),
  link_url: z.string().optional(),
  position: z.string().optional(),
  priority: z.coerce.number().int().min(0).default(0),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
  is_active: z.boolean().default(true),
  category_id: z.string().uuid().optional().nullable(),
})

type FormValues = z.infer<typeof formSchema>

interface BannerFormProps {
  banner?: Banner
}

const positionOptions = [
  { value: "home_top", label: "Home Page - Top" },
  { value: "home_middle", label: "Home Page - Middle" },
  { value: "home_bottom", label: "Home Page - Bottom" },
  { value: "category_page", label: "Category Page" },
  { value: "product_page", label: "Product Page" },
]

export function BannerForm({ banner }: BannerFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string; image_url: string | null }[]>([])
  const supabase = createClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: banner?.title || "",
      image_url: banner?.image_url || "",
      link_url: banner?.link_url || "",
      position: banner?.position || "",
      priority: banner?.priority || 0,
      start_date: banner?.start_date ? new Date(banner.start_date) : null,
      end_date: banner?.end_date ? new Date(banner.end_date) : null,
      is_active: banner?.is_active !== false, // Default to true if not specified
      category_id: banner?.category_id || null,
    },
  })

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, image_url")
        .is("parent_id", null) // Only fetch main categories (those without a parent)
        .order("name")

      if (error) {
        console.error("Error fetching categories:", error)
        return
      }

      setCategories(data || [])
    }

    fetchCategories()
  }, [supabase])

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      // Handle the "none" value for category_id
      const categoryId = values.category_id === "none" ? null : values.category_id

      if (banner) {
        // Update existing banner
        const { error } = await supabase
          .from("banners")
          .update({
            title: values.title,
            image_url: values.image_url,
            link_url: values.link_url || null,
            position: values.position || null,
            priority: values.priority,
            start_date: values.start_date ? values.start_date.toISOString() : null,
            end_date: values.end_date ? values.end_date.toISOString() : null,
            is_active: values.is_active,
            category_id: categoryId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", banner.id)

        if (error) throw error

        toast({
          title: "Banner Updated",
          description: "The banner has been successfully updated.",
          variant: "success",
        })
      } else {
        // Create new banner
        const { error } = await supabase.from("banners").insert({
          title: values.title,
          image_url: values.image_url,
          link_url: values.link_url || null,
          position: values.position || null,
          priority: values.priority,
          start_date: values.start_date ? values.start_date.toISOString() : null,
          end_date: values.end_date ? values.end_date.toISOString() : null,
          is_active: values.is_active,
          category_id: categoryId,
        })

        if (error) throw error

        toast({
          title: "Banner Created",
          description: "The new banner has been successfully created.",
          variant: "success",
        })
      }

      // Navigate back after successful submission
      router.push("/dashboard/banners")
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

  const handleImageUploaded = (url: string) => {
    form.setValue("image_url", url)
  }

  const handleImageRemoved = () => {
    form.setValue("image_url", "")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{banner ? "Edit Banner" : "Create New Banner"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Title</FormLabel>
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
                    <Input placeholder="https://example.com/page" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormDescription>Where users will be directed when they click on the banner</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Where the banner should appear</FormDescription>
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
                    <FormDescription>Higher numbers will be displayed first</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Link this banner to a specific category</FormDescription>
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
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>Enable or disable this banner</FormDescription>
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
