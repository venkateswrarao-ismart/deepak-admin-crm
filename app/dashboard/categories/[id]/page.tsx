import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { CategoryForm } from "../_components/category-form"

interface CategoryPageProps {
  params: {
    id: string
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const supabase = createSupabaseServerClient()

  // If it's a new category
  if (params.id === "new") {
    // Fetch parent categories for dropdown
    const { data: parentCategories } = await supabase.from("categories").select("id, name").order("name")

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Add Category</h1>
        <CategoryForm parentCategories={parentCategories || []} />
      </div>
    )
  }

  // Fetch the category
  const { data: category } = await supabase.from("categories").select("*").eq("id", params.id).single()

  if (!category) {
    notFound()
  }

  // Fetch parent categories for dropdown
  const { data: parentCategories } = await supabase
    .from("categories")
    .select("id, name")
    .neq("id", params.id) // Exclude current category
    .order("name")

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Category</h1>
      <CategoryForm category={category} parentCategories={parentCategories || []} />
    </div>
  )
}
