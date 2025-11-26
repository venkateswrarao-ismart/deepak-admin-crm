"use client"

import { useState } from "react"
import Image from "next/image"

export function ProductImageGallery({ images, productName }: { images: any[], productName: string }) {
  // Find primary image or use first image as default
  const primaryImage = images.find((img) => img.is_primary) || images[0]
  const [selectedImage, setSelectedImage] = useState(primaryImage || null)

  return (
    <div className="space-y-4">
      {/* Main image display - shows only the selected image */}
      {selectedImage ? (
        <div className="aspect-video relative rounded-lg overflow-hidden border">
          <Image
            src={selectedImage.image_url || "/placeholder.svg"}
            alt={`${productName} - Main view`}
            fill
            className="object-contain"
            priority
          />
        </div>
      ) : (
        <div className="aspect-video flex items-center justify-center bg-muted rounded-lg">
          No image available
        </div>
      )}

      {/* Thumbnail grid - shows all images except the currently selected one */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((image) => (
            <button
              key={image.id}
              className={`aspect-square relative rounded-md overflow-hidden border transition-all ${
                image.id === selectedImage?.id 
                  ? "ring-2 ring-primary" 
                  : "hover:ring-2 hover:ring-primary"
              }`}
              onClick={() => setSelectedImage(image)}
            >
              <Image
                src={image.image_url || "/placeholder.svg"}
                alt={`${productName} - Thumbnail`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>

        
      )}


      
    </div>
  )
}
