"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { X, Upload, Loader2 } from "lucide-react"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface ProductImage {
  id?: string
  image_url: string
  is_primary: boolean
}

interface ProductImageManagerProps {
  images: ProductImage[]
  onImageUploaded: (imageUrl: string, isPrimary: boolean) => void
  onImageRemoved: (imageId: string, imageUrl: string) => void
  onSetPrimaryImage: (imageId: string, imageUrl: string) => void
  maxImages?: number
}

export function ProductImageManager({
  images,
  onImageUploaded,
  onImageRemoved,
  onSetPrimaryImage,
  maxImages = 5,
}: ProductImageManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const supabase = createClient()

  const uploadImage = useCallback(
    async (file: File) => {
      if (images.length >= maxImages) {
        alert(`You can only upload a maximum of ${maxImages} images`)
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        const fileExt = file.name.split(".").pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage.from("productsimages").upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100))
          },
        })

        if (uploadError) {
          throw uploadError
        }

        const { data: urlData } = supabase.storage.from("productsimages").getPublicUrl(filePath)
        const publicUrl = urlData.publicUrl

        // Determine if this should be the primary image (first image is primary by default)
        const isPrimary = images.length === 0

        // Notify parent component
        onImageUploaded(publicUrl, isPrimary)

        console.log("Image uploaded successfully:", publicUrl, "isPrimary:", isPrimary)
      } catch (error) {
        console.error("Error uploading image:", error)
        alert("Error uploading image. Please try again.")
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [images, maxImages, onImageUploaded, supabase.storage],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        uploadImage(file)
      }
      // Reset the input value so the same file can be selected again
      e.target.value = ""
    },
    [uploadImage],
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.map((image) => (
          <div
            key={image.id || image.image_url}
            className={`relative rounded-md overflow-hidden border h-40 ${
              image.is_primary ? "ring-2 ring-primary" : ""
            }`}
          >
            <Image src={image.image_url || "/placeholder.svg"} alt="Product image" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => onImageRemoved(image.id || "", image.image_url)}
              >
                <X className="h-4 w-4" />
              </Button>
              {!image.is_primary && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onSetPrimaryImage(image.id || "", image.image_url)}
                >
                  Set as primary
                </Button>
              )}
            </div>
            {image.is_primary && (
              <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-sm">
                Primary
              </div>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <div className="border border-dashed rounded-md h-40 flex items-center justify-center">
            <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Upload up to {maxImages} images. First image will be set as primary by default.
      </p>
    </div>
  )
}
