"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { ProductImageManager } from "./product-image-manager"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const productSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  price: z
    .string()
    .refine((val) => val === "" || !isNaN(Number(val)), { message: "Price must be a valid number" })
    .transform((val) => (val === "" ? undefined : Number(val))),
  selling_price: z
    .string()
    .refine((val) => val === "" || !isNaN(Number(val)), { message: "Selling price must be a valid number" })
    .transform((val) => (val === "" ? undefined : Number(val))),
  stock: z
    .string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number.isInteger(Number(val))), {
      message: "Stock must be a valid integer",
    })
    .transform((val) => (val === "" ? undefined : Number(val))),
  category_id: z.string().uuid({ message: "Please select a category" }),
  sub_category_id: z.string().uuid().optional(),
  brand: z.string().optional(),
  hsn_code: z.string().optional(),
  per: z.string().optional(),
  gst_percentage: z
    .string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100), {
      message: "GST percentage must be between 0 and 100",
    })
    .transform((val) => (val === "" ? undefined : Number(val))),
  discount_percentage: z
    .string()
    .refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100), {
      message: "Discount percentage must be between 0 and 100",
    })
    .transform((val) => (val === "" ? undefined : Number(val))),
  weight: z
    .string()
    .refine((val) => val === "" || !isNaN(Number(val)), { message: "Weight must be a valid number" })
    .transform((val) => (val === "" ? undefined : Number(val))),
  unit_of_measurement: z.string().optional(),
  mrp: z
    .string()
    .refine((val) => val === "" || !isNaN(Number(val)), { message: "MRP must be a valid number" })
    .transform((val) => (val === "" ? undefined : Number(val))),
  cost_price: z
    .string()
    .refine((val) => val === "" || !isNaN(Number(val)), { message: "Cost price must be a valid number" })
    .transform((val) => (val === "" ? undefined : Number(val))),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  productId?: string
}

// Define the special category IDs and user IDs
const RICE_CATEGORY_IDS = [
  "1a915b44-a7d7-472e-abae-90dd70ae3923",
  "86613b89-fdad-4231-a444-308afb945283",
  "00bd9236-3aa2-48f0-9dfe-d9e54b655e2e",
]

const SPECIAL_USER_IDS = ["d347bd21-e42b-4f63-ae12-b7589617b527", "118de4f6-0322-4301-b521-7f46c50eb3cd","c10adc33-89ad-4347-82f3-503eb3a90c81","67e10586-72fc-4daa-9488-d62dae229332","905cb410-5a83-409d-833a-5bc0d2fec983"]

export function ProductForm({ productId }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string; image_url: string | null }[]>([])
  const [subCategories, setSubCategories] = useState<{ id: string; name: string; parent_id: string }[]>([])
  const [productImages, setProductImages] = useState<{ id?: string; image_url: string; is_primary: boolean }[]>([])
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([])
  const [authData, setAuthData] = useState<any>(null)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    try {
      const authDataString = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      if (authDataString) {
        const parsedAuthData = JSON.parse(authDataString)
        setAuthData(parsedAuthData)
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
  }, [])

  // Check if the current user can edit selling price
  const canEditSellingPrice = () => {
    if (!authData?.user?.id) return false

    const userId = authData.user.id
    const categoryId = form.getValues("category_id")

    // Check if user is one of the special users
    if (SPECIAL_USER_IDS.includes(userId)) {
      // For user 118de4f6-0322-4301-b521-7f46c50eb3cd, allow editing for all products
      if (userId === "118de4f6-0322-4301-b521-7f46c50eb3cd") {
        return true
      }
      // For user d347bd21-e42b-4f63-ae12-b7589617b527, only allow for rice categories
      if (userId === "d347bd21-e42b-4f63-ae12-b7589617b527") {
        return true
      }

      if (userId ===  "2d374b81-0fce-449a-a463-2b860e105eda") {
        return true
      }

       if (userId ===  "67e10586-72fc-4daa-9488-d62dae229332" ) {
        return true
      }

     

      if (userId ===  "c10adc33-89ad-4347-82f3-503eb3a90c81" ) {
        return true
      }

     

      if (userId ===   "905cb410-5a83-409d-833a-5bc0d2fec983") {
        return true
      }

     
    }
    return false
  }

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      selling_price: "",
      stock: "",
      category_id: "",
      sub_category_id: "",
      brand: "",
      hsn_code: "",
      per: "",
      gst_percentage: "",
      discount_percentage: "",
      weight: "",
      unit_of_measurement: "",
      mrp: "",
      cost_price: "",
    },
  })

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, image_url")
        .is("parent_id", null)
        .order("name")

      if (error) {
        console.error("Error fetching categories:", error)
        return
      }

      setCategories(data || [])
    }

    fetchCategories()
  }, [supabase])

  // Fetch sub-categories when category changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      const categoryId = form.getValues("category_id")
      if (!categoryId) {
        setSubCategories([])
        return
      }

      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, parent_id")
          .eq("parent_id", categoryId)
          .order("name")

        if (error) {
          console.error("Error fetching sub-categories:", error)
          return
        }

        setSubCategories(data || [])

        const currentSubCategoryId = form.getValues("sub_category_id")
        if (currentSubCategoryId) {
          const isValid = data?.some((sc) => sc.id === currentSubCategoryId)
          if (!isValid) {
            form.setValue("sub_category_id", "")
          }
        }
      } catch (err) {
        console.error("Failed to fetch sub-categories:", err)
      }
    }

    fetchSubCategories()

    const subscription = form.watch((value, { name }) => {
      if (name === "category_id") {
        form.setValue("sub_category_id", "")
        fetchSubCategories()
      }
    })

    return () => subscription.unsubscribe()
  }, [form, supabase])

  // Fetch product data if editing
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return

      setIsFetching(true)

      try {
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single()

        if (productError) throw productError

        const { data: images, error: imagesError } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productId)
          .order("is_primary", { ascending: false })

        if (imagesError) throw imagesError

        form.reset({
          name: product.name,
          description: product.description || "",
          per: product?.per || "",
          price: product.price?.toString() || "",
          selling_price: product.selling_price?.toString() || "",
          stock: product.stock?.toString() || "",
          category_id: product.category_id || "",
          sub_category_id: product.sub_category_id || "",
          brand: product.brand || "",
          hsn_code: product.hsn_code || "",
          gst_percentage: product.gst_percentage?.toString() || "",
          discount_percentage: product.discount_percentage?.toString() || "",
          weight: product.weight?.toString() || "",
          unit_of_measurement: product.unit_of_measurement || "",
          mrp: product.mrp?.toString() || "",
          cost_price: product.cost_price?.toString() || "",
        })

        setProductImages(images || [])
      } catch (error) {
        console.error("Error fetching product data:", error)
        toast({
          title: "Error",
          description: "Failed to load product data",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
      }
    }

    fetchProductData()
  }, [productId, supabase, form, toast])

  const onSubmit = async (values: ProductFormValues) => {
    setIsLoading(true)

    try {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("name")
        .eq("id", values.category_id)
        .single()

      const categoryName = categoryData?.name || "Uncategorized"
      const primaryImage = productImages.find((img) => img.is_primary)

      const tokenString = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      if (!tokenString) {
        throw new Error("User is not authenticated. No access token found.")
      }
      const parsedToken = JSON.parse(tokenString)
      const userId = parsedToken.user?.id || null

      let savedProductId: string

      if (productId) {
        const { data, error } = await supabase
          .from("products")
          .update({
            name: values.name,
            description: values.description,
            price: values.price,
            stock: values.stock,
            category: categoryName,
            selling_price: values.selling_price,
            category_id: values.category_id,
            sub_category_id: values.sub_category_id || null,
            brand: values.brand,
            updated_by: userId,
            per: values?.per,
            hsn_code: values.hsn_code,
            gst_percentage: values.gst_percentage,
            discount_percentage: values.discount_percentage,
            image_url: primaryImage?.image_url || null,
            approval_status: "approved",
            updated_at: new Date().toISOString(),
            weight: values.weight,
            unit_of_measurement: values.unit_of_measurement,
            mrp: values.mrp,
            cost_price: values.cost_price,
          })
          .eq("id", productId)
          .select()

        if (error) throw error
        savedProductId = productId
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({
            name: values.name,
            description: values.description,
            price: values.price,
            selling_price: values.selling_price,
            stock: values.stock,
            category: categoryName,
            category_id: values.category_id,
            sub_category_id: values.sub_category_id || null,
            brand: values.brand,
            per: values?.per || null,
            updated_by: userId,
            hsn_code: values.hsn_code,
            gst_percentage: values.gst_percentage,
            discount_percentage: values.discount_percentage,
            image_url: primaryImage?.image_url || null,
            approval_status: "approved",
            weight: values.weight,
            unit_of_measurement: values.unit_of_measurement,
            mrp: values.mrp,
            cost_price: values.cost_price,
          })
          .select()

        if (error) throw error
        savedProductId = data[0].id
      }

      if (removedImageIds.length > 0) {
        const { error } = await supabase.from("product_images").delete().in("id", removedImageIds)
        if (error) {
          console.error("Error deleting images:", error)
        }
      }

      const newPrimaryImage = productImages.find((img) => img.is_primary)
      if (newPrimaryImage) {
        const { error: productUpdateError } = await supabase
          .from("products")
          .update({ image_url: newPrimaryImage.image_url })
          .eq("id", savedProductId)

        if (productUpdateError) {
          console.error("Error updating product primary image:", productUpdateError)
        }

        const { error: resetError } = await supabase
          .from("product_images")
          .update({ is_primary: false })
          .eq("product_id", savedProductId)

        if (resetError) {
          console.error("Error resetting primary images:", resetError)
        }
      }

      for (const image of productImages) {
        if (image.id) {
          const { error } = await supabase
            .from("product_images")
            .update({ is_primary: image.is_primary })
            .eq("id", image.id)

          if (error) {
            console.error("Error updating image:", error)
          }
        } else {
          const { error } = await supabase.from("product_images").insert({
            product_id: savedProductId,
            image_url: image.image_url,
            is_primary: image.is_primary,
          })

          if (error) {
            console.error("Error inserting image:", error)
          }
        }
      }

      toast({
        title: "Success",
        description: `Product ${productId ? "updated" : "created"} successfully`,
      })

      router.push("/dashboard/products")
      router.refresh()
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUploaded = (imageUrl: string, isPrimary: boolean) => {
    setProductImages((prev) => {
      if (isPrimary) {
        return [...prev.map((img) => ({ ...img, is_primary: false })), { image_url: imageUrl, is_primary: true }]
      }
      if (prev.length === 0) {
        return [{ image_url: imageUrl, is_primary: true }]
      }
      return [...prev, { image_url: imageUrl, is_primary: false }]
    })
  }

  const handleImageRemoved = (imageId: string, imageUrl: string) => {
    setProductImages((prev) => prev.filter((img) => !(img.id === imageId || (!img.id && img.image_url === imageUrl))))
    if (imageId) {
      setRemovedImageIds((prev) => [...prev, imageId])
    }
  }

  const handleSetPrimaryImage = (imageId: string, imageUrl: string) => {
    setProductImages((prev) => {
      const updatedImages = prev.map((img) => ({
        ...img,
        is_primary: false,
      }))
      const imageIndex = updatedImages.findIndex((img) => img.id === imageId || (!img.id && img.image_url === imageUrl))
      if (imageIndex !== -1) {
        updatedImages[imageIndex].is_primary = true
      }
      return updatedImages
    })
  }

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter product description" className="min-h-32" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MRP</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              { (
                <FormField
                  control={form.control}
                  name="selling_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="per"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Per</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product per unit for example litre.." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Percentage (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gst_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Percentage (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_of_measurement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measurement</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., kg, g, l, ml" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
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
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sub_category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={!form.getValues("category_id")}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !form.getValues("category_id")
                              ? "Select a category first"
                              : subCategories.length === 0
                                ? "No sub-categories available"
                                : "Select a sub-category"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subCategories.length === 0 ? (
                        <SelectItem value="no-subcategories" disabled>
                          No sub-categories available
                        </SelectItem>
                      ) : (
                        subCategories.map((subCategory) => (
                          <SelectItem key={subCategory.id} value={subCategory.id}>
                            {subCategory.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter brand name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hsn_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSN Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter HSN code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductImageManager
              images={productImages}
              onImageUploaded={handleImageUploaded}
              onImageRemoved={handleImageRemoved}
              onSetPrimaryImage={handleSetPrimaryImage}
              maxImages={5}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {productId ? "Update" : "Create"} Product
          </Button>
        </div>
      </form>
    </Form>
  )
}
