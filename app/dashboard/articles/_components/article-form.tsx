"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { X } from "lucide-react"

interface Article {
  id: string
  name: string | null
  description: string | null
  weight: number | null
  unit_of_measurement: string | null
  category_id: string | null
  sub_category_id: string | null
  mrp: number | null
  cost_price: number | null
  product_photos: string[] | null
  hsn_code: string | null
  gst_percentage: number | null
}

interface Category {
  id: string
  name: string
  parent_id: string | null
}

interface ArticleFormProps {
  article?: Article
  categories: Category[]
}

export function ArticleForm({ article, categories }: ArticleFormProps) {
  const [name, setName] = useState(article?.name || "")
  const [description, setDescription] = useState(article?.description || "")
  const [weight, setWeight] = useState(article?.weight?.toString() || "")
  const [unitOfMeasurement, setUnitOfMeasurement] = useState(article?.unit_of_measurement || "")
  const [categoryId, setCategoryId] = useState(article?.category_id || "")
  const [subCategoryId, setSubCategoryId] = useState(article?.sub_category_id || "")
  const [mrp, setMrp] = useState(article?.mrp?.toString() || "")
  const [costPrice, setCostPrice] = useState(article?.cost_price?.toString() || "")
  const [productPhotos, setProductPhotos] = useState<string[]>(article?.product_photos || [])
  const [hsnCode, setHsnCode] = useState(article?.hsn_code || "")
  const [gstPercentage, setGstPercentage] = useState(article?.gst_percentage?.toString() || "")
  const [photoUrl, setPhotoUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Filter subcategories based on selected category
  const [subCategories, setSubCategories] = useState<Category[]>([])

  useEffect(() => {
    if (categoryId) {
      const filtered = categories.filter((cat) => cat.parent_id === categoryId)
      setSubCategories(filtered)

      // Reset subcategory if not in filtered list
      if (filtered.length > 0 && !filtered.some((cat) => cat.id === subCategoryId)) {
        setSubCategoryId("")
      }
    } else {
      setSubCategories([])
      setSubCategoryId("")
    }
  }, [categoryId, categories, subCategoryId])

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  const addPhoto = () => {
    if (photoUrl && !productPhotos.includes(photoUrl)) {
      setProductPhotos([...productPhotos, photoUrl])
      setPhotoUrl("")
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = [...productPhotos]
    newPhotos.splice(index, 1)
    setProductPhotos(newPhotos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const articleData = {
        name,
        description,
        weight: weight ? Number.parseFloat(weight) : null,
        unit_of_measurement: unitOfMeasurement || null,
        category_id: categoryId || null,
        sub_category_id: subCategoryId || null,
        mrp: mrp ? Number.parseFloat(mrp) : null,
        cost_price: costPrice ? Number.parseFloat(costPrice) : null,
        product_photos: productPhotos.length > 0 ? productPhotos : null,
        hsn_code: hsnCode || null,
        gst_percentage: gstPercentage ? Number.parseFloat(gstPercentage) : null,
      }

      if (article) {
        // Update existing article
        const { error } = await supabase.from("articles").update(articleData).eq("id", article.id)

        if (error) throw error

        toast({
          title: "Article updated",
          description: "The article has been updated successfully.",
        })
      } else {
        // Create new article
        const { error } = await supabase.from("articles").insert(articleData)

        if (error) throw error

        toast({
          title: "Article created",
          description: "The article has been created successfully.",
        })
      }

      router.push("/dashboard/articles")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage.from("productsimages").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) throw error

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("productsimages").getPublicUrl(filePath)

      // Add the URL to product photos
      setProductPhotos([...productPhotos, publicUrl])

      // Reset the file input
      e.target.value = ""

      toast({
        title: "Image uploaded",
        description: "The image has been uploaded successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // Get parent categories (those without a parent)
  const parentCategories = categories.filter((cat) => !cat.parent_id)

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hsn-code">HSN Code</Label>
              <Input id="hsn-code" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input id="weight" type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit of Measurement</Label>
              <Select value={unitOfMeasurement} onValueChange={setUnitOfMeasurement}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit of measurement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg (Kilogram)</SelectItem>
                  <SelectItem value="g">g (Gram)</SelectItem>
                  <SelectItem value="mg">mg (Milligram)</SelectItem>
                  <SelectItem value="l">l (Liter)</SelectItem>
                  <SelectItem value="ml">ml (Milliliter)</SelectItem>
                  <SelectItem value="pcs">pcs (Pieces)</SelectItem>
                  <SelectItem value="box">box (Box)</SelectItem>
                  <SelectItem value="pack">pack (Pack)</SelectItem>
                  <SelectItem value="dozen">dozen (Dozen)</SelectItem>
                  <SelectItem value="unit">unit (Unit)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst">GST Percentage</Label>
              <Input
                id="gst"
                type="number"
                step="0.01"
                value={gstPercentage}
                onChange={(e) => setGstPercentage(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parentCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-category">Sub Category</Label>
              <Select value={subCategoryId} onValueChange={setSubCategoryId} disabled={subCategories.length === 0}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      categoryId
                        ? subCategories.length > 0
                          ? "Select a sub category"
                          : "No sub categories available"
                        : "Select a category first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {subCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP (₹)</Label>
              <Input id="mrp" type="number" step="0.01" value={mrp} onChange={(e) => setMrp(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost-price">Cost Price (₹)</Label>
              <Input
                id="cost-price"
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Photos</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {productPhotos.map((photo, index) => (
                <div key={index} className="relative h-20 w-20 group">
                  <Image
                    src={photo || "/placeholder.svg"}
                    alt={`Product photo ${index + 1}`}
                    fill
                    className="object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload Image</Label>
                <div className="flex gap-2">
                  <Input id="file-upload" type="file" accept="image/*" onChange={handleFileUpload} className="flex-1" />
                  {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                </div>
              </div>

              {/* Hidden for now - URL input method
              <div className="space-y-2">
                <Label htmlFor="photo-url">Or Add Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="photo-url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Enter photo URL"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addPhoto} variant="secondary" disabled={uploading}>
                    Add
                  </Button>
                </div>
              </div>
              */}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/articles")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : article ? "Update Article" : "Create Article"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
