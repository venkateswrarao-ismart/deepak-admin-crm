"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { X, Loader2, ImageIcon } from "lucide-react"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface DiscountBannerImageUploadProps {
  onImageUploaded: (url: string) => void
  onImageRemoved?: () => void
  existingImageUrl?: string
}

export function DiscountBannerImageUpload({
  onImageUploaded,
  onImageRemoved,
  existingImageUrl,
}: DiscountBannerImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | null>(existingImageUrl || null)

  const supabase = createClient()

  const uploadImage = useCallback(
    async (file: File) => {
      setIsUploading(true)
      setUploadProgress(0)

      try {
        const fileExt = file.name.split(".").pop()
        const fileName = `discount-banners/${uuidv4()}.${fileExt}`
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

        setImageUrl(publicUrl)
        onImageUploaded(publicUrl)

        console.log("Discount banner image uploaded:", publicUrl)
      } catch (error) {
        console.error("Error uploading discount banner image:", error)
        alert("Error uploading image. Please try again.")
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [onImageUploaded, supabase.storage],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        uploadImage(file)
      }
      e.target.value = ""
    },
    [uploadImage],
  )

  const removeImage = useCallback(() => {
    setImageUrl(null)
    onImageRemoved?.()
  }, [onImageRemoved])

  return (
    <div className="space-y-4">
      {imageUrl ? (
        <div className="relative rounded-md overflow-hidden border">
          <div className="aspect-[16/5] relative">
            <Image src={imageUrl || "/placeholder.svg"} alt="Discount banner image" fill className="object-cover" />
          </div>
          <div className="absolute top-2 right-2">
            <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={removeImage}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-dashed rounded-md aspect-[16/5] flex items-center justify-center">
          <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload discount banner</p>
                  <p className="text-xs text-muted-foreground mt-1">Recommended size: 1920x600px (16:5 aspect ratio)</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
          </label>
        </div>
      )}
    </div>
  )
}
