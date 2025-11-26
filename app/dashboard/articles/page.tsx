"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Article {
  id: string
  name: string | null
  description: string | null
  category_id: string | null
  mrp: number | null
  cost_price: number | null
  product_photos: string[] | null
  gst_percentage: number | null
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null)

  // Function to handle delete button click
  const handleDeleteClick = (article: Article) => {
    setArticleToDelete(article)
    setDeleteDialogOpen(true)
  }

  const columns: ColumnDef<Article>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "product_photos",
      header: "Image",
      cell: ({ row }) => {
        const photos = row.getValue("product_photos") as string[] | null
        const firstPhoto = photos && photos.length > 0 ? photos[0] : null

        return firstPhoto ? (
          <div className="h-10 w-10 relative">
            <Image
              src={firstPhoto || "/placeholder.svg"}
              alt={(row.getValue("name") as string) || "Product"}
              fill
              className="object-cover rounded-md"
            />
          </div>
        ) : (
          <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
            No img
          </div>
        )
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => row.getValue("name") || "Unnamed Product",
    },
    {
      accessorKey: "mrp",
      header: "MRP",
      cell: ({ row }) => {
        const mrp = row.getValue("mrp") as number | null
        return mrp !== null ? `₹${mrp.toFixed(2)}` : "-"
      },
    },
    {
      accessorKey: "cost_price",
      header: "Cost Price",
      cell: ({ row }) => {
        const costPrice = row.getValue("cost_price") as number | null
        return costPrice !== null ? `₹${costPrice.toFixed(2)}` : "-"
      },
    },
    {
      accessorKey: "gst_percentage",
      header: "GST %",
      cell: ({ row }) => {
        const gst = row.getValue("gst_percentage") as number | null
        return gst !== null ? `${gst}%` : "-"
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const article = row.original
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/articles/${article.id}`}>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-100"
              onClick={(e) => {
                e.preventDefault()
                handleDeleteClick(article)
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )
      },
    },
  ]

  async function deleteArticle(id: string) {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from("articles").delete().eq("id", id)

      if (error) {
        throw error
      }

      // Remove the article from the state
      setArticles(articles.filter((article) => article.id !== id))
      toast({
        title: "Article deleted",
        description: "The article has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting article:", error)
      toast({
        title: "Error",
        description: "Failed to delete the article. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    async function fetchArticles() {
      try {
        const supabase = createSupabaseClient()
        const { data } = await supabase.from("articles").select("*").order("created_at", { ascending: false })
        setArticles(data || [])
      } catch (error) {
        console.error("Error fetching articles:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Articles</h1>
        <Link href="/dashboard/articles/new">
          <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Article
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading articles...</div>
      ) : (
        <DataTable
          columns={columns}
          data={articles}
          searchColumn="name"
          searchPlaceholder="Search articles..."
          showGstColumn={false} // Set to false since we already include the GST column in the columns definition
        />
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this article?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the article "
              {articleToDelete?.name || "Unnamed Article"}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (articleToDelete) {
                  deleteArticle(articleToDelete.id)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
