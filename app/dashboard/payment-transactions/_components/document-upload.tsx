"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { Upload, File, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DocumentUploadProps {
  onUploadComplete: (url: string) => void
  currentDocUrl?: string
}

export function DocumentUpload({ onUploadComplete, currentDocUrl }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(currentDocUrl || null)
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, JPEG, or PNG files only.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    const supabase = createClient()

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `payment-documents/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from("productsimages").upload(fileName, file)

      if (error) {
        throw error
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("productsimages").getPublicUrl(fileName)

      setUploadedFile(publicUrl)
      onUploadComplete(publicUrl)

      toast({
        title: "Document uploaded",
        description: "Document has been uploaded successfully.",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async () => {
    if (!uploadedFile) return

    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Extract file path from the URL
      const url = new URL(uploadedFile)
      const filePath = url.pathname.split("/").slice(-2).join("/") // Gets "payment-documents/filename.ext"

      // Delete from Supabase Storage
      const { error: deleteError } = await supabase.storage.from("productsimages").remove([filePath])

      if (deleteError) {
        console.error("Error deleting file from storage:", deleteError)
        // Continue anyway to remove the reference
      }

      // Update the component state
      setUploadedFile(null)
      onUploadComplete("")
      setShowDeleteDialog(false)

      toast({
        title: "Document deleted",
        description: "Document has been removed successfully.",
      })
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Label>Supporting Document (Optional)</Label>

      {uploadedFile ? (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
          <File className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium">Document uploaded</p>
            <a
              href={uploadedFile}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              View document
            </a>
          </div>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this document? This action cannot be undone and the file will be
                  permanently removed from storage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteDocument}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Upload receipt, invoice, or supporting document</p>
            <p className="text-xs text-gray-500">PDF, JPEG, PNG up to 5MB</p>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="document-upload"
            />
            <Label htmlFor="document-upload" className="cursor-pointer">
              <Button type="button" variant="outline" disabled={isUploading} className="mt-2" asChild>
                <span>{isUploading ? "Uploading..." : "Choose File"}</span>
              </Button>
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}
