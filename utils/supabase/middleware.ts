import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  console.log("Middleware running for path:", request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If no user and trying to access protected routes, redirect to login
    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // If user is logged in and trying to access login page, redirect to dashboard
    if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/")) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("Middleware error:", error)

    // If there's an error in middleware, allow the request to continue
    // This prevents middleware errors from blocking the application
    return supabaseResponse
  }
}
