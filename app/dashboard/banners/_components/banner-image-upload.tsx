"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { X, Loader2, ImageIcon } from "lucide-react"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface BannerImageUploadProps {
  onImageUploaded: (url: string) => void
  onImageRemoved?: () => void
  existingImageUrl?: string
}

export function BannerImageUpload({ onImageUploaded, onImageRemoved, existingImageUrl }: BannerImageUploadProps) {
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
        const fileName = `banners/${uuidv4()}.${fileExt}`
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

        // Update local state
        setImageUrl(publicUrl)

        // Notify parent component
        onImageUploaded(publicUrl)

        console.log("Banner image uploaded successfully:", publicUrl)
      } catch (error) {
        console.error("Error uploading banner image:", error)
        alert("Error uploading banner image. Please try again.")
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
      // Reset the input value so the same file can be selected again
      e.target.value = ""
    },
    [uploadImage],
  )

  const removeImage = useCallback(() => {
    setImageUrl(null)
    if (onImageRemoved) {
      onImageRemoved()
    }
  }, [onImageRemoved])

  return (
    <div className="space-y-4">
      {imageUrl ? (
        <div className="relative rounded-md overflow-hidden border">
          <div className="aspect-[16/9] relative">
            <Image src={imageUrl || "/placeholder.svg"} alt="Banner image" fill className="object-cover" />
          </div>
          <div className="absolute top-2 right-2">
            <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={removeImage}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-dashed rounded-md aspect-[16/9] flex items-center justify-center">
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
                  <p className="text-sm text-muted-foreground">Click to upload banner image</p>
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
