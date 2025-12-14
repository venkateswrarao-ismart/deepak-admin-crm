// /categories/new/page.tsx
"use client"

import { createSupabaseClient } from "@/lib/supabase"
import { CategoryForm } from "../_components/category-form"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface ParentCategory {
  id: string
  name: string
}

export default function NewCategoryPage() {
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchParentCategories() {
      try {
        const supabase = createSupabaseClient()
        const { data, error } = await supabase
          .from("categories")
          .select("id, name")
          .is("parent_id", null)
          .eq("company", "rentxp") // Only show RentXP parent categories
          .order("name")

        if (error) throw error

        setParentCategories(data || [])
      } catch (error) {
        console.error("Error fetching parent categories:", error)
        toast({
          title: "Error",
          description: "Failed to load parent categories",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchParentCategories()
  }, [toast])

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create New Category</h1>
        <button
          onClick={() => router.push("/dashboard/categories")}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Back to Categories
        </button>
      </div>
      <CategoryForm parentCategories={parentCategories} />
    </div>
  )
}