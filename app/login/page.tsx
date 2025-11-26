"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
// import toast from "react-hot-toast" // Import react-hot-toast

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const { toast: shadcnToast } = useToast() // Rename to avoid conflict
  const supabase = createClient()

  // Log when component mounts to verify it's loading
  useEffect(() => {
    console.log("Login page mounted")
  }, [])

  // Check if user is already logged in
  useEffect(() => {
    async function checkSession() {
      console.log("Checking session...")
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        console.log("Session check result:", session ? "Session exists" : "No session")
        if (session) {
          // User is already logged in, redirect to dashboard
          console.log("User already logged in, redirecting to dashboard")
         // window.location.href = "/dashboard"
        } else {
          setCheckingSession(false)
        }
      } catch (error) {
        console.error("Error checking session:", error)
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [supabase.auth])

  // Modify the handleLogin function to check for admin role after successful authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log("Login attempt started for email:", email)

    try {
      console.log("Calling Supabase auth.signInWithPassword...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Supabase auth error:", error)
        throw error
      }

      console.log("Authentication successful, checking user role...")
      // Get the user's profile to check their role
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      console.log("Profile data:", profileData, "Profile error:", profileError)

      if (profileError) {
        // Sign out the user if we can't verify their role
        console.error("Error fetching user profile:", profileError)
        await supabase.auth.signOut()
        throw new Error("Could not verify user role. Please try again.")
      }

      // Check if the user has the admin role
      if (profileData?.role !== "admin") {
        console.error("User does not have admin role:", profileData?.role)
        // Sign out the user if they don't have admin role
        await supabase.auth.signOut()
        throw new Error("Access denied. Only administrators can access this dashboard.")
      }

      console.log("Login successful, showing toast notifications...")

      // Try both toast systems
      try {
        shadcnToast({
          title: "Login successful ",
          description: "Redirecting to dashboard...",
        })
        console.log("shadcn/ui toast called")
      } catch (toastError) {
        console.error("Error with shadcn/ui toast:", toastError)
      }

      // Use react-hot-toast as backup
      // toast.success("Login successful! Redirecting to dashboard...")
      // console.log("react-hot-toast called")

      console.log("Redirecting to dashboard...")
      // Force a complete page reload to ensure clean state
     // window.location.replace("/dashboard")
    } catch (error: any) {
      console.error("Login failed:", error)

      // Try both toast systems for error
      try {
        shadcnToast({
          title: "Login failed ",
          description: error.message,
          variant: "destructive",
        })
        console.log("shadcn/ui error toast called")
      } catch (toastError) {
        console.error("Error showing shadcn/ui error toast:", toastError)
      }

      // // Use react-hot-toast as backup
      // toast.error(`Login failed: ${error.message}`)
      // console.log("react-hot-toast error called")

      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <Card className="w-full max-w-md shadow-lg border-2 border-orange-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Inventory Management System</CardTitle>
          <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-orange-400 hover:bg-orange-500 text-white" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary-foreground" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>

            {/* Add test buttons for toast */}
            <div className="flex space-x-2 w-full">
             
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
