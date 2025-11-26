import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    // Get the access token from cookies
    const cookieStore = cookies()
    const accessToken = cookieStore.get("sb-sqpgtmpbfmtaivbfsjuy-auth-token")?.value

    let token = accessToken

    // If the token is in JSON format, parse it to extract the access_token
    if (token && token.includes('"access_token"')) {
      try {
        const parsedToken = JSON.parse(token)
        token = parsedToken.access_token
      } catch (e) {
        console.error("Error parsing token:", e)
      }
    }

    if (!token) {
      console.warn("No access token found in cookies")
      // Continue without token - the external API might not require it for testing
    }

    // Call the external API
    const apiUrl = `https://v0-duplicateversionofgroceryapis-o1ymx0.vercel.app/api/orders/update-status/${orderId}`

    console.log(`Calling external API: ${apiUrl} with status: ${status}`)

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status }),
      cache: "no-store",
    })

    // Check if the response is JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      // If not JSON, get the text and log it for debugging
      const text = await response.text()
      console.error("External API returned non-JSON response:", text)
      return NextResponse.json(
        { error: "External API returned non-JSON response", details: text.substring(0, 200) },
        { status: response.status },
      )
    }

    if (!response.ok) {
      const errorData = await response.json()
      console.error("External API error:", errorData)
      return NextResponse.json(
        { error: "Failed to update status in external service", details: errorData },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Server error in notify-status-update:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
