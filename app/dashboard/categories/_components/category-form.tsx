"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface Category {
  id: string
  name: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  is_active: boolean | null
}

interface ParentCategory {
  id: string
  name: string
}

interface CategoryFormProps {
  category?: Category
  parentCategories: ParentCategory[]
}

export function CategoryForm({ category, parentCategories }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || "")
  const [description, setDescription] = useState(category?.description || "")
  const [imageUrl, setImageUrl] = useState(category?.image_url || "")
  const [parentId, setParentId] = useState(category?.parent_id || "")
  const [isActive, setIsActive] = useState(category?.is_active !== false) // Default to true
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `categories/${fileName}`

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

      // Set the URL to the state
      setImageUrl(publicUrl)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (category) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update({
            name,
            description,
            image_url: imageUrl || null,
            parent_id: parentId || null,
            is_active: isActive,
          })
          .eq("id", category.id)

        if (error) throw error

        toast({
          title: "Category updated",
          description: "The category has been updated successfully.",
        })
      } else {
        // Create new category
        const { error } = await supabase.from("categories").insert({
          name,
          description,
          image_url: imageUrl || null,
          parent_id: parentId || null,
          is_active: isActive,
        })

        if (error) throw error

        toast({
          title: "Category created",
          description: "The category has been created successfully.",
        })
      }

      router.push("/dashboard/categories")
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

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-url">Image</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="flex-1"
                  disabled={uploading}
                />
                {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
              </div>
              {imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt="Category preview"
                    className="h-20 w-20 object-cover rounded-md border"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setImageUrl("")}>
                    Remove
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="h-px flex-1 bg-border"></div>
              </div>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter image URL directly"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-category">Parent Category</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {parentCategories.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="is-active">Active</Label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/categories")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || uploading}>
            {loading ? "Saving..." : category ? "Update Category" : "Create Category"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
