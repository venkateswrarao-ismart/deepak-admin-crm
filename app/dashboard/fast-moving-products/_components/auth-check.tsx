"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"

type AuthCheckProps = {
  children: React.ReactNode
}

export function AuthCheck({ children }: AuthCheckProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated using local storage
    try {
      const authDataString = localStorage.getItem("sb-sqpgtmpbfmtaivbfsjuy-auth-token")
      if (!authDataString) {
        setIsAuthenticated(false)
        return
      }

      const authData = JSON.parse(authDataString)

      // Check if token is expired
      if (authData.expires_at && authData.expires_at < Math.floor(Date.now() / 1000)) {
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(true)
    } catch (error) {
      console.error("Error checking authentication:", error)
      setIsAuthenticated(false)
    }
  }, [])

  useEffect(() => {
    // Redirect to login if not authenticated
    if (isAuthenticated === false) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated === false) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <p>You need to be logged in to view this page. Redirecting to login...</p>
        </div>
      </Card>
    )
  }

  return <>{children}</>
}
