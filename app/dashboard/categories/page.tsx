"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "@/components/ui/use-toast"
import { Trash2 } from "lucide-react"

interface Category {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  is_active: boolean | null
  created_at: string | null
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  // Add the columns definition here
  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">{row.getValue("description") || "No description"}</div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active")
        return <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const category = row.original
        return (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/categories/${category.id}`}>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation()
                setCategoryToDelete(category)
                setDeleteDialogOpen(true)
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

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        const supabase = createSupabaseClient()
        const { data, error } = await supabase.from("categories").select("*").order("name")

        if (error) throw error

        setCategories(data || [])
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast({
          title: "Error",
          description: "Failed to fetch categories. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  async function deleteCategory(id: string) {
    try {
      const supabase = createSupabaseClient()

      // Check if this category has subcategories
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from("categories")
        .select("id")
        .eq("parent_id", id)

      if (subcategoriesError) throw subcategoriesError

      if (subcategories && subcategories.length > 0) {
        toast({
          title: "Cannot delete category",
          description: "This category has subcategories. Please delete the subcategories first.",
          variant: "destructive",
        })
        return
      }

      // Check if this category is used by any articles
      const { data: articles, error: articlesError } = await supabase
        .from("articles")
        .select("id")
        .eq("category_id", id)

      if (articlesError) throw articlesError

      if (articles && articles.length > 0) {
        toast({
          title: "Cannot delete category",
          description: "This category is used by articles. Please reassign the articles first.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) {
        throw error
      }

      // Remove the category from the state
      setCategories(categories.filter((category) => category.id !== id))
      toast({
        title: "Category deleted",
        description: "The category has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to delete the category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  // Add a column to show if it's a subcategory
  const columnsWithType: ColumnDef<Category>[] = [
    ...columns,
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const parentId = row.original.parent_id
        return <Badge variant={parentId ? "outline" : "default"}>{parentId ? "Subcategory" : "Main Category"}</Badge>
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Link href="/dashboard/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading categories...</div>
      ) : (
        <DataTable
          columns={columnsWithType}
          data={categories}
          searchColumn="name"
          searchPlaceholder="Search categories..."
          hierarchical={true}
        />
      )}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category "
              {categoryToDelete?.name || "Unnamed Category"}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (categoryToDelete) {
                  deleteCategory(categoryToDelete.id)
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
