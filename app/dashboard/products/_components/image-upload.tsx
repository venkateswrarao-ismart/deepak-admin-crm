"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { X, Upload, Loader2 } from "lucide-react"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface ImageUploadProps {
  onImageUploaded: (url: string, isPrimary: boolean) => void
  onImageRemoved?: (url: string) => void
  existingImages?: { id: string; image_url: string; is_primary: boolean | null }[]
  maxImages?: number
}

export function ImageUpload({ onImageUploaded, onImageRemoved, existingImages = [], maxImages = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [images, setImages] = useState<{ url: string; isPrimary: boolean }[]>([])

  const supabase = createClient()

  // Initialize images from existingImages
  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      const formattedImages = existingImages.map((img) => ({
        url: img.image_url,
        isPrimary: !!img.is_primary,
      }))

      setImages(formattedImages)

      // Notify parent component about existing images
      formattedImages.forEach((img) => {
        onImageUploaded(img.url, img.isPrimary)
      })
    }
  }, [existingImages, onImageUploaded])

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

        // First image is primary by default, or if no primary image exists yet
        const isPrimary = images.length === 0 || !images.some((img) => img.isPrimary)

        // Update local state
        setImages((prev) => {
          const updatedImages = prev.map((img) => ({
            ...img,
            isPrimary: isPrimary ? false : img.isPrimary,
          }))

          return [...updatedImages, { url: publicUrl, isPrimary }]
        })

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

  const removeImage = useCallback(
    (url: string) => {
      const wasRemoved = images.find((img) => img.url === url)

      setImages((prev) => {
        const filteredImages = prev.filter((img) => img.url !== url)

        // If we removed the primary image, make the first remaining image primary
        if (wasRemoved?.isPrimary && filteredImages.length > 0) {
          filteredImages[0].isPrimary = true
          // Notify parent about the new primary image
          onImageUploaded(filteredImages[0].url, true)
        }

        return filteredImages
      })

      if (onImageRemoved) {
        onImageRemoved(url)
      }
    },
    [images, onImageRemoved, onImageUploaded],
  )

  const setPrimaryImage = useCallback(
    (url: string) => {
      setImages((prev) => {
        const updatedImages = prev.map((img) => ({
          ...img,
          isPrimary: img.url === url,
        }))
        return updatedImages
      })

      onImageUploaded(url, true)
    },
    [onImageUploaded],
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className={`relative rounded-md overflow-hidden border h-40 ${
              image.isPrimary ? "ring-2 ring-primary" : ""
            }`}
          >
            <Image
              src={image.url || "/placeholder.svg"}
              alt={`Product image ${index + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeImage(image.url)}
              >
                <X className="h-4 w-4" />
              </Button>
              {!image.isPrimary && (
                <Button type="button" variant="secondary" size="sm" onClick={() => setPrimaryImage(image.url)}>
                  Set as primary
                </Button>
              )}
            </div>
            {image.isPrimary && (
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
