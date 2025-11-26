import { createSupabaseServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { ArticleForm } from "../_components/article-form"

interface ArticlePageProps {
  params: {
    id: string
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const supabase = createSupabaseServerClient()

  // Fetch categories for dropdowns
  const { data: categories } = await supabase.from("categories").select("id, name, parent_id").order("name")

  // If it's a new article
  if (params.id === "new") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Add Article</h1>
        <ArticleForm categories={categories || []} />
      </div>
    )
  }

  // Fetch the article
  const { data: article } = await supabase.from("articles").select("*").eq("id", params.id).single()

  if (!article) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Article</h1>
      <ArticleForm article={article} categories={categories || []} />
    </div>
  )
}
