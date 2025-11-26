import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Parse query parameters
    const url = new URL(request.url)
    const daysActive = Number.parseInt(url.searchParams.get("days") || "2", 10)
    const searchTerm = url.searchParams.get("search") || null
    const sortBy = url.searchParams.get("sort_by") || "last_sign_in_at"
    const sortOrder = url.searchParams.get("sort_order") || "desc"

    // Remove limit to get all active users
    // const limit = Number.parseInt(url.searchParams.get("limit") || "200", 10)
    // const offset = Number.parseInt(url.searchParams.get("offset") || "0", 10)

    // Execute the query as a stored procedure with parameters
    const { data, error } = await supabaseAdmin.rpc("get_active_customers", {
      days_active: daysActive,
      search_term: searchTerm,
      sort_by: sortBy,
      sort_order: sortOrder,
      // Remove limit and offset to get all active users
      // p_limit: limit,
      // p_offset: offset,
    })

    if (error) throw error

    // Extract total count from the first row
    const totalCount = data && data.length > 0 ? data[0].total_count : 0

    return NextResponse.json({
      activeCustomers: data || [],
      pagination: {
        total: totalCount,
        // No longer using limit/offset
        // limit,
        // offset,
        // hasMore: offset + limit < totalCount,
      },
    })
  } catch (error) {
    console.error("Error fetching active customers:", error)
    return NextResponse.json({ error: "Failed to fetch active customers" }, { status: 500 })
  }
}
