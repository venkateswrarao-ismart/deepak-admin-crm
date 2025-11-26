import { createSupabaseServerClient } from "@/lib/supabase"
import SalesManagersPageClient from "./_components/salesManagersPageClient"

export default async function SalesManagersPage({ searchParams }: { searchParams: { search?: string } }) {
  const supabase = createSupabaseServerClient()
  const search = searchParams.search || ""

  let query = supabase
    .from("sales_managers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data: managers, count, error } = await query

  if (error) {
    console.error("Error fetching sales managers:", error)
  }

  return (
    <SalesManagersPageClient managers={managers || []} count={count || 0} search={search} />
  )
}
